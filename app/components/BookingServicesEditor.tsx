"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/auth";

type Rule = "none" | "fixed" | "percentage" | "full";
type Service = {
  id: string;
  booking_page_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_pence: number;
  payment_rule: Rule;
  deposit_value: number;
  is_active: boolean;
  sort_order: number;
};

type Draft = Omit<Service, "id" | "booking_page_id">;
const blank: Draft = {
  name: "",
  description: "",
  duration_minutes: 60,
  price_pence: 0,
  payment_rule: "none",
  deposit_value: 0,
  is_active: true,
  sort_order: 0,
};

const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

// Keep pounds as text while editing so typing "45.50" never gets rewritten mid-keystroke.
function poundsToPence(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

export default function BookingServicesEditor({ bookingPageId }: { bookingPageId: string }) {
  const [rows, setRows] = useState<Service[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [priceInput, setPriceInput] = useState("");
  const [depositInput, setDepositInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!bookingPageId) return;
    const db = createClient();
    const { data, error: loadError } = await db
      .from("booking_services")
      .select("*")
      .eq("booking_page_id", bookingPageId)
      .order("sort_order")
      .order("created_at");
    if (loadError) setError(loadError.message);
    else setRows((data || []) as Service[]);
  }, [bookingPageId]);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    setError("");
    setMessage("");
    const pricePence = priceInput.trim() === "" ? 0 : poundsToPence(priceInput);
    if (pricePence === null) {
      setError("Enter a valid price in pounds, with no more than two decimal places.");
      return;
    }
    const depositValue = draft.payment_rule === "fixed"
      ? poundsToPence(depositInput)
      : draft.payment_rule === "percentage"
        ? Number(depositInput)
        : 0;
    if (!draft.name.trim()) { setError("Enter a service name."); return; }
    if (!Number.isInteger(draft.duration_minutes) || draft.duration_minutes < 5 || draft.duration_minutes > 1440) {
      setError("Duration must be 5–1440 whole minutes."); return;
    }
    if (draft.payment_rule !== "none" && pricePence <= 0) {
      setError("Paid services need a price."); return;
    }
    if (draft.payment_rule === "percentage" && (depositValue === null || !Number.isInteger(depositValue) || depositValue <= 0 || depositValue > 100)) {
      setError("Percentage must be a whole number between 1 and 100."); return;
    }
    if (draft.payment_rule === "fixed" && (depositValue === null || depositValue <= 0 || depositValue > pricePence)) {
      setError("Fixed deposit must be greater than £0 and no more than the service price."); return;
    }

    setBusy(true);
    try {
      const db = createClient();
      const { error: insertError } = await db.from("booking_services").insert({
        ...draft,
        name: draft.name.trim(),
        price_pence: pricePence,
        deposit_value: depositValue ?? 0,
        booking_page_id: bookingPageId,
        sort_order: rows.length,
      });
      if (insertError) setError(insertError.message);
      else {
        setDraft(blank);
        setPriceInput("");
        setDepositInput("");
        setMessage("Service saved successfully. Active services are available to the public booking flow when that flow is enabled.");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function update(row: Service, changes: Partial<Service>) {
    setError("");
    setMessage("");
    const next = { ...row, ...changes };
    setRows((prev) => prev.map((x) => x.id === row.id ? next : x));
    const db = createClient();
    const { error: updateError } = await db.from("booking_services")
      .update(changes).eq("id", row.id).eq("booking_page_id", bookingPageId);
    if (updateError) { setError(updateError.message); void load(); }
  }

  return (
    <section className="rounded-[2rem] border border-[#E1EAE2] bg-white p-6 md:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">Services &amp; booking rules</p>
      <h3 className="mt-2 text-2xl font-serif text-[#183E31]">Your appointment menu</h3>
      <p className="mt-2 text-sm text-[#52665B]">
        Create services with individual prices, durations and deposit rules. Active services can appear on your public booking page when the booking flow is enabled.
      </p>

      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-[#183E31]">{row.name}</div>
              <div className="text-xs text-stone-500">
                {row.duration_minutes} min · {money(row.price_pence)} · {row.payment_rule === "none"
                  ? "No payment"
                  : row.payment_rule === "full"
                    ? "Full payment"
                    : row.payment_rule === "fixed"
                      ? `${money(row.deposit_value)} deposit`
                      : `${row.deposit_value}% deposit`}
              </div>
            </div>
            <label className="text-xs flex items-center gap-2">
              <input type="checkbox" checked={row.is_active} onChange={(e) => void update(row, { is_active: e.target.checked })} />
              Active
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm">Service name
          <input className="form-input mt-2" placeholder="e.g. Lash lift" value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
        </label>
        <label className="text-sm">Duration (minutes)
          <input className="form-input mt-2" type="number" min="5" max="1440" step="1"
            value={draft.duration_minutes}
            onChange={(e) => setDraft((d) => ({ ...d, duration_minutes: Number(e.target.value) }))} />
        </label>
        <label className="text-sm">Price (£)
          <input className="form-input mt-2" type="text" inputMode="decimal" placeholder="e.g. 45.00"
            value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
        </label>
        <label className="text-sm">Payment rule
          <select className="form-input mt-2" value={draft.payment_rule}
            onChange={(e) => { setDraft((d) => ({ ...d, payment_rule: e.target.value as Rule, deposit_value: 0 })); setDepositInput(""); }}>
            <option value="none">No payment</option>
            <option value="fixed">Fixed deposit</option>
            <option value="percentage">Percentage deposit</option>
            <option value="full">Full payment</option>
          </select>
        </label>
        {(draft.payment_rule === "fixed" || draft.payment_rule === "percentage") && (
          <label className="text-sm">{draft.payment_rule === "fixed" ? "Deposit (£)" : "Deposit (%)"}
            <input className="form-input mt-2" type="text"
              inputMode={draft.payment_rule === "fixed" ? "decimal" : "numeric"}
              placeholder={draft.payment_rule === "fixed" ? "e.g. 20.00" : "e.g. 50"}
              value={depositInput} onChange={(e) => setDepositInput(e.target.value)} />
          </label>
        )}
        <label className="text-sm md:col-span-2">Description
          <textarea className="form-input mt-2" value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
        </label>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-800">{message}</p>}
      <button type="button" disabled={busy || !bookingPageId} onClick={() => void add()}
        className="mt-4 rounded-xl bg-[#103F33] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? "Saving…" : "Add service"}
      </button>
    </section>
  );
}
