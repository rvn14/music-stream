import { streamBaseUrl } from "@/lib/demo-data";

export type PlaybackCheckpoint = {
  userId: string;
  songId: string;
  positionMs: number;
  updatedAt: number;
};

export type CheckpointResponse = {
  checkpoint: PlaybackCheckpoint | null;
};

export function isPlaybackCheckpoint(
  value: unknown,
): value is PlaybackCheckpoint {
  const item = value as PlaybackCheckpoint;

  return (
    typeof item?.userId === "string" &&
    typeof item?.songId === "string" &&
    Number.isFinite(item?.positionMs) &&
    item.positionMs >= 0 &&
    Number.isFinite(item?.updatedAt)
  );
}

export function getCheckpointStorageKey(userId: string) {
  return `playback:${userId}`;
}

export function readLocalCheckpoint(
  userId: string,
): PlaybackCheckpoint | null {
  let savedCheckpoint: string | null;

  try {
    savedCheckpoint = localStorage.getItem(
      getCheckpointStorageKey(userId),
    );
  } catch {
    return null;
  }

  if (!savedCheckpoint) {
    return null;
  }

  try {
    const checkpoint = JSON.parse(savedCheckpoint) as unknown;

    return isPlaybackCheckpoint(checkpoint) ? checkpoint : null;
  } catch {
    return null;
  }
}

export function writeLocalCheckpoint(checkpoint: PlaybackCheckpoint) {
  try {
    localStorage.setItem(
      getCheckpointStorageKey(checkpoint.userId),
      JSON.stringify(checkpoint),
    );
  } catch {
    // Remote checkpoints are still attempted when local storage is unavailable.
  }
}

export function getLatestCheckpoint(
  ...checkpoints: Array<PlaybackCheckpoint | null | undefined>
): PlaybackCheckpoint | null {
  return checkpoints
    .filter(isPlaybackCheckpoint)
    .reduce<PlaybackCheckpoint | null>((latestCheckpoint, checkpoint) => {
      if (
        !latestCheckpoint ||
        checkpoint.updatedAt > latestCheckpoint.updatedAt
      ) {
        return checkpoint;
      }

      return latestCheckpoint;
    }, null);
}

export async function fetchRemoteCheckpoint(userId: string) {
  const response = await fetch(
    `${streamBaseUrl}/api/checkpoint/${encodeURIComponent(userId)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as CheckpointResponse;

  return isPlaybackCheckpoint(data.checkpoint) ? data.checkpoint : null;
}
