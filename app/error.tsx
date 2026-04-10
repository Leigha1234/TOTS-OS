'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 🕵️‍♂️ THE SNITCH LOGIC
    const reportBug = async () => {
      await supabase.functions.invoke('report-bug', {
        body: { 
          errorDetails: error.message,
          location: window.location.href,
          userEmail: "active_user_session" // You can pull this from your Auth context
        }
      })
    }
    
    reportBug()
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-12 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-4xl font-serif italic text-stone-800">System Deviation.</h2>
        <p className="text-stone-400 text-sm">
          A glitch was detected in the grid. Our engineers have been notified via the Sentinel Protocol.
        </p>
        <button 
          onClick={() => reset()}
          className="px-8 py-3 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest"
        >
          Re-Initialize
        </button>
      </div>
    </div>
  )
}