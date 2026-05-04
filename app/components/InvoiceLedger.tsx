"use client";

import { useState } from "react";
import { Plus, Minus, Banknote, Percent, Send, Mail, FileText, Save, Check } from "lucide-react";

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
    <div className="space-y-8">
      {/* ADD ITEM FORM */}
      <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-8">
        <div className="space-y-2">
          <h3 className="text-2xl font-serif italic text-stone-800 tracking-tight">New Ledger Entry</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Add an item to this invoice</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Item Description</label>
            <input
              placeholder="e.g. Node Maintenance"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300 text-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Price (£)</label>
              <input
                type="number"
                placeholder="0"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300 text-stone-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Quantity</label>
              <input
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
              />
            </div>
          </div>

          <button
            onClick={addItem}
            disabled={!newItemName || !newItemAmount}
            className="w-full py-5 rounded-[2rem] flex justify-center items-center gap-4 bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-all cursor-pointer font-bold tracking-[0.2em] text-xs uppercase shadow-xl"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* LEDGER ITEMS */}
      {items.length > 0 && (
        <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
          <h4 className="text-2xl font-serif italic text-stone-800 tracking-tight">Ledger Items</h4>
          <div className="divide-y divide-stone-100">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-4">
                <div>
                  <p className="font-semibold text-stone-800">{item.name}</p>
                  <p className="text-xs text-stone-400">
                    £{item.amount} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono text-stone-900 font-bold">£{item.total.toFixed(2)}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VAT & TOTALS PANEL */}
      <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">VAT Rate (%)</label>
            <div className="relative">
              <select
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none appearance-none transition-all cursor-pointer font-bold"
              >
                <option value="0">0% (Zero Rated)</option>
                <option value="5">5% (Reduced Rate)</option>
                <option value="20">20% (Standard Rate)</option>
              </select>
              <Percent size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">Discount Amount (£)</label>
            <input
              type="number"
              placeholder="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none transition-all placeholder:text-stone-700 font-bold"
            />
          </div>
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-left">
            <p className="text-[10px] font-black tracking-widest text-stone-500 uppercase">Grand Total</p>
            <p className="text-5xl font-mono tracking-tighter">£{total.toFixed(2)}</p>
          </div>

          <button
            onClick={() => onDispatch(items, total)}
            className="w-full md:w-auto px-10 py-5 rounded-[2rem] bg-[#a9b897] text-stone-900 font-bold tracking-[0.3em] uppercase text-xs flex justify-center items-center gap-4 hover:bg-[#99a888] transition-all"
          >
            <Send size={16} /> Dispatch Ledger
          </button>
        </div>
      </div>

      {/* ACTIONS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onDispatch(items, total)}
          className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm"
        >
          <Mail size={16} />
          <span className="text-[8px] font-black uppercase tracking-wider">Email to Client</span>
        </button>

        <button
          onClick={() => alert("PDF processing...")}
          className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm"
        >
          <FileText size={16} />
          <span className="text-[8px] font-black uppercase tracking-wider">Export PDF</span>
        </button>

        <button
          onClick={onSaveDraft}
          className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm"
        >
          <Save size={16} />
          <span className="text-[8px] font-black uppercase tracking-wider">Save Draft</span>
        </button>

        <button
          onClick={onApprove}
          className="py-4 bg-green-50 border border-green-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-green-600 hover:bg-green-100/40 transition-all cursor-pointer"
        >
          <Check size={16} />
          <span className="text-[8px] font-black uppercase tracking-wider">Approve</span>
        </button>
      </div>
    </div>
  );
}