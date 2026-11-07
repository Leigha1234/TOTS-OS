"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const features = ["Customers & CRM", "Projects & tasks", "Calendar & bookings", "Finances & invoicing", "Marketing & email", "Online store"];

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, businessName, consent, source: "homepage" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setStatus("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="orbi-landing">
      <style>{`
        .orbi-landing{--green:#103b30;--cream:#f6f2e9;--sage:#c8d6bd;--ink:#173b31;min-height:100vh;background:var(--cream);color:var(--ink);font-family:Arial,Helvetica,sans-serif;overflow:hidden}
        .orbi-landing *{box-sizing:border-box}
        .orbi-landing a{color:inherit;text-decoration:none}
        .orbi-shell{width:min(1240px,calc(100% - 72px));margin:0 auto}
        .orbi-top{height:108px;display:flex;justify-content:space-between;align-items:center;gap:24px}
        .orbi-wordmark{font:700 41px/.9 Georgia,'Times New Roman',serif;letter-spacing:-2.5px}
        .orbi-login{font-size:13px;border:1px solid #c6d0c3;padding:13px 20px;border-radius:999px;transition:background .2s}
        .orbi-login:hover{background:#e8eee3}
        .orbi-hero{display:grid;grid-template-columns:minmax(0,1.04fr) minmax(390px,.86fr);gap:clamp(40px,6vw,110px);align-items:center;min-height:650px;padding:42px 0 75px}
        .orbi-eyebrow{font-size:11px;font-weight:800;letter-spacing:3.1px;text-transform:uppercase}
        .orbi-launch{display:inline-flex;align-items:center;gap:10px;border:1px solid #d1d9cc;border-radius:99px;padding:11px 16px;margin-bottom:36px;font-size:12px;letter-spacing:.3px}
        .orbi-dot{height:7px;width:7px;border-radius:50%;background:#65846e;box-shadow:0 0 0 4px #dce6d7}
        .orbi-headline{font:400 clamp(70px,7.5vw,118px)/.95 Georgia,'Times New Roman',serif;letter-spacing:-5px;margin:22px 0 28px}
        .orbi-headline span{display:block}
        .orbi-headline em{display:block;font-weight:400;color:#78927a}
        .orbi-lead{font-size:clamp(17px,1.65vw,21px);line-height:1.6;max-width:550px;color:#53665c;margin:0 0 30px}
        .orbi-subline{display:flex;gap:13px;align-items:center;font-size:13px;font-weight:600;color:#315747}
        .orbi-subline i{width:31px;height:1px;background:#819c83;display:block}
        .orbi-form-card{position:relative;background:var(--green);color:#f8f6ee;padding:clamp(30px,4vw,54px);border-radius:24px;box-shadow:0 30px 90px #123b3024}
        .orbi-form-card:before{content:'';position:absolute;width:185px;height:185px;right:-90px;top:-93px;border:1px solid #6c917d;border-radius:50%;opacity:.45;pointer-events:none}
        .orbi-form-card:after{content:'';position:absolute;width:135px;height:135px;right:-65px;top:-65px;border:1px solid #6c917d;border-radius:50%;opacity:.4;pointer-events:none}
        .orbi-form-card .orbi-eyebrow{color:#bfd2bf}
        .orbi-form-card h2{font:400 clamp(35px,3vw,47px)/1.07 Georgia,'Times New Roman',serif;letter-spacing:-1px;margin:18px 0 14px}
        .orbi-card-copy{font-size:14px;line-height:1.65;color:#c7d7ce;margin:0 0 28px}
        .orbi-field{display:block;margin:17px 0 8px;font-size:12px;color:#f5f7f0}
        .orbi-input{display:block;width:100%;height:51px;padding:0 16px;background:#fdfdfa;border:1px solid #d7e1d7;border-radius:8px;color:#173b31;font:14px Arial,Helvetica,sans-serif;outline:none}
        .orbi-input:focus{border-color:#b1d2ad;box-shadow:0 0 0 3px #b1d2ad35}
        .orbi-check{display:flex;align-items:flex-start;gap:11px;margin:20px 0 0;font-size:11px;line-height:1.65;color:#d8e3db;cursor:pointer}
        .orbi-check input{margin:3px 0 0;accent-color:#b9d5ad;flex-shrink:0}
        .orbi-button{width:100%;min-height:53px;background:#d8e8c9;color:#103b30;border:0;border-radius:8px;margin-top:22px;font-size:14px;font-weight:800;cursor:pointer;transition:background .2s,transform .2s}
        .orbi-button:hover{background:#eef7df;transform:translateY(-1px)}
        .orbi-button:disabled{opacity:.65;cursor:wait}
        .orbi-error{font-size:12px;color:#ffe1c7}
        .orbi-confirm{padding:30px 0}
        .orbi-confirm .orbi-icon{font-size:30px;background:#d8e8c9;color:#103b30;border-radius:50%;display:grid;place-items:center;width:60px;height:60px;margin-bottom:22px}
        .orbi-divider{height:1px;background:#d7dfd1}
        .orbi-lower{display:flex;align-items:flex-start;justify-content:space-between;gap:48px;padding:36px 0 42px}
        .orbi-lower h3{font:400 26px Georgia,serif;margin:0 0 9px}
        .orbi-lower p{font-size:13px;color:#64776a;line-height:1.6;max-width:360px;margin:0}
        .orbi-features{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;max-width:650px}
        .orbi-feature{border:1px solid #cdd8c9;border-radius:99px;padding:12px 16px;font-size:12px;background:#faf8f1}
        .orbi-footer{display:flex;justify-content:space-between;gap:16px;padding:24px 0 32px;font-size:11px;color:#77877b;border-top:1px solid #d7dfd1}
        @media(max-width:950px){.orbi-hero{grid-template-columns:1fr;gap:40px;min-height:unset;padding:42px 0 60px}.orbi-headline{font-size:clamp(70px,11vw,110px)}.orbi-form-card{max-width:640px;width:100%}.orbi-lower{flex-direction:column;gap:24px}.orbi-features{justify-content:flex-start}}
        @media(max-width:560px){.orbi-shell{width:calc(100% - 38px)}.orbi-top{height:82px}.orbi-wordmark{font-size:34px}.orbi-login{font-size:11px;padding:11px 13px}.orbi-hero{padding-top:28px;gap:36px}.orbi-headline{font-size:clamp(58px,15vw,82px);letter-spacing:-3.5px;margin:19px 0 23px}.orbi-launch{margin-bottom:24px}.orbi-form-card{padding:28px 23px;border-radius:18px}.orbi-lead{font-size:17px}.orbi-footer{flex-direction:column}.orbi-lower{padding:30px 0}}
        @media(prefers-reduced-motion:reduce){.orbi-button,.orbi-login{transition:none}}
      `}</style>
      <div className="orbi-shell">
        <header className="orbi-top">
          <Link href="/" className="orbi-wordmark" aria-label="ORBI home">ORBI.</Link>
          <Link href="/login" className="orbi-login">Existing customer? Log in ↗</Link>
        </header>
        <section className="orbi-hero" aria-label="ORBI launch waiting list">
          <div>
            <div className="orbi-launch"><span className="orbi-dot" /> LAUNCHING 30 NOVEMBER 2026</div>
            <div className="orbi-eyebrow">ONE BUSINESS. ONE CONNECTED WORLD.</div>
            <h1 className="orbi-headline"><span>Less chaos.</span><em>More orbit.</em></h1>
            <p className="orbi-lead">Your customers, projects, calendar, finances and marketing — finally working together. One beautiful home for everything that keeps your business moving.</p>
            <div className="orbi-subline"><i /> Everything in your orbit.</div>
          </div>
          <div className="orbi-form-card">
            {status === "done" ? (
              <div className="orbi-confirm" role="status"><div className="orbi-icon">✓</div><div className="orbi-eyebrow">YOU'RE IN</div><h2>You're on the list.</h2><p className="orbi-card-copy">Thanks for joining ORBI. Watch your inbox for previews, helpful tips and your launch invitation.</p></div>
            ) : (
              <>
                <div className="orbi-eyebrow">BE FIRST IN LINE</div>
                <h2>Something better<br />is on its way.</h2>
                <p className="orbi-card-copy">Join the waiting list for first looks, practical business tips and your invitation when ORBI. launches.</p>
                <form onSubmit={submit}>
                  <label className="orbi-field" htmlFor="orbi-first">First name</label>
                  <input className="orbi-input" id="orbi-first" autoComplete="given-name" required maxLength={80} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Your first name" />
                  <label className="orbi-field" htmlFor="orbi-business">Business name <span style={{opacity:.7}}>(optional)</span></label>
                  <input className="orbi-input" id="orbi-business" autoComplete="organization" maxLength={120} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your business" />
                  <label className="orbi-field" htmlFor="orbi-email">Email address</label>
                  <input className="orbi-input" id="orbi-email" autoComplete="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" />
                  <label className="orbi-check"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I'd like to receive ORBI. waiting-list updates and launch emails. I can unsubscribe at any time.</span></label>
                  {status === "error" && <p className="orbi-error" role="alert">{message}</p>}
                  <button className="orbi-button" type="submit" disabled={status === "loading"}>{status === "loading" ? "Joining…" : "Join the waiting list  ↗"}</button>
                </form>
              </>
            )}
          </div>
        </section>
        <div className="orbi-divider" />
        <section className="orbi-lower" aria-label="ORBI features"><div><h3>All the moving parts.<br />One place.</h3><p>Less switching between apps. More time to focus on the work that matters.</p></div><div className="orbi-features">{features.map(feature => <span className="orbi-feature" key={feature}>{feature} ↗</span>)}</div></section>
        <footer className="orbi-footer"><span>© 2026 ORBI. Everything in your orbit.</span><span>Built for the people building businesses.</span></footer>
      </div>
    </main>
  );
}
