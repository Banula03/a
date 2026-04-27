import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import redis from "@/lib/redis";

/**
 * POST /api/auth
 *
 * Request headers:
 *   Authorization: Basic <base64(username:password)>
 *
 * Request body:
 *   { reportID: string, userID: string }
 *
 * Response body (200):
 *   { success: true, token: string, reportID: string, userID: string }
 *
 * Side-effect:
 *   Stores the token in Redis under the key: APP_ID-userID-reportID  (TTL: 1 h)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validate Basic Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { error: "Unauthorized. Basic authentication required." },
        {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="Secure Report API"' }
        }
      );
    }

    // 2. Decode and verify credentials
    const base64 = authHeader.split(" ")[1];  //64
    const decoded = Buffer.from(base64, "base64").toString("utf-8"); //decode
    const [username, password] = decoded.split(":");

    const VALID_USERNAME = process.env.AUTH_USERNAME || "admin";
    const VALID_PASSWORD = process.env.AUTH_PASSWORD || "password123";

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) { //validate
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // 3. Parse & validate request body
    const body = await req.json();
    const { reportID, userID } = body;

    if (!reportID) {
      return NextResponse.json(
        { error: "Missing reportID in request body." },
        { status: 400 }
      );
    }

    if (!userID) {
      return NextResponse.json(
        { error: "Missing userID in request body." },
        { status: 400 }
      );
    }

    // 4. Generate one-time GUID token
    const token = uuidv4();

    // 5. Persist token in Redis
    //    Key format: APP_ID-userID-reportID
    //    TTL: 3600 seconds (1 hour) — adjust as needed
    const appId = process.env.APP_ID;

    if (!appId) {
      console.error("[Auth API] APP_ID is not defined in environment.");
      return NextResponse.json(
        { error: "Server misconfiguration: APP_ID is missing." },
        { status: 500 }
      );
    }

    const redisKey = `${appId}-${userID}-${reportID}`;

    try {
      await redis.set(redisKey, token, "EX", 3600);
      console.log(`[Auth API] Token stored → key: "${redisKey}"  TTL: 3600s`);
    } catch (redisError: unknown) {
      const msg = redisError instanceof Error ? redisError.message : String(redisError);
      console.error("[Auth API] Redis write failed:", msg);
      return NextResponse.json(
        { error: "Failed to store token in Redis.", detail: msg },
        { status: 500 }
      );
    }

    // 6. Return token + IDs to the caller
    return NextResponse.json(
      {
        success: true,
        token,
        reportID,
        userID,
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Auth API] Unhandled error:", msg);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON format in request body.", detail: msg },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", detail: msg },
      { status: 500 }
    );
  }
}
