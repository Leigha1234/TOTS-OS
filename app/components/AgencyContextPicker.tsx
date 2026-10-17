'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Context = { id: string; name: string; kind: 'direct' | 'delegated'; owner: boolean; permissions: Record<string, Record<string, boolean>> | null };
const STORAGE_KEY = 'tots_agency_preview_organisation_id';

export default function AgencyContextPicker() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in');
      const response = await fetch('/api/agency/contexts', {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load organisations');
      const list: Context[] = result.contexts || [];
      setContexts(list);
      const stored = window.localStorage.getItem(STORAGE_KEY) || '';
      const next = list.some(o => o.id === stored) ? stored : (list.find(o => o.kind === 'direct')?.id || list[0]?.id || '');
      setSelected(next);
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load organisations');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const active = contexts.find(o => o.id === selected);
  return (
    <section className="rounded-2xl border border-[#A9B897] bg-[#FAF8F5] p-5 text-[#4f4a46]">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Organisation selector — preview</h2><button type="button" onClick={() => void load()} className="text-sm underline">Refresh</button></div>
      <p className="mt-1 text-sm">Select an organisation to inspect your access. This does not switch live dashboard data yet.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <select aria-label="Choose organisation" className="mt-4 w-full rounded-lg border bg-white p-3" disabled={loading || !contexts.length} value={selected} onChange={e => { setSelected(e.target.value); window.localStorage.setItem(STORAGE_KEY, e.target.value); }}>
        {!contexts.length && <option value="">{loading ? 'Loading…' : 'No organisations found'}</option>}
        {contexts.map(o => <option key={o.id} value={o.id}>{o.name} — {o.kind === 'direct' ? 'My organisation' : 'Client access'}</option>)}
      </select>
      {active && <div className="mt-3 text-sm"><p><strong>Access:</strong> {active.kind === 'direct' ? 'Direct organisation access' : 'Delegated agency access'}</p>{active.permissions && <p className="mt-1"><strong>Granted modules:</strong> {Object.entries(active.permissions).filter(([, actions]) => Object.values(actions).some(Boolean)).map(([module]) => module).join(', ') || 'None'}</p>}</div>}
      <p className="mt-3 text-xs text-stone-600">Security note: this selection is a local preview preference, never proof of authorisation. Every future data request must verify the user, organisation, module and action on the server.</p>
    </section>
  );
}
