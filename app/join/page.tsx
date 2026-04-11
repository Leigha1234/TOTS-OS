"use client";

import { Suspense } from "react";
// Import your JoinComponent logic here

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-50">Loading...</div>}>
      {/* YOUR ACTUAL JOIN PAGE CONTENT HERE */}
      <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-3xl border border-stone-100 shadow-sm">
        <h1 className="text-2xl font-serif italic mb-4">Joining the Firm...</h1>
        {/* Component that uses useSearchParams() goes here */}
      </div>
    </Suspense>
  );
}