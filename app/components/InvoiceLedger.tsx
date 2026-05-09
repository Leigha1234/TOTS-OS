"use client";

import { useState } from "react";
import { 
  Plus, Minus, Percent, Send, Mail, 
  FileText, Save, Check, Calculator, 
  ShieldCheck, ArrowRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LedgerItem {
  id: string;
  name: string;
  amount: number;
  quantity: number;
  total: number;
}

interface InvoiceLedgerProps {
  onDispatch: (items: LedgerItem[], total: number) => void;
  onSaveDraft: () => void;
  onApprove: () => void;
}

export function InvoiceLedger({ onDispatch, onSaveDraft, onApprove }: InvoiceLedgerProps) {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [vatRate, setVatRate] = useState("20");
  const [discountAmount, setDiscountAmount] = useState("");

  const addItem = () => {
    if (!newItemName || !newItemAmount) return;
    const amount = parseFloat(newItemAmount);
    const qty = parseInt(newItemQty) || 1;

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: newItemName,
        amount,
        quantity: qty,
        total: amount * qty,
      },
    ]);

    setNewItemName("");
    setNewItemAmount("");
    setNewItemQty("1");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const discount = parseFloat(discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const vat = taxableAmount * (parseFloat(vatRate) / 100);
  const total = taxableAmount + vat;

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-20">
      
      {/* 1. ENTRY FORM */}
      <section className="bg-[var(--card-bg)] border border-[var(--border)] p-10 md:p-14 rounded-[3.5rem] shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-[var(--brand-primary)] opacity-10">
          <Calculator size={80} strokeWidth={1} />
        </div>
        
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-[var(--brand-primary)]">
            <ShieldCheck size={14} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ledger Protocol</p>
          </div>
          <h3 className="text-4xl font-serif italic text-[var(--text-main)] tracking-tight">Line Item Entry</h3>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-[0.3em]">Item Description</label>
            <input
              placeholder="System Architecture / Consultation"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6 text-sm focus:ring-4 ring-[var(--brand-primary)]/5 outline-none transition-all font-medium placeholder:text-stone-300 text-[var(--text-main)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-[0.3em]">Unit Price (£)</label>
              <input
                type="number"
                placeholder="0.00"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6 text-sm focus:ring-4 ring-[var(--brand-primary)]/5 outline-none transition-all font-medium text-[var(--text-main)]"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-[0.3em]">Quantity</label>
              <input
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="w-full bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-6 text-sm focus:ring-4 ring-[var(--brand-primary)]/5 outline-none transition-all font-medium text-[var(--text-main)]"
              />
            </div>
          </div>

          <button
            onClick={addItem}
            disabled={!newItemName || !newItemAmount}
            className="w-full py-6 rounded-3xl flex justify-center items-center gap-4 bg-[var(--text-main)] text-[var(--bg)] disabled:opacity-30 hover:bg-[var(--brand-primary)] hover:text-white transition-all cursor-pointer font-black tracking-[0.2em] text-[11px] uppercase shadow-xl"
          >
            <Plus size={16} /> Record to Ledger
          </button>
        </div>
      </section>

      {/* 2. LEDGER REVIEW */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--card-bg)] border border-[var(--border)] p-10 md:p-14 rounded-[3.5rem] space-y-8"
          >
            <h4 className="text-2xl font-serif italic text-[var(--text-main)] tracking-tight">Current Allocation</h4>
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-6 group">
                  <div className="space-y-1">
                    <p className="font-bold text-[var(--text-main)] tracking-tight">{item.name}</p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                      £{item.amount.toFixed(2)} unit × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="font-mono text-[var(--text-main)] font-black text-lg">£{item.total.toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-3 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 3. TOTALS CALCULATOR */}
      <section className="bg-[var(--text-main)] text-[var(--bg)] p-10 md:p-14 rounded-[4rem] shadow-2xl space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase text-[var(--bg-soft)] opacity-40 tracking-[0.4em]">VAT Configuration</label>
            <div className="relative">
              <select
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="w-full bg-[#151515] border border-white/5 rounded-2xl p-6 text-xs text-white focus:ring-4 ring-[var(--brand-primary)]/20 outline-none appearance-none transition-all cursor-pointer font-black tracking-widest uppercase"
              >
                <option value="0">0% (Zero Rated)</option>
                <option value="5">5% (Reduced)</option>
                <option value="20">20% (Standard)</option>
              </select>
              <Percent size={14} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-600" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase text-[var(--bg-soft)] opacity-40 tracking-[0.4em]">Apply Discount (£)</label>
            <input
              type="number"
              placeholder="0.00"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full bg-[#151515] border border-white/5 rounded-2xl p-6 text-xs text-white focus:ring-4 ring-[var(--brand-primary)]/20 outline-none transition-all placeholder:text-stone-800 font-mono"
            />
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-[10px] font-black tracking-[0.5em] text-[var(--brand-primary)] uppercase">Deployment Total</p>
            <p className="text-6xl md:text-7xl font-mono tracking-tighter text-white">£{total.toFixed(2)}</p>
          </div>

          <button
            onClick={() => onDispatch(items, total)}
            className="w-full lg:w-auto px-12 py-7 rounded-3xl bg-[var(--brand-primary)] text-white font-black tracking-[0.3em] uppercase text-[11px] flex justify-center items-center gap-4 hover:opacity-90 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] group"
          >
            Dispatch Protocol <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 4. AUXILIARY ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {[
          { icon: Mail, label: "Dispatch Email", action: () => onDispatch(items, total) },
          { icon: FileText, label: "Export PDF", action: () => {} },
          { icon: Save, label: "Archive Draft", action: onSaveDraft },
          { icon: Check, label: "Approve Sync", action: onApprove, primary: true }
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`py-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
              btn.primary 
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
              : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-main)] hover:text-[var(--text-main)] shadow-sm'
            }`}
          >
            <btn.icon size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}