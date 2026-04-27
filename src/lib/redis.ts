import Redis from "ioredis";

/**
 * Singleton Redis client.
 *
 * In Next.js dev mode the module can be re-evaluated on every hot-reload.
 * We attach the client to `globalThis` so we never create more than one
 * connection per process.
 */

declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | undefined;
}

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error(
      "[Redis] REDIS_URL is not defined. Add it to your .env.local file."
    );
  }

  const client = new Redis(url, {
    // Automatically retry on connection failure (up to 3 times)
    maxRetriesPerRequest: 3,
    // Do NOT crash the process on connect errors — let callers handle them
    lazyConnect: false,
  });

  client.on("connect", () => {
    console.log("[Redis] Connected successfully.");
  });

  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  return client;
}

// Reuse existing instance in dev (hot-reload safe) or create a new one
const redis: Redis =
  globalThis._redisClient ?? (globalThis._redisClient = createRedisClient());

export default redis;
