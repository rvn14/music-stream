import cors from "cors";
import express from "express";
import { createClient } from "redis";

const app = express();

const port = Number(process.env.PORT ?? 4000);
const redisAUrl = process.env.REDIS_A_URL ?? "redis://redis-a:6379";
const redisBUrl = process.env.REDIS_B_URL ?? "redis://redis-b:6379";
const allowedOrigin =
  process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

const redisA = createClient({ url: redisAUrl });
const redisB = createClient({ url: redisBUrl });

type PlaybackCheckpoint = {
  userId: string;
  songId: string;
  positionMs: number;
  updatedAt: number;
};

function isValidCheckpoint(value: unknown): value is PlaybackCheckpoint {
  const item = value as PlaybackCheckpoint;

  return (
    typeof item?.userId === "string" &&
    typeof item?.songId === "string" &&
    typeof item?.positionMs === "number" &&
    typeof item?.updatedAt === "number"
  );
}

app.get("/health", (_request, response) => {
  response.json({
    status: "healthy",
    service: "checkpoint-api",
    redisA: redisA.isOpen,
    redisB: redisB.isOpen,
    time: new Date().toISOString(),
  });
});

app.post("/api/checkpoint", async (request, response) => {
  const checkpoint = request.body;

  if (!isValidCheckpoint(checkpoint)) {
    return response.status(400).json({
      message: "Invalid checkpoint payload",
    });
  }

  const key = `playback:${checkpoint.userId}`;
  const value = JSON.stringify(checkpoint);

  const results = await Promise.allSettled([
    redisA.set(key, value, { EX: 3600 }),
    redisB.set(key, value, { EX: 3600 }),
  ]);

  const successfulWrites = results.filter(
    (result) => result.status === "fulfilled",
  ).length;

  if (successfulWrites === 0) {
    return response.status(503).json({
      message: "Both Redis stores are unavailable",
    });
  }

  response.json({
    saved: true,
    successfulWrites,
    checkpoint,
  });
});

app.get("/api/checkpoint/:userId", async (request, response) => {
  const key = `playback:${request.params.userId}`;

  const results = await Promise.allSettled([
    redisA.get(key),
    redisB.get(key),
  ]);

  const checkpoints = results
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<string | null> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)
    .filter((value): value is string => value !== null)
    .map((value) => JSON.parse(value) as PlaybackCheckpoint);

  if (checkpoints.length === 0) {
    return response.json({
      checkpoint: null,
    });
  }

  const latest = checkpoints.reduce((latestItem, currentItem) =>
    currentItem.updatedAt > latestItem.updatedAt
      ? currentItem
      : latestItem,
  );

  response.json({
    checkpoint: latest,
  });
});

async function startServer() {
  await Promise.allSettled([redisA.connect(), redisB.connect()]);

  app.listen(port, "0.0.0.0", () => {
    console.log(`checkpoint-api listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start checkpoint-api", error);
  process.exit(1);
});