"use client";

import { Suspense } from "react";

function JoinContent() {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
      <h1 className="text-2xl font-serif italic mb-6">Join TOTS OS</h1>
      <p className="text-stone-500">Processing your invitation...</p>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <JoinContent />
      </Suspense>
    </div>
  );
}