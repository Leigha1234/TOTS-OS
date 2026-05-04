"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Plus, Search, User, X } from "lucide-react";

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setCustomers(data);

    setLoading(false);
  }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      on_mailing_list: true,
      mailing_list_category: "General"
    };

    const { data, error } = await supabase
      .from("customers")
      .insert([payload])
      .select()
      .single();

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setCustomers((prev) => [data, ...prev]);

    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: ""
    });

    setShowModal(false);
    setSaving(false);
  }

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400 font-bold">
              CRM
            </p>
            <h1 className="text-5xl font-serif italic">Client Directory</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-xl border bg-white"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-[#a9b897] hover:opacity-90 p-4 rounded-xl"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* CUSTOMER LIST */}
        <div className="space-y-4">
          {loading && <p>Loading...</p>}

          {!loading &&
            filtered.map((customer) => (
              <div
                key={customer.id}
                className="bg-white border rounded-2xl p-6 flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                  <User size={20} />
                </div>

                <div>
                  <h3 className="text-xl font-semibold">{customer.name}</h3>
                  <p className="text-sm text-stone-500">{customer.company}</p>
                  <p className="text-xs text-stone-400">{customer.email}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />

          <div className="relative z-10 bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-serif italic">Add New Client</h2>

              <button onClick={() => setShowModal(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={addCustomer} className="space-y-4">
              <input
                required
                placeholder="Client name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border rounded-xl p-4"
              />

              <input
                placeholder="Company"
                value={form.company}
                onChange={(e) =>
                  setForm({ ...form, company: e.target.value })
                }
                className="w-full border rounded-xl p-4"
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full border rounded-xl p-4"
              />

              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className="w-full border rounded-xl p-4"
              />

              <textarea
                placeholder="Address"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                className="w-full border rounded-xl p-4 h-24"
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#a9b897] py-4 rounded-xl font-bold"
              >
                {saving ? "Saving..." : "Add Client"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}