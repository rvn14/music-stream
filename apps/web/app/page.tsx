"use client";

import { Lock, Music2, UserRound } from "lucide-react";
import { useState } from "react";

type LoginResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
};

export default function LoginPage() {
  const [username, setUsername] = useState("vihanga");
  const [password, setPassword] = useState("123456");
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setMessage("Logging in...");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setMessage("Invalid username or password");
      return;
    }

    const data = (await response.json()) as LoginResponse;

    localStorage.setItem("music_token", data.token);
    localStorage.setItem("music_user", JSON.stringify(data.user));

    window.location.href = "/dashboard";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#3a3a3a] px-5 py-10 text-white">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-[#09090d] shadow-[0_32px_100px_rgba(0,0,0,0.45)] lg:grid-cols-[1fr_420px]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[#08080b] p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(99,102,241,0.28),transparent_26%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_24%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b6cff] text-white">
                <Music2 className="h-5 w-5" />
              </div>
              <p className="font-semibold tracking-tight">Cloud Music</p>
            </div>

            <div className="mt-28 max-w-md">
              <p className="text-sm font-semibold text-[#7583ff]">
                Distributed HLS Streaming
              </p>
              <h1 className="mt-5 text-6xl font-black leading-none tracking-tight">
                Feel the stream.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
                A Spotify-style frontend for replicated songs, direct HLS
                playback, and checkpoint recovery demos.
              </p>
            </div>

            <div className="mt-10 flex gap-3">
              <span className="rounded-full bg-[#5b6cff] px-5 py-3 text-sm font-bold">
                HLS playback
              </span>
              <span className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/70">
                Checkpoint resume
              </span>
            </div>
          </div>
        </div>

        <div className="border-l border-white/10 bg-[#15151d] p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5b6cff] text-white">
            <Music2 className="h-6 w-6" />
          </div>

          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-[#7583ff]">
            Sign in
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Welcome back
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/50">
            Use one of the hardcoded demo users to enter the player dashboard.
          </p>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-white/70">
                Username
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
                <UserRound className="h-5 w-5 text-white/35" />
                <input
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-white/70">
                Password
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
                <Lock className="h-5 w-5 text-white/35" />
                <input
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                />
              </div>
            </label>

            <button
              onClick={handleLogin}
              className="w-full rounded-2xl bg-[#5b6cff] px-5 py-3.5 font-bold text-white transition hover:bg-[#6f7eff]"
            >
              Login
            </button>

            {message && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/60">
                {message}
              </p>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
            <p className="font-bold text-white">Demo credentials</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-white">vihanga</p>
                <p className="text-white/45">123456</p>
              </div>
              <div>
                <p className="font-semibold text-white">demo</p>
                <p className="text-white/45">123456</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
