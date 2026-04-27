import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

/**
 * POST /api/verify
 *
 * Called by the /report page (server-side) to validate the token
 * that arrived in the URL query params.
 *
 * Request body:
 *   { token: string, appId: string, userId: string }
 *
 * What it does:
 *   1. Builds Redis key  →  appId-token  (e.g. "BANKAPP-550e8400-...")
 *   2. Looks up that key in Redis
 *   3. Compares the stored userID with the userId from the request
 *   4. If match  → returns { valid: true, reportID, userID }
 *   5. If no match / key missing → returns { valid: false, reason: "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, appId, userId } = body;

    // ── 1. Validate all required inputs are present ─────────────────
    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          errorCode: "MISSING_TOKEN",
          message: "No token provided in the request body.",
        },
        { status: 400 }
      );
    }

    if (!appId) {
      return NextResponse.json(
        {
          valid: false,
          errorCode: "MISSING_APP_ID",
          message: "No appId provided in the request body.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          valid: false,
          errorCode: "MISSING_USER_ID",
          message: "No userId provided in the request body.",
        },
        { status: 400 }
      );
    }

    // ── 2. Build the Redis key (same pattern used in /api/auth) ─────────
    //       Key format: APP_ID-token
    const redisKey = `${appId}-${token}`;

    // ── 3. Look up the key in Redis ─────────────────────────────────
    const raw = await redis.get(redisKey);

    if (!raw) {
      return NextResponse.json(
        {
          valid: false,
          errorCode: "TOKEN_NOT_FOUND",
          message: "Token is invalid, has expired, or was never issued. Please request a new token.",
        },
        { status: 401 }
      );
    }

    // ── 4. Parse the stored value  { userID, reportID } ───────────────
    const stored: { userID: string; reportID: string } = JSON.parse(raw);

    // ── 5. Compare userID ──────────────────────────────────────────────
    console.log(`[Verify API] Comparing  stored.userID: "${stored.userID}"  vs  received userId: "${userId}"`);

    if (stored.userID !== userId) {
      return NextResponse.json(
        {
          valid: false,
          errorCode: "USER_ID_MISMATCH",
          message: "The userId you provided does not match the user this token was issued for.",
        },
        { status: 403 }
      );
    }

    // ── 6. All checks passed → return report access data ──────────────
    console.log(
      `[Verify API] Token valid → key: "${redisKey}"  reportID: ${stored.reportID}  userID: ${stored.userID}`
    );

    return NextResponse.json(
      {
        valid: true,
        reportID: stored.reportID,
        userID: stored.userID,
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Verify API] Unhandled error:", msg);

    return NextResponse.json(
      { valid: false, reason: "Internal server error.", detail: msg },
      { status: 500 }
    );
  }
}
