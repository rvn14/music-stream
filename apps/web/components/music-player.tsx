"use client";

import Hls from "hls.js";
import {
  Maximize2,
  Music2,
  Pause,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DemoSong } from "@/lib/demo-data";

type MusicPlayerProps = {
  song: DemoSong;
  userId: string;
};

type PlaybackCheckpoint = {
  userId: string;
  songId: string;
  positionMs: number;
  updatedAt: number;
};

const coverBySongId: Record<string, string> = {
  "song-001": "from-indigo-500 via-blue-500 to-sky-300",
  "song-002": "from-orange-500 via-rose-500 to-yellow-300",
  "song-003": "from-violet-600 via-fuchsia-500 to-cyan-400",
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

export function MusicPlayer({ song, userId }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [position, setPosition] = useState(0);
  const [bufferedUntil, setBufferedUntil] = useState(0);
  const [lastCheckpoint, setLastCheckpoint] = useState("Never");
  const [playerEvent, setPlayerEvent] = useState("Player ready");

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    let hls: Hls | null = null;

    setPlayerEvent(`Loading ${song.title}`);

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 12,
        backBufferLength: 30,
      });

      hls.loadSource(song.hlsUrl);
      hls.attachMedia(audio);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPlayerEvent("HLS playlist loaded");
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        setPlayerEvent(`HLS event: ${data.details}`);

        if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
        }
      });
    } else if (
      audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
      audio.src = song.hlsUrl;
    } else {
      setPlayerEvent("HLS is not supported in this browser");
    }

    return () => {
      hls?.destroy();
    };
  }, [song.hlsUrl, song.title]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const audioElement = audio;
    const localKey = `playback:${userId}`;

    const savedCheckpoint = localStorage.getItem(localKey);

    if (savedCheckpoint) {
      const checkpoint = JSON.parse(savedCheckpoint) as PlaybackCheckpoint;

      if (checkpoint.songId === song.id) {
        audioElement.currentTime = checkpoint.positionMs / 1000;
        setPlayerEvent(
          `Resumed locally at ${formatTime(audioElement.currentTime)}`,
        );
      }
    }

    function updateUiState() {
      setPosition(audioElement.currentTime);

      if (audioElement.buffered.length > 0) {
        const lastRange = audioElement.buffered.length - 1;
        setBufferedUntil(audioElement.buffered.end(lastRange));
      }
    }

    function saveLocalCheckpoint() {
      const checkpoint: PlaybackCheckpoint = {
        userId,
        songId: song.id,
        positionMs: Math.floor(audioElement.currentTime * 1000),
        updatedAt: Date.now(),
      };

      localStorage.setItem(localKey, JSON.stringify(checkpoint));
    }

    async function saveRemoteCheckpoint() {
      const checkpoint: PlaybackCheckpoint = {
        userId,
        songId: song.id,
        positionMs: Math.floor(audioElement.currentTime * 1000),
        updatedAt: Date.now(),
      };

      localStorage.setItem(localKey, JSON.stringify(checkpoint));

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_STREAM_BASE_URL}/api/checkpoint`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(checkpoint),
          },
        );

        setLastCheckpoint(new Date().toLocaleTimeString());
      } catch {
        setPlayerEvent("Remote checkpoint failed; local checkpoint saved");
      }
    }

    const uiTimer = window.setInterval(updateUiState, 500);
    const localTimer = window.setInterval(saveLocalCheckpoint, 1000);
    const remoteTimer = window.setInterval(saveRemoteCheckpoint, 2000);

    audioElement.addEventListener("timeupdate", updateUiState);
    audioElement.addEventListener("pause", saveRemoteCheckpoint);
    audioElement.addEventListener("seeked", saveRemoteCheckpoint);

    return () => {
      window.clearInterval(uiTimer);
      window.clearInterval(localTimer);
      window.clearInterval(remoteTimer);

      audioElement.removeEventListener("timeupdate", updateUiState);
      audioElement.removeEventListener("pause", saveRemoteCheckpoint);
      audioElement.removeEventListener("seeked", saveRemoteCheckpoint);
    };
  }, [song.id, userId]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Player</h2>
        <Maximize2 className="h-4 w-4 text-white/45" />
      </div>

      <div
        className={`mx-auto mt-8 flex aspect-[1.25/1] w-full max-w-[230px] items-center justify-center rounded-lg bg-gradient-to-br ${
          coverBySongId[song.id] ?? "from-indigo-500 to-sky-300"
        } shadow-[0_22px_50px_rgba(0,0,0,0.35)]`}
      >
        <Music2 className="h-16 w-16 text-white/85" />
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-2xl font-black tracking-tight">{song.title}</h3>
        <p className="mt-2 text-sm font-semibold text-white/45">
          {song.artist}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold text-white/45">
          <span>{formatTime(position)}</span>
          <span>{formatTime(bufferedUntil)}</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white"
            style={{
              width: `${
                bufferedUntil > 0
                  ? Math.min((position / bufferedUntil) * 100, 100)
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between text-white/45">
        <Shuffle className="h-4 w-4" />
        <SkipBack className="h-5 w-5" />
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#15151d]">
          <Pause className="h-6 w-6 fill-current" />
        </span>
        <SkipForward className="h-5 w-5" />
        <Repeat className="h-4 w-4" />
      </div>

      <div className="mt-7 rounded-2xl bg-white/[0.06] p-3">
        <audio
          ref={audioRef}
          controls
          preload="auto"
          className="w-full"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.05] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            Timestamp
          </p>
          <p className="mt-2 text-lg font-black">{formatTime(position)}</p>
        </div>

        <div className="rounded-2xl bg-white/[0.05] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            Buffered
          </p>
          <p className="mt-2 text-lg font-black">
            {formatTime(bufferedUntil)}
          </p>
        </div>

        <div className="rounded-2xl bg-white/[0.05] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            Redis
          </p>
          <p className="mt-2 truncate text-sm font-bold">
            {lastCheckpoint}
          </p>
        </div>

        <div className="rounded-2xl bg-white/[0.05] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            Recovery
          </p>
          <p className="mt-2 text-sm font-bold text-[#7d8aff]">
            Buffer active
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-white/[0.05] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
          Player event
        </p>
        <p className="mt-2 text-xs leading-5 text-white/50">
          {playerEvent}
        </p>
      </div>

      <div className="mt-3 rounded-2xl bg-white/[0.05] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
          Stream URL
        </p>
        <p className="mt-2 break-all font-mono text-[11px] leading-5 text-white/45">
          {song.hlsUrl}
        </p>
      </div>
    </div>
  );
}
