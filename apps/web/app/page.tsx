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
  const [username, setUsername] = useState("rvn14");
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
    <main className="flex h-screen overflow-hidden bg-[#eef2f7] p-4 text-slate-950">
      <section className="grid h-full w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="hidden min-h-0 bg-[#f8fafc] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Music2 className="h-6 w-6" />
            </div>

            <div className="mt-16 max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Cloud Music
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-tight">
                Distributed music streaming.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
                Browse replicated songs, play direct HLS streams, and display
                checkpoint recovery in a clean dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["3", "Tracks"],
              ["HLS", "Playback"],
              ["2s", "Checkpoint"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-3xl border border-slate-200 bg-white p-4"
              >
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 items-center p-6 sm:p-8">
          <div className="w-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white lg:hidden">
              <Music2 className="h-6 w-6" />
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 lg:mt-0">
              Sign in
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use a hardcoded demo account to open the dashboard.
            </p>

            <div className="mt-7 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Username
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <UserRound className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-slate-950 outline-none placeholder:text-slate-400"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type="password"
                  />
                </div>
              </label>

              <button
                onClick={handleLogin}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Login
              </button>

              {message && (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {message}
                </p>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold">Demo credentials</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <p className="text-slate-500">
                  <span className="font-medium text-slate-800">rvn14</span>
                  <br />
                  123456
                </p>
                <p className="text-slate-500">
                  <span className="font-medium text-slate-800">demo</span>
                  <br />
                  123456
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
