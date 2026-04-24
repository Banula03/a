"use client";

import React, { useEffect, useState } from "react";
import { Shield, FileText, AlertCircle, Printer, RefreshCw } from "lucide-react";
import type { ReportPayload } from "@/lib/types";

interface Props {
  token: string;
}

export default function ReportViewer({ token }: Props) {
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const hasFetched = React.useRef(false);

  const fetchReportData = async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/report/data/${token}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load report data");
      }

      setData(json.data);

      // Calculate remaining time
      const expiresAt = json.data.createdAt + (30 * 1000);
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [token]);

  // Live Auto-Expiry Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || error) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setError("Session expired. This report link is no longer active.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, error]);

  const reportUrl = data
    ? `${data.reportServerUrl}/${data.reportId}?${new URLSearchParams(data.parameters as any).toString()}`
    : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <RefreshCw className="animate-spin text-blue-600" />
        <p>Loading secure report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="basic-card max-w-lg mx-auto mt-20 text-center border-red-200">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Access Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => window.location.href = '/'} className="btn-basic">
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="report-viewport">
      <div className="report-controls">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
            <Shield size={16} />
            SECURE SESSION
          </div>
          <div className="text-gray-400">|</div>
          {timeLeft !== null && !error && (
            <div className={`flex items-center gap-2 text-xs font-bold ${timeLeft < 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
              <RefreshCw size={14} className={timeLeft < 10 ? '' : 'animate-spin-slow'} />
              EXPIRES IN: {timeLeft}s
            </div>
          )}
          <div className="text-gray-400">|</div>
          <div className="flex items-center gap-2 font-medium">
            <FileText size={16} />
            {data?.reportId}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
            <Printer size={14} className="inline mr-2" />
            Print
          </button>
        </div>
      </div>

      <div className="report-frame-container">
        <iframe
          src={reportUrl!}
          title="Banking Report Content"
        />
      </div>

      <div className="text-center py-4 text-xs text-gray-400">
        One-time access | Powered by Secure Gateway
      </div>
    </div>
  );
}
