// src/lib/redis.ts
// Singleton Redis client — supports both local Redis and Upstash (TLS)

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Reuse the connection across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | undefined;
}

function createClient(): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[Redis] Connected to", REDIS_URL.split("@").pop());
  });

  return client;
}

export const redis: Redis =
  global._redisClient ?? (global._redisClient = createClient());

// TTL for report tokens (seconds)
export const TOKEN_TTL =
  parseInt(process.env.TOKEN_TTL_SECONDS ?? "30", 10);
