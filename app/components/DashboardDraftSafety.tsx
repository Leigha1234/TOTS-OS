"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Dashboard-wide fallback for native form controls. React-controlled forms
 * should additionally use useFormDraft to restore their actual React state.
 * Never capture credentials, hidden fields, files or payment details.
 */
const PREFIX = "orbi:form-safety:v1:";
const EXPIRY = 30 * 24 * 60 * 60 * 1000;
const BLOCKED = /password|token|secret|api.?key|card|cvv|cvc|iban|sort.?code|account.?number|bank|security|otp|2fa|auth|payment.?method/i;
type Field = { selector: string; value: string; checked?: boolean };
type Snapshot = { at: number; fields: Field[] };

function controls(): Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select"))
    .filter((el) => {
      if (el.closest('[data-no-draft], [data-draft-ignore]')) return false;
      if (el instanceof HTMLInputElement && ["password", "hidden", "file", "submit", "button", "reset", "image"].includes(el.type)) return false;
      const descriptor = [el.name, el.id, el.getAttribute("autocomplete"), el.getAttribute("aria-label")].join(" ");
      if (BLOCKED.test(descriptor)) return false;
      if (el instanceof HTMLInputElement && /^(cc-|one-time-code)/.test(el.autocomplete)) return false;
      return Boolean(el.closest("form, [role='dialog'], [data-draft-form]"));
    });
}
function selector(el: Element): string | null {
  const form = el.closest("form, [role='dialog'], [data-draft-form]");
  if (!form) return null;
  const groups = Array.from(document.querySelectorAll("form, [role='dialog'], [data-draft-form]"));
  const index = groups.indexOf(form);
  const within = Array.from(form.querySelectorAll("input,textarea,select"));
  const position = within.indexOf(el);
  return index >= 0 && position >= 0 ? `${index}:${position}` : null;
}
function snapshot(): Snapshot {
  return { at: Date.now(), fields: controls().flatMap(el => {
    const key = selector(el);
    if (!key) return [];
    return [{ selector: key, value: el.value, ...((el instanceof HTMLInputElement && ["checkbox", "radio"].includes(el.type)) ? { checked: el.checked } : {}) }];
  }) };
}
function restore(data: Snapshot) {
  const groups = Array.from(document.querySelectorAll("form, [role='dialog'], [data-draft-form]"));
  for (const field of data.fields) {
    const [a, b] = field.selector.split(":").map(Number);
    const el = groups[a]?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select")[b];
    if (!el || !controls().includes(el)) continue;
    if (el instanceof HTMLInputElement && field.checked !== undefined) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
      setter?.call(el, field.checked);
    } else {
      const prototype = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(el, field.value);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

export default function DashboardDraftSafety() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [saved, setSaved] = useState(false);
  const key = identity && pathname ? `${PREFIX}${identity}:${pathname}` : null;
  const keyRef = useRef(key);
  keyRef.current = key;
  const dirtyRef = useRef(false);
  const baseline = useRef("");
  const suppressRef = useRef(false);

  useEffect(() => {
    let active = true;
    fetch("/api/account/access", { credentials: "same-origin", cache: "no-store" })
      .then(r => r.json()).then(data => {
        if (active && typeof data.userId === "string" && typeof data.organisationId === "string") {
          setIdentity(`${data.userId}:${data.organisationId}`);
        }
      }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    dirtyRef.current = false;
    setSaved(false);
    setAvailable(false);
    baseline.current = JSON.stringify(snapshot().fields);
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw) as Snapshot;
        if (Date.now() - data.at < EXPIRY && data.fields.length) setAvailable(true);
        else localStorage.removeItem(key);
      }
    } catch { /* storage disabled */ }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      if (!dirtyRef.current || suppressRef.current) return;
      try {
        const data = snapshot();
        if (data.fields.length) {
          localStorage.setItem(key, JSON.stringify(data));
          setSaved(true);
        }
      } catch { /* storage full or blocked */ }
    };
    const changed = (event: Event) => {
      if (!(event.target instanceof HTMLElement) || !event.target.closest("form, [role='dialog'], [data-draft-form]")) return;
      if (suppressRef.current) return;
      dirtyRef.current = true;
      setSaved(false);
      clearTimeout(timer);
      timer = setTimeout(save, 900);
    };
    const leaving = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      save();
      event.preventDefault();
      event.returnValue = "";
    };
    const clicked = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.origin !== location.origin || anchor.pathname === location.pathname && anchor.search === location.search) return;
      save();
      if (!window.confirm("You have unfinished changes. A local draft has been saved. Leave this page?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    const submitted = () => { save(); }; // Do not delete draft until the app confirms success.
    document.addEventListener("input", changed, true);
    document.addEventListener("change", changed, true);
    document.addEventListener("click", clicked, true);
    document.addEventListener("submit", submitted, true);
    window.addEventListener("beforeunload", leaving);
    return () => {
      clearTimeout(timer);
      save();
      document.removeEventListener("input", changed, true);
      document.removeEventListener("change", changed, true);
      document.removeEventListener("click", clicked, true);
      document.removeEventListener("submit", submitted, true);
      window.removeEventListener("beforeunload", leaving);
    };
  }, [key]);

  if (!available && !saved) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-stone-700 shadow-lg" role="status">
      {available ? <>
        <span>Unfinished draft found</span>
        <button className="font-semibold text-emerald-800 underline" onClick={() => {
          if (!key) return;
          try {
            const raw = localStorage.getItem(key);
            if (raw) { suppressRef.current = true; restore(JSON.parse(raw)); setTimeout(() => { suppressRef.current = false; }, 0); }
            setAvailable(false); dirtyRef.current = true;
          } catch { /* ignore corrupt draft */ }
        }}>Restore</button>
        <button className="font-semibold text-red-700 underline" onClick={() => {
          if (!window.confirm("Permanently discard this saved draft?")) return;
          if (key) localStorage.removeItem(key);
          setAvailable(false); setSaved(false); dirtyRef.current = false;
        }}>Discard</button>
      </> : <span>{saved ? "Draft saved on this device" : ""}</span>}
    </div>
  );
}
