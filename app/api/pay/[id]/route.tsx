"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error || !data) {
        console.error("Error fetching invoice:", error?.message);
        setNotFound(true);
        return;
      }
      setInvoice(data);
    }

    if (resolvedParams.id) load();
  }, [resolvedParams.id]);

  async function pay() {
    if (!invoice) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: invoice.amount,
          invoiceId: invoice.id,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Checkout failed to initialize.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("A connection error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center font-serif italic text-stone-500">
      Invoice not found or already processed.
    </div>
  );

  if (!invoice) return (
    <div className="flex flex-col justify-center items-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-stone-300" size={32} />
      <p className="font-serif italic text-stone-500">Retrieving Treasury Record...</p>
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
            £{invoice.amount.toLocaleString()}
          </span>
        </div>

        <button
          onClick={pay}
          disabled={loading}
          className="w-full bg-[#a9b897] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={14} />}
          {loading ? "Routing to Stripe..." : "Confirm Payment"}
        </button>
        
        <p className="text-[9px] text-stone-300 uppercase tracking-tight font-bold">
          Encrypted via TOTs OS Protocol
        </p>
      </div>
    </div>
  );
}