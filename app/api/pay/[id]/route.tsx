"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PayPage({ params }: any) {
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", params.id)
      .single();

    setInvoice(data);
  }

  async function pay() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        amount: invoice.amount,
        invoiceId: invoice.id,
      }),
    });

    const { url } = await res.json();
    window.location.href = url;
  }

  if (!invoice) return <p>Loading...</p>;

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl mb-4">Pay Invoice</h1>
      <p>£{invoice.amount}</p>

      <button
        onClick={pay}
        className="bg-blue-600 px-4 py-2 mt-4 rounded"
      >
        Pay Now
      </button>
    </div>
  );
}