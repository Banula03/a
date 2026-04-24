// src/app/view/[token]/page.tsx
import ReportViewer from "@/components/ReportViewer";
import { ShieldCheck } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ViewReportPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="banking-header shadow-sm">
        <div className="flex items-center gap-3 font-bold text-lg">
          <ShieldCheck className="text-blue-600" size={24} />
          <span>Report Gateway</span>
        </div>

        <div className="ml-auto text-xs text-gray-400 font-medium">
          SECURE VIEWING SESSION
        </div>
      </header>

      <ReportViewer token={token} />
    </div>
  );
}
