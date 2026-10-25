import { RefreshCw } from "lucide-react";

interface FinacleScreenLoaderProps {
  message?: string;
  subMessage?: string;
}

export default function FinacleScreenLoader({ 
  message = "Loading Core Banking Module...", 
  subMessage = "Establishing secure encrypted session channel." 
}: FinacleScreenLoaderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f4f7fb] select-none" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="bg-white border-2 border-[#104080] shadow-lg p-5 max-w-sm w-full text-center space-y-3 rounded-xs">
        <div className="bg-[#104080] text-white py-1 px-2.5 text-[11px] font-bold tracking-wider uppercase flex items-center justify-between">
          <span>FINACLE WORKSTATION</span>
          <span>INITIALIZING</span>
        </div>
        <div className="flex flex-col items-center gap-2.5 py-2">
          <RefreshCw className="w-6 h-6 text-[#104080] animate-spin" />
          <div className="text-xs font-bold text-[#104080]">
            {message}
          </div>
          <div className="text-[10.5px] text-gray-500">
            {subMessage}
          </div>
        </div>
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#104080] h-full w-2/3 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}
