"use client";

import { LogOut, Music2, Play, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MusicPlayer } from "@/components/music-player";
import {
  fetchRemoteCheckpoint,
  getLatestCheckpoint,
  readLocalCheckpoint,
} from "@/lib/checkpoints";
import type { PlaybackCheckpoint } from "@/lib/checkpoints";
import type { DemoSong } from "@/lib/demo-data";

type User = {
  id: string;
  username: string;
  displayName: string;
};

const songAccents = ["#2563eb", "#0891b2", "#7c3aed"];

function formatResumeTime(positionMs: number) {
  const totalSeconds = Math.max(0, Math.floor(positionMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<DemoSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<DemoSong | null>(
    null,
  );
  const [restoreCheckpoint, setRestoreCheckpoint] =
    useState<PlaybackCheckpoint | null>(null);
  const [remoteResume, setRemoteResume] =
    useState<PlaybackCheckpoint | null>(null);
  const [playRequest, setPlayRequest] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard() {
      const savedUser = localStorage.getItem("music_user");
      const token = localStorage.getItem("music_token");

      if (!savedUser || !token) {
        window.location.href = "/";
        return;
      }

      let parsedUser: User;

      try {
        parsedUser = JSON.parse(savedUser) as User;
      } catch {
        window.location.href = "/";
        return;
      }

      setUser(parsedUser);

      const localCheckpoint = readLocalCheckpoint(parsedUser.id);

      try {
        const [songsResponse, remoteCheckpoint] = await Promise.all([
          fetch("/api/songs", {
            cache: "no-store",
          }),
          fetchRemoteCheckpoint(parsedUser.id).catch(() => null),
        ]);

        if (!songsResponse.ok) {
          throw new Error("Failed to load songs");
        }

        const data = (await songsResponse.json()) as {
          songs: DemoSong[];
        };
        const checkpoint = getLatestCheckpoint(
          remoteCheckpoint,
          localCheckpoint,
        );
        const checkpointSong = data.songs.find(
          (song) => song.id === checkpoint?.songId,
        );

        if (isCancelled) {
          return;
        }

        setSongs(data.songs);
        setRestoreCheckpoint(checkpoint);
        setSelectedSong(checkpointSong ?? data.songs[0] ?? null);
        setRemoteResume(
          remoteCheckpoint && checkpoint === remoteCheckpoint && checkpointSong
            ? remoteCheckpoint
            : null,
        );
      } catch {
        if (isCancelled) {
          return;
        }

        setSongs([]);
        setRestoreCheckpoint(localCheckpoint);
        setSelectedSong(null);
      }
    }

    void loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, []);

  function logout() {
    localStorage.removeItem("music_user");
    localStorage.removeItem("music_token");
    window.location.href = "/";
  }

  function selectSong(song: DemoSong) {
    setSelectedSong(song);
    setRestoreCheckpoint(null);
    setRemoteResume(null);
    setPlayRequest((currentValue) => currentValue + 1);
  }

  function continueRemotePlayback() {
    if (!remoteResume) {
      return;
    }

    const resumeSong = songs.find((song) => song.id === remoteResume.songId);

    if (!resumeSong) {
      return;
    }

    setSelectedSong(resumeSong);
    setRestoreCheckpoint(remoteResume);
    setRemoteResume(null);
    setPlayRequest((currentValue) => currentValue + 1);
  }

  const selectAdjacentSong = useCallback(
    (offset: number) => {
      if (songs.length === 0) {
        return;
      }

      const currentIndex = songs.findIndex(
        (song) => song.id === selectedSong?.id,
      );
      const nextIndex =
        (Math.max(currentIndex, 0) + offset + songs.length) % songs.length;

      setSelectedSong(songs[nextIndex]);
      setRestoreCheckpoint(null);
      setPlayRequest((currentValue) => currentValue + 1);
    },
    [selectedSong?.id, songs],
  );

  const playNextSong = useCallback(
    () => selectAdjacentSong(1),
    [selectAdjacentSong],
  );
  const playPreviousSong = useCallback(
    () => selectAdjacentSong(-1),
    [selectAdjacentSong],
  );

  if (!user) {
    return (
      <main className="flex h-screen items-center justify-center overflow-hidden bg-[#eef2f7] p-4 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#eef2f7] p-3 text-slate-950">
      <section className="grid h-full min-h-0 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-rows-[72px_minmax(0,1fr)]">
        <header className="flex min-h-0 items-center justify-between gap-4 border-b border-slate-200 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Music2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">
                Cloud Music
              </p>
              <p className="truncate text-xs text-slate-500">
                Distributed HLS streaming
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex md:w-80 lg:w-96">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search demo songs</span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white">
                {user.displayName.slice(0, 1)}
              </div>
              <p className="text-sm font-semibold">{user.displayName}</p>
            </div>
            <button
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:text-slate-950"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 gap-3 p-3 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Select a song
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                Library
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose one of the three replicated demo streams.
              </p>
              {remoteResume ? (
                <button
                  className="mt-4 w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100"
                  onClick={continueRemotePlayback}
                >
                  <span className="block text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Cross-device resume
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold text-slate-900">
                    Continue {songs.find((song) => song.id === remoteResume.songId)?.title} at {formatResumeTime(remoteResume.positionMs)}
                  </span>
                </button>
              ) : null}
            </div>

            <div className="mt-5 min-h-0 space-y-3 overflow-hidden">
              {songs.map((song, index) => (
                <button
                  key={song.id}
                  onClick={() => selectSong(song)}
                  className={`grid w-full grid-cols-[52px_minmax(0,1fr)_40px] items-center gap-3 rounded-3xl border px-3 py-3 text-left transition ${
                    selectedSong?.id === song.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                    style={{
                      backgroundColor:
                        songAccents[index % songAccents.length],
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{song.title}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {song.artist}
                    </p>
                  </div>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      selectedSong?.id === song.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
            {selectedSong ? (
              <MusicPlayer
                onNext={playNextSong}
                onPrevious={playPreviousSong}
                playRequest={playRequest}
                restoreCheckpoint={restoreCheckpoint}
                song={selectedSong}
                userId={user.id}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                Select a song
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
