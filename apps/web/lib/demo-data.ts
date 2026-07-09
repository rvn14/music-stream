export type DemoUser = {
  id: string;
  username: string;
  password: string;
  displayName: string;
};

export type DemoSong = {
  id: string;
  title: string;
  artist: string;
  hlsUrl: string;
};

export const streamBaseUrl = (
  process.env.NEXT_PUBLIC_STREAM_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

export const demoUsers: DemoUser[] = [
  {
    id: "user-001",
    username: "rvn14",
    password: "123456",
    displayName: "RVN14",
  },
  {
    id: "user-002",
    username: "demo",
    password: "123456",
    displayName: "Demo User",
  },
];

export const demoSongs: DemoSong[] = [
  {
    id: "song-001",
    title: "Mi Chico",
    artist: "Jason Derulo",
    hlsUrl: `${streamBaseUrl}/media/song-001/index.m3u8`,
  },
  {
    id: "song-002",
    title: "The Sound of Silence",
    artist: "Disturbed",
    hlsUrl: `${streamBaseUrl}/media/song-002/index.m3u8`,
  },
  {
    id: "song-003",
    title: "International Love",
    artist: "Pitbull feat. Chris Brown",
    hlsUrl: `${streamBaseUrl}/media/song-003/index.m3u8`,
  },
];
