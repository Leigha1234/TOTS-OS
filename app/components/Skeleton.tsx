"use client";

import React from "react";

interface SkeletonProps {
  loading: boolean;
  count?: number;
  className?: string;
}

export default function Skeleton({ 
  loading, 
  count = 6, 
  className = "grid md:grid-cols-2 gap-4" 
}: SkeletonProps) {
  if (!loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header/Featured item skeleton */}
      <div className="animate-pulse bg-white/5 border border-white/5 h-20 rounded-[2rem]" />
      
      {/* Grid of content skeletons */}
      <div className={className}>
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white/5 border border-white/5 animate-pulse rounded-2xl relative overflow-hidden"
          >
            {/* Subtle shimmer overlay for a more premium "OS" feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        ))}
      </div>
    </div>
  );
}