import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error in child component tree:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-grow p-6 sm:p-12 flex flex-col items-center justify-center text-center font-mono bg-[#0B0F19] text-white">
          <div className="max-w-md w-full p-6 rounded-2xl border border-rose-500/40 bg-[#161C30] shadow-2xl space-y-4">
            <div className="p-3 w-12 h-12 mx-auto rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide text-rose-300">
                {this.props.fallbackTitle || 'Display Recovery Mode'}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                A data rendering inconsistency was intercepted. Your venture data and files remain intact.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-slate-700/50 text-[11px] text-slate-300 break-words font-mono text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload View</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
