"use client";

import { Suspense } from "react";
import JoinForm from "../components/JoinForm"; // Ensure your logic is in a component

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <Suspense fallback={<div className="text-stone-400 animate-pulse">Initializing invitation...</div>}>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
          <h1 className="text-2xl font-serif italic mb-6">Join TOTS OS</h1>
          <JoinForm />
        </div>
      </Suspense>
    </div>
  );
}