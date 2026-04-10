"use client";

import { useEffect, useState, use } from "react"; // Added 'use'
import { supabase } from "@/lib/supabase";

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  // We unwrap the params promise using the 'use' hook
  const resolvedParams = use(params); 
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        console.error("Error fetching invoice:", error.message);
        return;
      }
      setInvoice(data);
    }

    if (resolvedParams.id) {
      load();
    }
  }, [resolvedParams.id]);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Added headers
        body: JSON.stringify({
          amount: invoice.amount,
          invoiceId: invoice.id,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout session failed to start.");
      }
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!invoice) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="animate-pulse font-serif italic text-stone-500">Loading invoice details...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-stone-100 max-w-sm w-full text-center space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-serif italic text-stone-800">Pay Invoice</h1>
          <p className="text-stone-400 text-sm uppercase tracking-widest font-black">Treasury Bridge</p>
        </header>

        <div className="py-8 border-y border-stone-50">
          <span className="text-5xl font-serif italic text-stone-900">
            £{invoice.amount}
          </span>
        </div>

        <button
          onClick={pay}
          disabled={loading}
          className="w-full bg-[#a9b897] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
        
        <p className="text-[9px] text-stone-300 uppercase tracking-tight">
          Secure transaction via TOTs OS
        </p>
      </div>
    </div>
  );
}