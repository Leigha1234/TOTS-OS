"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border-2 border-dashed border-red-100 text-center">
          <div className="bg-red-50 p-4 rounded-full mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-serif italic text-stone-800 mb-2">Clarity Encountered a Fog.</h2>
          <p className="text-stone-400 text-sm max-w-xs mb-8">The interface hit an unexpected error. Your data is safe, but the view needs to reset.</p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-stone-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            <RefreshCw size={14} /> Re-Sync Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}