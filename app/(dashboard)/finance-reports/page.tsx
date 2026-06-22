"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function CRMDirectory() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadOrg = async () => {
    // Organisation loading logic (unchanged)
  };

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contacts").select("*");
    if (!error && data) {
      setContacts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrg();
    loadData();
  }, []);

  const filteredContacts = contacts.filter((contact) =>
    (contact.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading contacts...</p>;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <header className="space-y-4">
          <h1 className="text-4xl font-serif italic">CRM Command Centre</h1>
          <p className="text-sm text-stone-500">
            Manage contacts, relationships, and organisational intelligence.
          </p>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts..."
            className="w-full p-3 border border-stone-200 rounded-xl"
          />
        </header>

        <section className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Contacts</h2>
            <span className="text-xs text-stone-400">
              {filteredContacts.length} records
            </span>
          </div>

          {loading ? (
            <p>Loading contacts...</p>
          ) : filteredContacts.length === 0 ? (
            <p className="text-stone-400 text-sm">No contacts found.</p>
          ) : (
            <ul className="space-y-2">
              {filteredContacts.map((contact) => (
                <li key={contact.id} className="p-3 border rounded-xl hover:bg-stone-50">
                  <Link href={`/crm/${contact.id}`}>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-xs text-stone-400">{contact.email || "No email"}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
}