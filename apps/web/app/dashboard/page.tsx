"use client";

import {
  Album,
  Bell,
  Clock,
  Database,
  Disc3,
  Folder,
  Heart,
  Home,
  ListMusic,
  LogOut,
  Mic2,
  Music2,
  Play,
  Plus,
  Radio,
  Search,
  Server,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MusicPlayer } from "@/components/music-player";
import { DemoSong } from "@/lib/demo-data";

type User = {
  id: string;
  username: string;
  displayName: string;
};

const artistCards = [
  { name: "Cloud Lab", plays: "42M Plays", color: "from-indigo-500 to-sky-400" },
  { name: "AWS Swarm", plays: "32M Plays", color: "from-amber-400 to-orange-500" },
  { name: "HLS Node", plays: "28M Plays", color: "from-emerald-400 to-teal-600" },
  { name: "Redis", plays: "18M Plays", color: "from-rose-400 to-red-500" },
  { name: "Gateway", plays: "15M Plays", color: "from-violet-500 to-indigo-600" },
];

const genreCards = [
  { name: "Dance Beat", color: "bg-[#476682]" },
  { name: "Electro Pop", color: "bg-[#cabf9f]" },
  { name: "Alternative Indie", color: "bg-[#ad5c44]" },
  { name: "Hip Hop", color: "bg-[#3e7772]" },
];

const systemItems = [
  {
    name: "AWS Gateway",
    detail: "Routes HLS requests",
    icon: Server,
  },
  {
    name: "Media Workers",
    detail: "Serve replicated songs",
    icon: Radio,
  },
  {
    name: "Redis Checkpoint",
    detail: "Stores playback position",
    icon: Database,
  },
];

const transparencyItems = [
  "Access transparency: one streaming URL hides worker IPs.",
  "Location transparency: any healthy worker can serve the same HLS URL.",
  "Replication transparency: songs are replicated across media workers.",
  "Failure transparency: buffered audio continues while HLS.js retries.",
  "Persistence transparency: playback position is saved locally and remotely.",
  "Concurrency transparency: each user owns a separate checkpoint key.",
];

const recoverySteps = [
  "Browser plays buffered audio",
  "Worker fails",
  "Segment request fails",
  "HLS.js retries same URL",
  "Gateway routes to another worker",
  "Playback continues from same currentTime",
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<DemoSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<DemoSong | null>(
    null,
  );

  useEffect(() => {
    const savedUser = localStorage.getItem("music_user");
    const token = localStorage.getItem("music_token");

    if (!savedUser || !token) {
      window.location.href = "/";
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only available after client mount.
    setUser(JSON.parse(savedUser) as User);

    fetch("/api/songs")
      .then((response) => response.json())
      .then((data) => {
        setSongs(data.songs);
        setSelectedSong(data.songs[0]);
      });
  }, []);

  function logout() {
    localStorage.removeItem("music_user");
    localStorage.removeItem("music_token");
    window.location.href = "/";
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#3a3a3a] p-6 text-white">
        <div className="rounded-2xl bg-[#171720] px-5 py-3 text-sm text-white/60 shadow-2xl">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#3a3a3a] px-4 py-6 text-white lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1440px] overflow-hidden rounded-[1.7rem] bg-[#09090d] shadow-[0_36px_120px_rgba(0,0,0,0.55)] lg:grid-cols-[230px_minmax(0,1fr)_350px]">
        <aside className="hidden bg-[#15151d] px-7 py-7 lg:block">
          <div className="flex items-center gap-3">
            <Music2 className="h-5 w-5 text-white" />
            <p className="text-sm font-bold tracking-tight">Cloud Music</p>
          </div>

          <div className="mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
              Menu
            </p>
            <nav className="mt-4 space-y-3 text-sm font-semibold">
              <div className="flex items-center gap-3 text-[#6374ff]">
                <Home className="h-4 w-4" />
                Explore
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Disc3 className="h-4 w-4" />
                Genres
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Album className="h-4 w-4" />
                Albums
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Mic2 className="h-4 w-4" />
                Artists
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Radio className="h-4 w-4" />
                Radio
              </div>
            </nav>
          </div>

          <div className="mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
              Library
            </p>
            <nav className="mt-4 space-y-3 text-sm font-semibold text-white/70">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4" />
                Recent
              </div>
              <div className="flex items-center gap-3">
                <ListMusic className="h-4 w-4" />
                Albums
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4" />
                Favourites
              </div>
              <div className="flex items-center gap-3">
                <Folder className="h-4 w-4" />
                Local
              </div>
            </nav>
          </div>

          <div className="mt-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
              Playlist
            </p>
            <nav className="mt-4 space-y-3 text-sm font-semibold text-white/70">
              <div className="flex items-center gap-3">
                <Plus className="h-4 w-4" />
                Create New
              </div>
              <div>Design Flow</div>
              <div>Best of 2026</div>
              <div>Distributed Jams</div>
            </nav>
          </div>

          <div className="mt-12 rounded-2xl bg-[#20202b] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6374ff]">
                <Music2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {selectedSong?.title ?? "Cloud Music"}
                </p>
                <p className="truncate text-xs text-white/40">Now playing</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-[#0b0b10]">
          <header className="flex flex-col gap-4 px-5 py-6 sm:px-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-8">
              <div className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl bg-[#6374ff]">
                <Music2 className="h-5 w-5" />
              </div>
              <nav className="hidden gap-8 text-xs font-black uppercase tracking-[0.18em] text-white/45 sm:flex">
                <span className="text-[#6374ff]">Music</span>
                <span>Podcast</span>
                <span>Live</span>
              </nav>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-white/40 xl:w-[300px]">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Type here to search</span>
            </div>

            <div className="flex items-center gap-4">
              <Bell className="h-4 w-4 text-[#6374ff]" />
              <Settings className="h-4 w-4 text-white/55" />
              <div className="flex items-center gap-3 rounded-md bg-white/[0.08] px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-sm font-bold">
                  {user.displayName.slice(0, 1)}
                </div>
                <span className="text-sm font-bold">{user.displayName}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-md bg-white/[0.08] px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-white/15 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="px-5 pb-7 sm:px-8">
            <section className="relative min-h-[300px] overflow-hidden rounded-3xl bg-[#050509] p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_48%,rgba(148,163,184,0.35),transparent_28%),linear-gradient(120deg,rgba(99,116,255,0.18),transparent_48%)]" />
              <div className="absolute right-0 top-0 hidden h-full w-[46%] bg-[radial-gradient(ellipse_at_70%_45%,rgba(255,255,255,0.32),transparent_38%)] opacity-70 md:block" />
              <div className="relative max-w-xl pt-7">
                <p className="text-sm font-semibold text-white/65">
                  Trending New Hits
                </p>
                <h1 className="mt-7 text-5xl font-black leading-none tracking-tight sm:text-6xl">
                  {selectedSong?.title ?? "Cloud Music"}
                </h1>
                <p className="mt-4 text-lg font-bold">
                  {selectedSong?.artist ?? "Distributed Streaming"}
                  <span className="ml-4 text-sm font-medium text-white/45">
                    {songs.length} replicated songs
                  </span>
                </p>
                <div className="mt-7 flex items-center gap-4">
                  <button className="rounded-2xl bg-[#6374ff] px-6 py-3 text-sm font-bold shadow-[0_16px_40px_rgba(99,116,255,0.28)]">
                    Listen Now
                  </button>
                  <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-[#6374ff]">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl bg-[#1b1b23] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Top Artists</h2>
                <button className="text-xs font-semibold text-white/35">
                  See all
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {artistCards.map((artist) => (
                  <div key={artist.name}>
                    <div
                      className={`h-20 rounded-2xl bg-gradient-to-br ${artist.color}`}
                    />
                    <p className="mt-3 truncate text-sm font-bold">
                      {artist.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/35">
                      {artist.plays}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <section className="rounded-3xl bg-[#1b1b23] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Genres</h2>
                  <button className="text-xs font-semibold text-white/35">
                    See all
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {genreCards.map((genre) => (
                    <div
                      key={genre.name}
                      className={`rounded-2xl ${genre.color} p-4 text-sm font-bold`}
                    >
                      {genre.name}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl bg-[#1b1b23] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Top Charts</h2>
                  <button className="text-xs font-semibold text-white/35">
                    See all
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  {songs.map((song, index) => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSong(song)}
                      className={`grid w-full grid-cols-[32px_44px_minmax(0,1fr)_48px_36px] items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                        selectedSong?.id === song.id
                          ? "bg-[#6374ff]/20"
                          : "hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="text-xs font-bold text-white/35">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2a2a36] text-sm font-bold">
                        {song.title.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {song.title}
                        </span>
                        <span className="block truncate text-xs text-white/35">
                          {song.artist}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-white/45">
                        3:45
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[#6374ff]">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-3xl bg-[#1b1b23] p-5">
                <h2 className="text-sm font-bold">
                  Distributed-System Transparency
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {transparencyItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl bg-white/[0.045] p-4 text-sm leading-6 text-white/55"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl bg-[#1b1b23] p-5">
                <h2 className="text-sm font-bold">Failure Recovery</h2>
                <div className="mt-4 space-y-2">
                  {recoverySteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-2xl bg-white/[0.045] px-3 py-2"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6374ff] text-xs font-bold">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-white/65">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <aside className="bg-[#15151d] px-7 py-7">
          <section className="rounded-3xl bg-[#1f1f29] p-5">
            {selectedSong ? (
              <MusicPlayer song={selectedSong} userId={user.id} />
            ) : (
              <div className="rounded-2xl bg-white/[0.05] p-6 text-sm text-white/45">
                Select a song
              </div>
            )}
          </section>

          <section className="mt-6 rounded-3xl bg-[#1f1f29] p-5">
            <h2 className="text-sm font-bold">System Status</h2>
            <div className="mt-4 space-y-3">
              {systemItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.045] p-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6374ff]/20 text-[#7d8aff]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {item.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/35">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
