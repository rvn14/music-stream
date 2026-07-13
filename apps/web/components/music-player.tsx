"use client";

import Hls from "hls.js";
import {
  Music2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getLatestCheckpoint,
  readLocalCheckpoint,
  writeLocalCheckpoint,
} from "@/lib/checkpoints";
import type { PlaybackCheckpoint } from "@/lib/checkpoints";
import { streamBaseUrl, type DemoSong } from "@/lib/demo-data";

type MusicPlayerProps = {
  song: DemoSong;
  userId: string;
  playRequest: number;
  restoreCheckpoint: PlaybackCheckpoint | null;
  onNext: () => void;
  onPrevious: () => void;
};

const coverBySongId: Record<string, string> = {
  "song-001": "linear-gradient(135deg, #2563eb, #38bdf8)",
  "song-002": "linear-gradient(135deg, #0891b2, #5eead4)",
  "song-003": "linear-gradient(135deg, #7c3aed, #c084fc)",
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function clampTime(value: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return Math.max(0, value);
  }

  return Math.min(Math.max(0, value), duration);
}

export function MusicPlayer({
  song,
  userId,
  playRequest,
  restoreCheckpoint,
  onNext,
  onPrevious,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastHandledPlayRequestRef = useRef(0);
  const pendingResumeSecondsRef = useRef<number | null>(null);
  const checkpointSaveReadyRef = useRef(false);
  const [position, setPosition] = useState(0);
  const [bufferedUntil, setBufferedUntil] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [, setLastCheckpoint] = useState("Never");
  const [, setPlayerEvent] = useState("Player ready");

  async function playAudio() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
      setPlayerEvent("Audio playing");
    } catch {
      setIsPlaying(false);
      setPlayerEvent("Playback blocked. Press play again.");
    }
  }

  const applyPendingResume = useCallback(
    (audioElement: HTMLAudioElement) => {
      const pendingSeconds = pendingResumeSecondsRef.current;

      if (pendingSeconds === null) {
        checkpointSaveReadyRef.current = true;
        return;
      }

      if (
        audioElement.readyState < HTMLMediaElement.HAVE_METADATA
      ) {
        return;
      }

      try {
        audioElement.currentTime = clampTime(
          pendingSeconds,
          audioElement.duration,
        );
        setPosition(audioElement.currentTime);
        setPlayerEvent(
          `Resumed checkpoint at ${formatTime(audioElement.currentTime)}`,
        );
        pendingResumeSecondsRef.current = null;
        checkpointSaveReadyRef.current = true;
      } catch {
        // Some browsers reject seeking before metadata is ready.
      }
    },
    [],
  );

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const audioElement = audio;
    let hls: Hls | null = null;
    let isCancelled = false;

    function markSourceReady() {
      if (isCancelled) {
        return;
      }

      setPlayerEvent("HLS playlist loaded");
      applyPendingResume(audioElement);
    }

    pendingResumeSecondsRef.current = null;
    checkpointSaveReadyRef.current = false;
    setPosition(0);
    setBufferedUntil(0);
    setDuration(0);
    setIsPlaying(false);
    setPlayerEvent(`Loading ${song.title}`);

    audioElement.pause();
    audioElement.removeAttribute("src");
    audioElement.load();

    audioElement.addEventListener("loadedmetadata", markSourceReady);
    audioElement.addEventListener("canplay", markSourceReady);

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 12,
        backBufferLength: 30,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        fragLoadingMaxRetry: 4,
      });

      hls.attachMedia(audioElement);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(song.hlsUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, markSourceReady);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        setPlayerEvent(`HLS event: ${data.details}`);

        if (!data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
        }
      });
    } else if (
      audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
      audioElement.src = song.hlsUrl;
      audioElement.load();
    } else {
      setPlayerEvent("HLS is not supported in this browser");
    }

    return () => {
      isCancelled = true;
      audioElement.removeEventListener("loadedmetadata", markSourceReady);
      audioElement.removeEventListener("canplay", markSourceReady);
      hls?.destroy();
    };
  }, [applyPendingResume, song.hlsUrl, song.title]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const audioElement = audio;
    const latestCheckpoint = getLatestCheckpoint(
      restoreCheckpoint,
      readLocalCheckpoint(userId),
    );

    if (latestCheckpoint?.songId === song.id) {
      pendingResumeSecondsRef.current =
        latestCheckpoint.positionMs / 1000;
      checkpointSaveReadyRef.current = false;

      if (
        audioElement.readyState >= HTMLMediaElement.HAVE_METADATA
      ) {
        applyPendingResume(audioElement);
      }
    } else {
      pendingResumeSecondsRef.current = null;

      if (
        audioElement.readyState >= HTMLMediaElement.HAVE_METADATA
      ) {
        checkpointSaveReadyRef.current = true;
      }
    }

    function createCheckpoint(): PlaybackCheckpoint | null {
      if (
        !checkpointSaveReadyRef.current ||
        audioElement.readyState < HTMLMediaElement.HAVE_METADATA
      ) {
        return null;
      }

      return {
        userId,
        songId: song.id,
        positionMs: Math.floor(audioElement.currentTime * 1000),
        updatedAt: Date.now(),
      };
    }

    function updateUiState() {
      setPosition(audioElement.currentTime);

      if (Number.isFinite(audioElement.duration)) {
        setDuration(audioElement.duration);
      }

      if (audioElement.buffered.length > 0) {
        let activeRange = audioElement.buffered.length - 1;

        for (let index = 0; index < audioElement.buffered.length; index += 1) {
          if (
            audioElement.currentTime >= audioElement.buffered.start(index) &&
            audioElement.currentTime <= audioElement.buffered.end(index)
          ) {
            activeRange = index;
            break;
          }
        }

        setBufferedUntil(audioElement.buffered.end(activeRange));
      } else {
        setBufferedUntil(0);
      }
    }

    function updatePlaybackState() {
      setIsPlaying(!audioElement.paused);
    }

    function handleEnded() {
      updatePlaybackState();

      if (!audioElement.loop) {
        onNext();
      }
    }

    function saveLocalCheckpoint() {
      const checkpoint = createCheckpoint();

      if (!checkpoint) {
        return;
      }

      writeLocalCheckpoint(checkpoint);
    }

    async function saveRemoteCheckpoint() {
      const checkpoint = createCheckpoint();

      if (!checkpoint) {
        return;
      }

      writeLocalCheckpoint(checkpoint);

      try {
        await fetch(`${streamBaseUrl}/api/checkpoint`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(checkpoint),
        });

        setLastCheckpoint(new Date().toLocaleTimeString());
      } catch {
        setPlayerEvent("Remote checkpoint failed; local checkpoint saved");
      }
    }

    const uiTimer = window.setInterval(updateUiState, 500);
    const localTimer = window.setInterval(saveLocalCheckpoint, 1000);
    const remoteTimer = window.setInterval(saveRemoteCheckpoint, 2000);

    audioElement.addEventListener("timeupdate", updateUiState);
    audioElement.addEventListener("loadedmetadata", updateUiState);
    audioElement.addEventListener("durationchange", updateUiState);
    audioElement.addEventListener("progress", updateUiState);
    audioElement.addEventListener("play", updatePlaybackState);
    audioElement.addEventListener("pause", updatePlaybackState);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("pause", saveRemoteCheckpoint);
    audioElement.addEventListener("seeked", saveRemoteCheckpoint);

    return () => {
      window.clearInterval(uiTimer);
      window.clearInterval(localTimer);
      window.clearInterval(remoteTimer);

      audioElement.removeEventListener("timeupdate", updateUiState);
      audioElement.removeEventListener("loadedmetadata", updateUiState);
      audioElement.removeEventListener("durationchange", updateUiState);
      audioElement.removeEventListener("progress", updateUiState);
      audioElement.removeEventListener("play", updatePlaybackState);
      audioElement.removeEventListener("pause", updatePlaybackState);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("pause", saveRemoteCheckpoint);
      audioElement.removeEventListener("seeked", saveRemoteCheckpoint);
    };
  }, [applyPendingResume, onNext, restoreCheckpoint, song.id, userId]);

  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.loop = isRepeating;
    }
  }, [isRepeating]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || playRequest === lastHandledPlayRequestRef.current) {
      return;
    }

    const audioElement = audio;
    lastHandledPlayRequestRef.current = playRequest;

    let isCancelled = false;

    async function waitForSourceAndPlay() {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (isCancelled) {
          return;
        }

        if (
          audioElement.readyState >= HTMLMediaElement.HAVE_METADATA
        ) {
          break;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 100));
      }

      if (isCancelled) {
        return;
      }

      await playAudio();
    }

    void waitForSourceAndPlay();

    return () => {
      isCancelled = true;
    };
  }, [playRequest]);

  function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      void playAudio();
      return;
    }

    audio.pause();
  }

  function restartTrack() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    setPosition(0);
    void playAudio();
  }

  function seekTo(event: ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const nextPosition = Number(event.target.value);
    audio.currentTime = clampTime(nextPosition, audio.duration);
    setPosition(audio.currentTime);
  }

  const progressMax = Math.max(duration, bufferedUntil, position, 1);
  const playedPercent = Math.min((position / progressMax) * 100, 100);
  const bufferedPercent = Math.min(
    (Math.max(bufferedUntil, position) / progressMax) * 100,
    100,
  );

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)] gap-4 overflow-hidden">
      <audio
        ref={audioRef}
        className="hidden"
        crossOrigin="anonymous"
        preload="auto"
      />

      <div
        className="flex min-h-0 items-center justify-center rounded-3xl text-white"
        style={{
          background:
            coverBySongId[song.id] ??
            "linear-gradient(135deg, #2563eb, #38bdf8)",
        }}
      >
        <Music2 className="h-24 w-24" />
      </div>

      <div className="flex min-h-0 flex-col justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-medium text-blue-600">Now playing</p>
        <h2 className="mt-2 truncate text-4xl font-semibold tracking-tight">
          {song.title}
        </h2>
        <p className="mt-2 truncate text-lg font-medium text-slate-500">
          {song.artist}
        </p>

        <div className="mt-10">
          <div className="group relative flex h-5 items-center">
            <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="absolute inset-y-0 left-0 bg-slate-400 transition-[width] duration-150"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-blue-600"
                style={{ width: `${playedPercent}%` }}
              />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-blue-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              style={{ left: `${playedPercent}%` }}
            />
            <input
              aria-label="Playback progress"
              aria-valuetext={`${formatTime(position)} played, buffered until ${formatTime(bufferedUntil)}`}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              max={progressMax}
              min={0}
              onChange={seekTo}
              step={0.1}
              type="range"
              value={Math.min(position, progressMax)}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 text-xs font-medium text-slate-500 sm:text-sm">
            <span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
                Current
              </span>
              {formatTime(position)}
            </span>
            <span className="text-center">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
                Buffered
              </span>
              {formatTime(bufferedUntil)}
            </span>
            <span className="text-right">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
                Duration
              </span>
              {formatTime(progressMax)}
            </span>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={restartTrack}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-950"
            aria-label="Restart track"
            title="Restart track"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={onPrevious}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-950"
            aria-label="Previous track"
            title="Previous track"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={togglePlayback}
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white transition hover:bg-blue-700"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-7 w-7 fill-current" />
            ) : (
              <Play className="ml-1 h-7 w-7 fill-current" />
            )}
          </button>
          <button
            onClick={onNext}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-950"
            aria-label="Next track"
            title="Next track"
          >
            <SkipForward className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsRepeating((currentValue) => !currentValue)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
              isRepeating
                ? "border-blue-600 bg-blue-50 text-blue-600"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-950"
            }`}
            aria-label={isRepeating ? "Disable repeat" : "Repeat track"}
            aria-pressed={isRepeating}
            title={isRepeating ? "Repeat on" : "Repeat track"}
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
