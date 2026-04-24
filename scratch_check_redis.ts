import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function checkRedis() {
  const redis = new Redis(REDIS_URL);
  
  console.log("--- Scanning Redis for Report Tokens ---");
  const keys = await redis.keys("report:*");
  
  if (keys.length === 0) {
    console.log("No active tokens found. (Tokens may have expired or been deleted).");
  } else {
    console.log(`Found ${keys.length} active token(s):`);
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      const data = await redis.get(key);
      console.log(`\nKey: ${key}`);
      console.log(`TTL: ${ttl}s remaining`);
      console.log(`Data: ${data}`);
    }
  }
  
  redis.disconnect();
}

checkRedis().catch(console.error);
