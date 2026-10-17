"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const ACTIVE_ORGANISATION_KEY = "tots_agency_preview_organisation_id";
export type AgencyContext = {
  id: string;
  name: string;
  kind: "direct" | "delegated";
  owner: boolean;
  permissions: Record<string, Record<string, boolean>> | null;
};

/** Only a server-verified context is ever used to grant client navigation. */
export function useActiveAgencyContext() {
  const [active, setActive] = useState<AgencyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    let revision = 0;
    const load = async () => {
      const current = ++revision;
      setLoading(true);
      setError("");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Please sign in");
        const response = await fetch("/api/agency/contexts", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to verify organisation access");
        const result = await response.json();
        const contexts = (Array.isArray(result.contexts) ? result.contexts : []) as AgencyContext[];
        const saved = localStorage.getItem(ACTIVE_ORGANISATION_KEY);
        const chosen = contexts.find(c => c.id === saved) ?? contexts.find(c => c.kind === "direct") ?? contexts[0] ?? null;
        if (disposed || current !== revision) return;
        setActive(chosen);
        if (chosen) localStorage.setItem(ACTIVE_ORGANISATION_KEY, chosen.id);
      } catch (e) {
        if (disposed || current !== revision) return;
        setActive(null);
        setError(e instanceof Error ? e.message : "Unable to verify organisation access");
      } finally {
        if (!disposed && current === revision) setLoading(false);
      }
    };
    const onChange = () => { void load(); };
    window.addEventListener("tots:organisation-changed", onChange);
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load();
    });
    void load();
    return () => {
      disposed = true;
      revision++;
      window.removeEventListener("tots:organisation-changed", onChange);
      listener.subscription.unsubscribe();
    };
  }, []);
  return { active, loading, error, delegated: active?.kind === "delegated" };
}
