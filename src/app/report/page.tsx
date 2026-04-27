/**
 * /report?token=...&appId=...&userId=...
 *
 * Server Component — runs on the server.
 * 1. Reads token, appId, userId from URL query params
 * 2. Calls /api/verify to validate the token in Redis
 * 3. Valid   → renders session info + report iframe
 * 4. Invalid → redirects to /error-access
 */

import { redirect } from "next/navigation";

interface ReportPageProps {
  searchParams: Promise<{ token?: string; appId?: string; userId?: string }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {

  // Step 1 — Read URL query params
  const { token, appId, userId } = await searchParams;

  if (!token || !appId || !userId) {
    redirect("/error-access?code=MISSING_PARAMS&reason=token%2C+appId+and+userId+are+all+required.");
  }

  // Step 2 — Validate token in Redis (server-side only)
  let reportID: string;
  let verifiedUserID: string;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, appId, userId }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!data.valid) {
      const code    = encodeURIComponent(data.errorCode ?? "UNKNOWN_ERROR");
      const message = encodeURIComponent(data.message  ?? "Token verification failed.");
      redirect(`/error-access?code=${code}&reason=${message}`);
    }

    reportID       = data.reportID;
    verifiedUserID = data.userID;

  } catch {
    redirect("/error-access?code=SERVICE_UNAVAILABLE&reason=Verification+service+is+unavailable.");
  }

  const reportServerUrl = process.env.REPORT_SERVER_URL ?? "#";

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>

      {/* Header */}
      <div style={{ background: "#1d4ed8", color: "white", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "0.03em" }}>Banking Report Portal</span>
        <span style={{ fontSize: "13px", opacity: 0.85 }}>Secure Access Gateway</span>
      </div>

      {/* Session info bar */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 32px", display: "flex", gap: "40px", fontSize: "13px", color: "#374151" }}>
        <span><strong>User ID:</strong> {verifiedUserID}</span>
        <span><strong>Report ID:</strong> {reportID}</span>
        <span><strong>App ID:</strong> {appId}</span>
        <span><strong>Token Status:</strong> Verified</span>
      </div>

      {/* Report iframe */}
      <div style={{ padding: "24px 32px" }}>
        <iframe
          src={`${reportServerUrl}?reportID=${reportID}&userID=${verifiedUserID}`}
          title={`Report ${reportID}`}
          style={{ width: "100%", height: "80vh", border: "1px solid #d1d5db", background: "white" }}
        />
      </div>

    </div>
  );
}
