# Distributed Music Streaming

Lightweight demo music streaming app with a Next.js frontend, an HLS media node, a checkpoint API, Redis checkpoint replication, and an Nginx gateway.

## Services

- `apps/web`: Next.js web UI on `http://localhost:3000`
- `apps/media-node`: Express static HLS media server
- `apps/checkpoint-api`: Express API for playback checkpoints
- `apps/gateway`: Nginx gateway on `http://localhost:8080`
- `redis-a` and `redis-b`: replicated checkpoint stores

The web app expects one stream base URL:

```env
NEXT_PUBLIC_STREAM_BASE_URL=http://localhost:8080
```

That gateway URL serves both:

- `GET /media/song-001/index.m3u8`
- `POST /api/checkpoint`

## Prerequisites

- Node.js 22 recommended
- npm
- Docker Desktop, for the Docker flow
- Redis, only if running backend services manually without Compose

## Run With Docker

This starts the backend stack: gateway, media node, checkpoint API, and Redis.

```powershell
cd infra
docker compose up -d --build
```

In another terminal, start the web app:

```powershell
cd apps/web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Demo login:

```text
Username: rvn14
Password: 123456
```

Useful checks:

```powershell
Invoke-WebRequest http://localhost:8080/health
Invoke-WebRequest http://localhost:8080/media/song-001/index.m3u8
Invoke-WebRequest http://localhost:3000/api/songs
```

Stop Docker services:

```powershell
cd infra
docker compose down
```

## Run Services Individually

Install dependencies for each app:

```powershell
cd apps/checkpoint-api
npm install

cd ../media-node
npm install

cd ../web
npm install
```

Start two Redis instances. You can use local Redis installs, or Docker just for Redis:

```powershell
docker run -d --name music-redis-a -p 6379:6379 redis:8-alpine
docker run -d --name music-redis-b -p 6380:6379 redis:8-alpine
```

Start the checkpoint API:

```powershell
cd apps/checkpoint-api
$env:PORT="4000"
$env:REDIS_A_URL="redis://localhost:6379"
$env:REDIS_B_URL="redis://localhost:6380"
$env:ALLOWED_ORIGIN="http://localhost:3000"
npm run dev
```

Start the media node:

```powershell
cd apps/media-node
$env:PORT="8081"
$env:NODE_NAME="local-media-node"
$env:ALLOWED_ORIGIN="http://localhost:3000"
npm run dev
```

For full playback behavior, keep a gateway/reverse proxy on `http://localhost:8080` that routes:

- `/media/` to `http://localhost:8081/media/`
- `/api/` to `http://localhost:4000/api/`

The easiest way to run that gateway is still the Compose stack in `infra`. If you skip the gateway and point the web app directly at the media node, HLS media can load, but checkpoint requests will not be available at the same base URL.

Start the web app:

```powershell
cd apps/web
$env:NEXT_PUBLIC_STREAM_BASE_URL="http://localhost:8080"
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build And Lint

```powershell
cd apps/web
npm run lint
npm run build
```

Backend builds:

```powershell
cd apps/checkpoint-api
npm run build

cd ../media-node
npm run build
```

## Media Layout

HLS files are served from:

```text
apps/media-node/media/song-001/index.m3u8
apps/media-node/media/song-002/index.m3u8
apps/media-node/media/song-003/index.m3u8
```

The public URLs are:

```text
http://localhost:8080/media/song-001/index.m3u8
http://localhost:8080/media/song-002/index.m3u8
http://localhost:8080/media/song-003/index.m3u8
```
