// src/app/api/report/init/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { redis, TOKEN_TTL } from "@/lib/redis";
import { InitRequestSchema } from "@/lib/types";

const API_SECRET_KEY = process.env.API_SECRET_KEY;
const REPORT_SERVER_BASE_URL = process.env.REPORT_SERVER_BASE_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const requestId = uuidv4();
  console.log(`[API][${requestId}] Incoming report initialization request`);

  try {
    // 1. Authorization Check (Temporarily disabled for testing)

    const authHeader = req.headers.get("authorization");
    if (!API_SECRET_KEY || authHeader !== `Bearer ${API_SECRET_KEY}`) {
      console.warn(`[API][${requestId}] Unauthorized access attempt`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Body Parsing & Validation
    const body = await req.json();
    const result = InitRequestSchema.safeParse(body);

    if (!result.success) {
      console.warn(`[API][${requestId}] Invalid request body:`, result.error.format());
      return NextResponse.json({
        error: "Invalid request data",
        details: result.error.format()
      }, { status: 400 });
    }

    const { reportId, parameters, baseUrl } = result.data;

    // 3. Token Generation
    const token = uuidv4();

    // 4. Persistence
    const payload = {
      reportId,
      parameters,
      baseUrl: baseUrl || APP_URL,
      reportServerUrl: REPORT_SERVER_BASE_URL || "",
      createdAt: Date.now(),
    };

    if (!REPORT_SERVER_BASE_URL) {
      console.error(`[API][${requestId}] REPORT_SERVER_BASE_URL not configured`);
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    await redis.setex(
      `report:${token}`,
      TOKEN_TTL,
      JSON.stringify(payload)
    );

    console.log(`[API][${requestId}] Successfully registered report ${reportId} with token ${token}`);

    // 5. Response
    return NextResponse.json({
      token,
      viewUrl: `${APP_URL}/view/${token}`,
      expiresInSeconds: TOKEN_TTL
    }, { status: 201 });

  } catch (error) {
    console.error(`[API][${requestId}] Internal Server Error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
