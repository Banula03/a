// src/app/api/report/data/[token]/route.ts
// GET /api/report/data/:token
//
// Called by the client-side report viewer to retrieve the cached
// report payload using the GUID token. Token is deleted from Redis
// after first read (one-time use within the 30s window).

import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import type { ReportPayload } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  const key = `report:${token}`;
  const raw = await redis.get(key);

  if (!raw) {
    return NextResponse.json(
      { error: "Token not found or expired." },
      { status: 404 }
    );
  }

  // One-time use: delete after read
  await redis.del(key);

  let payload: ReportPayload;
  try {
    payload = JSON.parse(raw) as ReportPayload;
  } catch {
    return NextResponse.json(
      { error: "Corrupted payload in cache." },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: payload }, { status: 200 });
}
