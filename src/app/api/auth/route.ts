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
 *   {
 *     success:     true,
 *     token:       string,   ← GUID token
 *     reportID:    string,
 *     userID:      string,
 *     redirectUrl: string    ← ready-to-use browser GET URL
 *   }
 *
 * Side-effect:
 *   Stores the token in Redis under the key: APP_ID-token  (TTL: 1 h)
 */
export async function POST(req: NextRequest) {

  // Helper: builds the browser-facing error page URL
  // Backend can redirect the user's browser directly to this URL.
  function buildErrorUrl(code: string, message: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return `${appUrl}/error-access?code=${encodeURIComponent(code)}&reason=${encodeURIComponent(message)}`;
  }

  try {
    // 1. Validate Basic Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      const code = "MISSING_AUTH_HEADER";
      const msg  = "Authorization header is missing or not using Basic Auth.";
      return NextResponse.json(
        { errorCode: code, message: msg, errorUrl: buildErrorUrl(code, msg) },
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

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      const code = "INVALID_CREDENTIALS";
      const msg  = "The username or password you provided is incorrect.";
      return NextResponse.json(
        { errorCode: code, message: msg, errorUrl: buildErrorUrl(code, msg) },
        { status: 401 }
      );
    }

    // 3. Parse & validate request body
    const body = await req.json();
    const { reportID, userID } = body;

    if (!reportID) {
      const code = "MISSING_REPORT_ID";
      const msg  = "reportID is required in the request body.";
      return NextResponse.json(
        { errorCode: code, message: msg, errorUrl: buildErrorUrl(code, msg) },
        { status: 400 }
      );
    }

    if (!userID) {
      const code = "MISSING_USER_ID";
      const msg  = "userID is required in the request body.";
      return NextResponse.json(
        { errorCode: code, message: msg, errorUrl: buildErrorUrl(code, msg) },
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
      const code = "MISSING_APP_ID_CONFIG";
      const msg  = "Server misconfiguration: APP_ID environment variable is not set.";
      console.error("[Auth API] APP_ID is not defined in environment.");
      return NextResponse.json(
        { errorCode: code, message: msg, errorUrl: buildErrorUrl(code, msg) },
        { status: 500 }
      );
    }

    //    Key:   APP_ID-token  (e.g. "BANKAPP-550e8400-...")
    //    Value: JSON string  { userID, reportID }
    //    TTL:   3600 seconds (1 hour)
    const redisKey = `${appId}-${token}`;
    const redisValue = JSON.stringify({ userID, reportID });

    try {
      await redis.set(redisKey, redisValue, "EX", 3600);
      console.log(`[Auth API] Token stored → key: "${redisKey}"  value: ${redisValue}  TTL: 3600s`);
    } catch (redisError: unknown) {
      const msg = redisError instanceof Error ? redisError.message : String(redisError);
      console.error("[Auth API] Redis write failed:", msg);
      return NextResponse.json(
        { error: "Failed to store token in Redis.", detail: msg },
        { status: 500 }
      );
    }

    // 6. Build the browser redirect URL
    //    The backend will redirect the user's browser to this URL.
    //    Format: /report?token=<GUID>&appId=<APP_ID>&userId=<userID>
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectUrl = `${appUrl}/report?token=${token}&appId=${appId}&userId=${encodeURIComponent(userID)}`;

    console.log(`[Auth API] redirectUrl built → ${redirectUrl}`);

    // 7. Return token + IDs + redirect URL to the backend caller
    return NextResponse.json(
      {
        success: true,
        token,
        reportID,
        userID,
        redirectUrl,   // ← backend uses this to open the browser
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
