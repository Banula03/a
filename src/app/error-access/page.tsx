"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const code   = searchParams.get("code")   ?? "ACCESS_DENIED";
  const reason = searchParams.get("reason") ?? "Access denied.";

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>

      {/* Header */}
      <div style={{ background: "#1d4ed8", color: "white", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "0.03em" }}>Banking Report Portal</span>
        <span style={{ fontSize: "13px", opacity: 0.85 }}>Secure Access Gateway</span>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 32px", maxWidth: "620px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#991b1b", marginBottom: "6px" }}>Access Denied</h1>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "28px" }}>
          Token verification failed. The details are listed below.
        </p>

        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={labelStyle}>Error Code</td>
              <td style={valueStyle}>{decodeURIComponent(code)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={labelStyle}>Reason</td>
              <td style={valueStyle}>{decodeURIComponent(reason)}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Status</td>
              <td style={valueStyle}>Token verification failed</td>
            </tr>
          </tbody>
        </table>

        <p style={{ marginTop: "32px", fontSize: "13px", color: "#555", lineHeight: "1.7" }}>
          Please request a new token from the banking system and try again.
          Tokens are valid for <strong>1 hour</strong> only.
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  padding: "10px 24px 10px 0",
  fontWeight: 600,
  color: "#374151",
  width: "140px",
  verticalAlign: "top",
};

const valueStyle: React.CSSProperties = {
  padding: "10px 0",
  color: "#111",
  wordBreak: "break-all",
};

export default function ErrorAccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
