"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, ChevronDown, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Context = {
  id: string;
  name: string;
  kind: "direct" | "delegated";
  owner: boolean;
  permissions: Record<string, Record<string, boolean>> | null;
};

export const ACTIVE_ORGANISATION_KEY = "tots_agency_preview_organisation_id";

export default function GlobalOrganisationSwitcher({ compact = false }: { compact?: boolean }) {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in");
      const response = await fetch("/api/agency/contexts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load organisations");
      const available = (result.contexts || []) as Context[];
      setContexts(available);
      const saved = localStorage.getItem(ACTIVE_ORGANISATION_KEY);
      const next = available.find(o => o.id === saved)?.id
        || available.find(o => o.kind === "direct")?.id
        || available[0]?.id || "";
      setSelected(next);
      if (next) localStorage.setItem(ACTIVE_ORGANISATION_KEY, next);
      else localStorage.removeItem(ACTIVE_ORGANISATION_KEY);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load organisations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const active = contexts.find(o => o.id === selected);
  return (
    <div className="rounded-xl border border-[#A9B897]/70 bg-[#FAF8F5] p-2 text-[#4f4a46]">
      {compact ? (
        <button type="button" onClick={() => void refresh()} title={`Organisation: ${active?.name || "Loading"} (preview)`}
          className="flex w-full justify-center p-1"><Building2 size={19} /></button>
      ) : (
        <>
          <div className="mb-1 flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"><Building2 size={12} /> Organisation</span>
            <button type="button" title="Refresh organisations" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="relative">
            <select aria-label="Selected organisation (preview)" value={selected} disabled={loading || !contexts.length}
              onChange={e => {
                const next = e.target.value;
                if (!contexts.some(o => o.id === next)) return;
                setSelected(next);
                localStorage.setItem(ACTIVE_ORGANISATION_KEY, next);
                window.dispatchEvent(new CustomEvent("tots:organisation-changed", { detail: { organisationId: next } }));
              }}
              className="w-full appearance-none rounded-lg border border-stone-200 bg-white py-2 pl-2 pr-7 text-xs font-medium">
              {!contexts.length && <option value="">{loading ? "Loading..." : "No organisations"}</option>}
              {contexts.map(o => <option key={o.id} value={o.id}>{o.name}{o.kind === "delegated" ? " (client)" : ""}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-1 text-[10px] text-stone-500">{active?.kind === "delegated" ? "Client access" : "Your workspace"} · Preview only</p>
          {error && <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p>}
        </>
      )}
    </div>
  );
}
