import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Last line of defence: a render error in any view must never leave the
 * advocate staring at a blank screen. Instead we keep the app shell styling
 * and offer a reload, while the console keeps the full stack for diagnostics.
 */
export default class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || "Unknown error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled application render error", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#0b1320] text-slate-100 flex items-center justify-center p-6 font-sans"
      >
        <div className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-slate-900/80 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-lg font-black text-amber-300">تعذر عرض هذا القسم</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            حدث خطأ غير متوقع أثناء عرض الشاشة. بياناتك محفوظة على هذا الجهاز ولم تفقد.
          </p>
          <p className="mt-3 rounded-xl bg-slate-950/60 px-3 py-2 text-left text-[11px] font-mono text-slate-500" dir="ltr">
            {this.state.errorMessage}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-400"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
            >
              إعادة تحميل النظام
            </button>
          </div>
        </div>
      </div>
    );
  }
}
