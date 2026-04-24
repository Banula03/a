"use client";

import { Shield, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleViewReport = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch("/api/report/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer change-me-super-secret-key"
        },
        body: JSON.stringify({
          reportId: "JASPER_SAMPLE_001",
          parameters: {
            "customer_id": "10042",
            "format": "pdf"
          }
        })
      });

      const data = await res.json();
      if (data.viewUrl) {
        router.push(data.viewUrl);
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="basic-card max-w-md w-full shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-blue-600" />
          <h1 className="text-xl font-bold">Banking Report Gateway</h1>
        </div>
        
        <p className="text-gray-600 mb-8">
          Click the button below to securely access your requested banking report.
        </p>

        <button 
          onClick={handleViewReport}
          disabled={isInitializing}
          className="btn-basic w-full flex items-center justify-center gap-2"
        >
          {isInitializing ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
          {isInitializing ? "Processing..." : "View Report"}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Secure session | Expires in 60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
