"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Plus, Search, User, X } from "lucide-react";

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchDirectory();
  }, []);

  async function fetchDirectory() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCustomers(data);
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("customers").insert([
      {
        ...form,
      },
    ]);

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
    });

    setShowModal(false);
    await fetchDirectory();
    setSubmitting(false);
  }

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen bg-white p-8 md:p-16">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <p className="text-[#a9b897] text-xs uppercase font-bold tracking-[0.3em]">
                Central Intelligence
              </p>
              <h1 className="text-5xl font-serif italic">Directory</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="pl-12 pr-4 py-3 rounded-xl border bg-stone-50"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="bg-[#a9b897] p-4 rounded-xl hover:opacity-90"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>

          {/* Directory List */}
          <div className="space-y-4">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                className="p-6 rounded-3xl border bg-stone-50 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center">
                  <User size={22} />
                </div>

                <div>
                  <h3 className="text-2xl font-serif italic">
                    {customer.name}
                  </h3>
                  <p className="text-xs uppercase tracking-widest text-stone-400">
                    {customer.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-2xl rounded-[2rem] p-10 shadow-2xl mx-4">

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif italic">
                Add New Client
              </h2>

              <button onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                required
                placeholder="Full Name"
                className="w-full p-4 rounded-xl border bg-stone-50"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <input
                placeholder="Company"
                className="w-full p-4 rounded-xl border bg-stone-50"
                value={form.company}
                onChange={(e) =>
                  setForm({ ...form, company: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Email"
                  className="p-4 rounded-xl border bg-stone-50"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />

                <input
                  placeholder="Phone"
                  className="p-4 rounded-xl border bg-stone-50"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>

              <textarea
                placeholder="Address"
                className="w-full p-4 rounded-xl border bg-stone-50 h-24"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#a9b897] py-4 rounded-xl font-bold uppercase"
              >
                {submitting ? "Saving..." : "Add Client"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}