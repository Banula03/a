import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/auth
 * Validates Basic Auth credentials and returns a GUID token.
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
    const base64 = authHeader.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    const [username, password] = decoded.split(":");

    const VALID_USERNAME = process.env.AUTH_USERNAME || "admin";
    const VALID_PASSWORD = process.env.AUTH_PASSWORD || "password123";

    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // 3. Validate request body
    const body = await req.json();
    const { reportID } = body;

    if (!reportID) {
      return NextResponse.json(
        { error: "Missing reportID in request body." },
        { status: 400 }
      );
    }

    // 4. Generate token (GUID)
    const token = uuidv4();

    // 5. Return token
    return NextResponse.json({
      success: true,
      token,
      reportID,
      message: "Authentication successful"
    }, { status: 200 });

  } catch (error) {
    console.error("[Auth API] Error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON format in request body." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
