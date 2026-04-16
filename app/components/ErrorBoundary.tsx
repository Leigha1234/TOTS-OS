"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You could send this to an error reporting service like Sentry or LogSnag here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    // If the error persists, it will just trigger the boundary again.
    // If it was a transient UI glitch, the app recovers instantly.
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border-2 border-dashed border-red-100 text-center shadow-inner">
          <div className="bg-red-50 p-4 rounded-full mb-6 animate-bounce-short">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          
          <h2 className="text-2xl font-serif italic text-stone-800 mb-2">
            Clarity Encountered a Fog.
          </h2>
          
          <p className="text-stone-400 text-sm max-w-xs mb-8">
            The interface hit an unexpected error. Your data is safe, but the view needs to reset.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
            >
              <RefreshCw size={14} /> Attempt Quick Recovery
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter hover:text-stone-600 underline underline-offset-4"
            >
              Force Full Page Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}