import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorRefCode: string;
  copied: boolean;
}

export default class FinacleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorRefCode: "",
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const code = `FIN-ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorRefCode: code };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[Finacle Terminal ErrorBoundary Caught]:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/fincore";
  };

  handleCopyDiagnostics = () => {
    const { error, errorInfo, errorRefCode } = this.state;
    const diag = `--- FINACLE RUNTIME DIAGNOSTIC DUMP ---
Reference Code: ${errorRefCode}
Timestamp: ${new Date().toISOString()}
Error: ${error?.toString()}
Component Stack:
${errorInfo?.componentStack || "N/A"}`;

    navigator.clipboard.writeText(diag).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-[#d4d0c8] flex items-center justify-center p-4 font-sans select-none" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
          <div className="max-w-xl w-full bg-white border-2 border-[#104080] shadow-2xl rounded-sm overflow-hidden text-xs">
            {/* Finacle Error Header */}
            <div className="bg-[#104080] text-white px-3.5 py-2 flex items-center justify-between border-b border-[#0a2850]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span className="font-bold tracking-wider uppercase text-xs">
                  SYSTEM EXCEPTION / TERMINAL RECOVERY
                </span>
              </div>
              <span className="font-mono text-[10.5px] bg-red-950/80 text-amber-300 border border-red-800 px-2 py-0.5 rounded font-bold">
                REF: {this.state.errorRefCode}
              </span>
            </div>

            {/* Error Body */}
            <div className="p-4 space-y-3.5 bg-[#fbfcfd]">
              <div className="flex items-start gap-3 bg-red-50/70 border border-red-200 p-3 rounded">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-red-900 text-xs uppercase tracking-wide">
                    Workstation Runtime Error Detected
                  </h4>
                  <p className="text-gray-700 text-[11.5px] leading-relaxed">
                    An unhandled rendering exception occurred during screen execution. 
                    Backend records, general ledgers, and transactions remain completely protected.
                  </p>
                </div>
              </div>

              {/* Error Message Box */}
              <div className="bg-[#f0f4f8] border border-[#c4d4ec] p-2.5 rounded font-mono text-[11px] text-gray-800 break-words">
                <span className="text-[#104080] font-bold block mb-0.5">Exception Message:</span>
                <span className="text-red-700 font-semibold">{this.state.error?.message || "Unknown Application Runtime Error"}</span>
              </div>

              {/* Collapsible Technical Details */}
              <details className="border border-gray-200 rounded p-2 text-[10.5px] bg-white">
                <summary className="font-bold text-gray-600 cursor-pointer hover:text-[#104080] select-none">
                  View Technical Stack Trace for Systems Audit
                </summary>
                <div className="mt-2 font-mono text-[10px] text-gray-600 bg-gray-50 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap border border-gray-200">
                  {this.state.errorInfo?.componentStack || this.state.error?.stack || "No additional stack trace available."}
                </div>
              </details>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={this.handleCopyDiagnostics}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded text-xs font-bold cursor-pointer transition-colors"
                >
                  {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                  <span>{this.state.copied ? "Diagnostics Copied" : "Copy Diagnostic Log"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={this.handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#104080] text-[#104080] rounded text-xs font-bold cursor-pointer shadow-2xs transition-colors"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Return to Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={this.handleReload}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#104080] hover:bg-[#1a559e] text-white rounded text-xs font-extrabold cursor-pointer shadow-md transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload Session</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
