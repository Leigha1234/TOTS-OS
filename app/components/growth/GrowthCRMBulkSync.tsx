'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Result = { leadId: string; status: string; error?: string };
export default function GrowthCRMBulkSync({ organisationId, leadIds }: { organisationId: string; leadIds: string[] }) {
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewed, setPreviewed] = useState(false);
  async function run(execute: boolean) {
    setBusy(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in again');
      const response = await fetch('/api/growth/crm/bulk', {
        method: execute ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisationId, leadIds: leadIds.slice(0, 50) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'CRM synchronisation failed');
      setResults(data.results || []);
      setPreviewed(!execute);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unexpected error'); setPreviewed(false); }
    finally { setBusy(false); }
  }
  const counts = results.reduce<Record<string, number>>((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  return <section className="rounded-xl border bg-white p-5 space-y-3">
    <h3 className="font-semibold">CRM batch synchronisation</h3>
    <p className="text-sm text-gray-600">Preview up to 50 currently displayed leads, then confirm matching or creating CRM contacts. Leads without emails and ambiguous matches require manual review. No emails are sent and marketing consent is never changed.</p>
    <div className="flex flex-wrap gap-2">
      <button className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" disabled={busy || !leadIds.length} onClick={() => void run(false)}>Preview CRM sync</button>
      {previewed && <button className="rounded-lg bg-emerald-900 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={busy} onClick={() => { if (window.confirm('Create or link CRM contacts for the previewed leads?')) void run(true); }}>Confirm CRM sync</button>}
    </div>
    {Object.keys(counts).length > 0 && <p role="status" className="text-sm">{Object.entries(counts).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`).join(' · ')}</p>}
    {results.filter(r => r.error).slice(0, 10).map(r => <p className="text-xs text-amber-800" key={r.leadId}>{r.leadId}: {r.error}</p>)}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
