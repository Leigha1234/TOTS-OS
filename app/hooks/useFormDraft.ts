"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TTL = 30 * 24 * 60 * 60 * 1000;

type DraftRecord<T> = { savedAt: number; value: T };

/** Browser-only drafts. Do not pass passwords, tokens or sensitive payment details. */
export function useFormDraft<T>(options: {
  key: string | null;
  value: T;
  onRestore: (value: T) => void;
  enabled?: boolean;
  debounceMs?: number;
}) {
  const { key, value, onRestore, enabled = true, debounceMs = 1000 } = options;
  const [ready, setReady] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const skipNextSave = useRef(false);
  const restoreRef = useRef(onRestore);
  restoreRef.current = onRestore;
  const storageKey = key ? `orbi:draft:v1:${key}` : null;

  useEffect(() => {
    setReady(false);
    setHasDraft(false);
    setSavedAt(null);
    if (!enabled || !storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftRecord<T>;
        if (typeof parsed.savedAt === "number" && Date.now() - parsed.savedAt < TTL) {
          skipNextSave.current = true;
          restoreRef.current(parsed.value);
          setHasDraft(true);
          setSavedAt(parsed.savedAt);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn("Unable to restore ORBI draft", error);
    }
    setReady(true);
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!ready || !enabled || !storageKey) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        const now = Date.now();
        localStorage.setItem(storageKey, JSON.stringify({ savedAt: now, value }));
        setHasDraft(true);
        setSavedAt(now);
      } catch (error) {
        console.warn("Unable to save ORBI draft", error);
      }
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [value, ready, enabled, storageKey, debounceMs]);

  const clearDraft = useCallback(() => {
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch { /* unavailable */ }
    }
    setHasDraft(false);
    setSavedAt(null);
  }, [storageKey]);

  return { ready, hasDraft, savedAt, clearDraft };
}
