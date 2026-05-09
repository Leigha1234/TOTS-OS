import { supabaseAdmin } from "@/lib/supabase-admin";
import { runClarity } from "@/lib/clarity";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. NEURAL LINK VERIFICATION
    // Check if the API key exists before even touching the database
    if (!process.env.GEMINI_API_KEY) {
      console.error("CRITICAL_ERROR: GEMINI_API_KEY is not defined in Vercel.");
      return NextResponse.json(
        { 
          error: "Neural Link Offline", 
          details: "Gemini API Key missing from environment configuration." 
        }, 
        { status: 500 }
      );
    }

    // 2. DATA ACQUISITION
    // Fetching the raw nodes for analysis
    const [invoicesRes, tasksRes] = await Promise.all([
      supabaseAdmin.from("invoices").select("*"),
      supabaseAdmin.from("tasks").select("*")
    ]);

    if (invoicesRes.error || tasksRes.error) {
      throw new Error("Failed to synchronize with Supabase ledger.");
    }

    // 3. EXECUTE CLARITY INTELLIGENCE
    // This calls your Gemini logic in @/lib/clarity
    const results = await runClarity({
      invoices: invoicesRes.data || [],
      tasks: tasksRes.data || [],
      teamId: "system", // Ensure this matches your internal system ID
    });

    // 4. SUCCESS RESPONSE
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      status: "Neural analysis complete",
      nodeCount: (invoicesRes.data?.length || 0) + (tasksRes.data?.length || 0)
    });

  } catch (err: any) {
    console.error("CLARITY_RUN_FAILURE:", err);
    
    return NextResponse.json(
      { 
        error: "Intelligence Protocol Failure", 
        message: err.message 
      }, 
      { status: 500 }
    );
  }
}