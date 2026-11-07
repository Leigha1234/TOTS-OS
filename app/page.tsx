"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const modules = ["CRM & clients", "Projects", "Calendar", "Finances", "Email marketing", "Social studio", "Online store"];

export default function HomePage() {
  const [firstName, setFirstName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, businessName, email, consent, source: "homepage" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't add you right now. Please try again.");
      setStatus("done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="orbi-cinema">
      <style>{`
        .orbi-cinema{--night:#061c17;--forest:#0b3027;--cream:#f5f0e6;--muted:#b3c3b7;--gold:#c6b99a;background:var(--night);color:var(--cream);min-height:100vh;overflow-x:hidden;font-family:Arial,Helvetica,sans-serif}
        .orbi-cinema *{box-sizing:border-box}
        .orbi-cinema a{color:inherit;text-decoration:none}
        .orbi-cinema button,.orbi-cinema input{font:inherit}
        .orbi-cinema .frame{width:min(1400px,calc(100% - 112px));margin:0 auto}
        .orbi-cinema .nav{height:112px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:4;border-bottom:1px solid #ffffff16}
        .orbi-cinema .logo{font:600 48px/1 Georgia,'Times New Roman',serif;letter-spacing:-2.8px}
        .orbi-cinema .navright{display:flex;align-items:center;gap:30px}
        .orbi-cinema .navhint{font-size:10px;letter-spacing:2.6px;color:#c1c8b7;text-transform:uppercase}
        .orbi-cinema .login{border:1px solid #f3f0e65c;border-radius:2px;padding:14px 22px;font-size:12px;letter-spacing:.4px;transition:background .2s}
        .orbi-cinema .login:hover{background:#ffffff16}
        .orbi-cinema .hero{position:relative;isolation:isolate;min-height:760px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(350px,.78fr);align-items:center;gap:clamp(40px,6vw,120px);padding:96px 0 116px}
        .orbi-cinema .hero:before{content:'';position:absolute;inset:-112px calc((min(1400px,100vw - 112px) - 100vw)/2) -50px;z-index:-3;background:radial-gradient(ellipse 50% 70% at 64% 40%,#1d5a443f,transparent 70%),radial-gradient(ellipse 45% 60% at 5% 75%,#22564135,transparent 75%),linear-gradient(120deg,#061b16 10%,#0b3027 63%,#041611)}
        .orbi-cinema .hero:after{content:'';position:absolute;inset:0;z-index:-2;opacity:.22;background-image:linear-gradient(110deg,transparent 0%,#ffffff0b 48%,transparent 49%),repeating-linear-gradient(90deg,transparent 0,transparent 125px,#ffffff08 126px);pointer-events:none}
        .orbi-cinema .halo{position:absolute;width:min(72vw,860px);height:min(72vw,860px);border:1px solid #d7d5b12b;border-radius:50%;left:18%;top:1%;z-index:-1;pointer-events:none;box-shadow:0 0 140px #9fc8a50b,inset 0 0 100px #d6e6bc0a}
        .orbi-cinema .halo:before{content:'';position:absolute;inset:13%;border:1px solid #c6c8a91f;border-radius:50%}
        .orbi-cinema .halo:after{content:'';position:absolute;width:15px;height:15px;background:#d2c7a6;border-radius:50%;left:12%;top:18%;box-shadow:0 0 40px #e2d4ac77}
        .orbi-cinema .copy{position:relative;z-index:1;max-width:720px}
        .orbi-cinema .eyebrow{font-size:11px;letter-spacing:3.6px;text-transform:uppercase;color:#d0c6aa;font-weight:700}
        .orbi-cinema .launch{display:inline-flex;align-items:center;gap:12px;margin-bottom:34px;color:#e0d8c5;font-size:11px;letter-spacing:2.3px;text-transform:uppercase}
        .orbi-cinema .launch:before{content:'';height:7px;width:7px;border-radius:50%;background:#d6c59d;box-shadow:0 0 18px #d6c59d}
        .orbi-cinema .title{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(65px,7.2vw,112px);line-height:1.03;letter-spacing:-.055em;margin:26px 0 30px;max-width:740px}
        .orbi-cinema .title span{display:block;white-space:nowrap}
        .orbi-cinema .title em{display:block;font-style:italic;font-weight:400;color:#d5c8a8;white-space:nowrap}
        .orbi-cinema .intro{font-size:clamp(16px,1.45vw,19px);line-height:1.85;color:#c5d1c6;max-width:535px;margin:0 0 44px}
        .orbi-cinema .signature{display:flex;align-items:center;gap:16px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#d2c7ab}
        .orbi-cinema .signature:before{content:'';display:block;width:43px;height:1px;background:#d2c7ab}
        .orbi-cinema .formpanel{position:relative;z-index:2;background:#f4efe5;color:#0d3329;padding:clamp(30px,3.8vw,58px);border:1px solid #ffffff77;box-shadow:0 34px 110px #00000070;max-width:510px;width:100%;justify-self:end}
        .orbi-cinema .formpanel .eyebrow{color:#7b7869;font-size:10px}
        .orbi-cinema .formpanel h2{font:400 clamp(38px,3.6vw,55px)/1.08 Georgia,'Times New Roman',serif;letter-spacing:-2px;margin:18px 0 16px}
        .orbi-cinema .formpanel p{color:#637268;font-size:14px;line-height:1.75;margin:0 0 27px}
        .orbi-cinema .field{display:block;font-size:11px;font-weight:700;letter-spacing:.5px;margin:18px 0 9px}
        .orbi-cinema .input{height:51px;width:100%;border:1px solid #d3d5ca;border-radius:0;background:#fffefa;color:#14392f;padding:0 15px;font-size:14px;outline:none}
        .orbi-cinema .input:focus{border-color:#245f49;box-shadow:0 0 0 2px #245f4920}
        .orbi-cinema .checkbox{display:flex;align-items:flex-start;gap:10px;margin-top:22px;font-size:11px;line-height:1.6;color:#596c60;cursor:pointer}
        .orbi-cinema .checkbox input{margin:3px 0 0;accent-color:#0e3a2c;flex:none}
        .orbi-cinema .submit{width:100%;margin-top:23px;background:#103c2f;color:#f7f0e3;border:0;min-height:55px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;transition:background .2s}
        .orbi-cinema .submit:hover{background:#1c5944}
        .orbi-cinema .submit:disabled{opacity:.6;cursor:wait}
        .orbi-cinema .error{color:#a23c2f!important;margin:12px 0 0!important}
        .orbi-cinema .successmark{width:54px;height:54px;border:1px solid #3c6b51;border-radius:50%;display:grid;place-items:center;font-size:28px;margin-bottom:28px}
        .orbi-cinema .below{border-top:1px solid #ffffff25;border-bottom:1px solid #ffffff25;padding:50px 0 58px;display:grid;grid-template-columns:1fr 1.2fr;gap:60px}
        .orbi-cinema .below h3{font:400 37px/1.2 Georgia,'Times New Roman',serif;margin:16px 0 0;letter-spacing:-1px}
        .orbi-cinema .modules{display:flex;flex-wrap:wrap;align-content:center;gap:10px;justify-content:flex-end}
        .orbi-cinema .module{border:1px solid #d4d6b944;padding:13px 17px;font-size:12px;letter-spacing:.4px;color:#e2e8d9}
        .orbi-cinema .footer{display:flex;justify-content:space-between;gap:20px;padding:30px 0 38px;font-size:11px;color:#a4b6a8;letter-spacing:.3px}
        @media(max-width:1100px){.orbi-cinema .frame{width:calc(100% - 64px)}.orbi-cinema .hero{grid-template-columns:minmax(0,1fr) minmax(330px,.9fr);gap:35px}.orbi-cinema .title{font-size:clamp(59px,6.7vw,85px)}.orbi-cinema .hero:before{inset:-112px -32px -50px}}
        @media(max-width:800px){.orbi-cinema .hero{grid-template-columns:1fr;min-height:auto;padding:85px 0 75px;gap:62px}.orbi-cinema .title{font-size:clamp(64px,10vw,100px)}.orbi-cinema .formpanel{justify-self:start;max-width:600px}.orbi-cinema .halo{width:660px;height:660px;left:8%;top:1%}.orbi-cinema .below{grid-template-columns:1fr;gap:30px}.orbi-cinema .modules{justify-content:flex-start}}
        @media(max-width:540px){.orbi-cinema .frame{width:calc(100% - 38px)}.orbi-cinema .nav{height:83px}.orbi-cinema .logo{font-size:38px}.orbi-cinema .navhint{display:none}.orbi-cinema .login{font-size:11px;padding:11px 13px}.orbi-cinema .hero{padding:62px 0 65px;gap:44px}.orbi-cinema .hero:before{inset:-83px -19px -30px}.orbi-cinema .title{font-size:clamp(52px,12.6vw,74px);letter-spacing:-.055em;margin:24px 0}.orbi-cinema .launch{font-size:10px;letter-spacing:1.3px}.orbi-cinema .eyebrow{font-size:9px;letter-spacing:2.6px}.orbi-cinema .intro{font-size:16px;margin-bottom:30px}.orbi-cinema .formpanel{padding:32px 25px}.orbi-cinema .below h3{font-size:32px}.orbi-cinema .footer{flex-direction:column}}
        @media(max-width:360px){.orbi-cinema .title{font-size:46px}}
        @media(prefers-reduced-motion:reduce){.orbi-cinema .submit,.orbi-cinema .login{transition:none}}
      `}</style>
      <div className="frame">
        <header className="nav">
          <Link href="/" className="logo" aria-label="ORBI homepage">ORBI.</Link>
          <div className="navright"><span className="navhint">Everything in your orbit.</span><Link className="login" href="/login">Client login ↗</Link></div>
        </header>
        <section className="hero" aria-label="ORBI waiting list">
          <div className="halo" aria-hidden="true" />
          <div className="copy">
            <div className="launch">Launching 30 November 2026</div>
            <div className="eyebrow">The next chapter of doing business</div>
            <h1 className="title"><span>Less chaos.</span><em>More orbit.</em></h1>
            <p className="intro">Your clients, projects, calendar, finances and marketing — beautifully connected in one place. Less time managing the moving parts. More time building what matters.</p>
            <div className="signature">Your business. One orbit.</div>
          </div>
          <div className="formpanel">
            {status === "done" ? (
              <div role="status"><div className="successmark">✓</div><div className="eyebrow">Your place is reserved</div><h2>You're on<br />the list.</h2><p>Thank you for joining ORBI. Look out for our first preview and your launch invitation.</p></div>
            ) : (
              <>
                <div className="eyebrow">An invitation to something better</div>
                <h2>Be part of<br />what&apos;s next.</h2>
                <p>Join the waiting list for exclusive first looks, useful business insights and your invitation when ORBI. launches.</p>
                <form onSubmit={submit}>
                  <label className="field" htmlFor="orbi-first">First name</label>
                  <input className="input" id="orbi-first" autoComplete="given-name" required maxLength={80} placeholder="Your first name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  <label className="field" htmlFor="orbi-business">Business name (optional)</label>
                  <input className="input" id="orbi-business" autoComplete="organization" maxLength={120} placeholder="Your business" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                  <label className="field" htmlFor="orbi-email">Email address</label>
                  <input className="input" id="orbi-email" autoComplete="email" type="email" required placeholder="you@business.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <label className="checkbox"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I agree to receive ORBI. waiting-list and launch emails. I can unsubscribe at any time.</span></label>
                  {status === "error" && <p className="error" role="alert">{message}</p>}
                  <button className="submit" disabled={status === "loading"} type="submit">{status === "loading" ? "Joining…" : "Join the waiting list  ↗"}</button>
                </form>
              </>
            )}
          </div>
        </section>
        <section className="below" aria-label="What ORBI brings together"><div><div className="eyebrow">One connected world</div><h3>Everything you need.<br />Nothing you don&apos;t.</h3></div><div className="modules">{modules.map(module => <span className="module" key={module}>{module} ↗</span>)}</div></section>
        <footer className="footer"><span>© 2026 ORBI. All rights reserved.</span><span>Everything in your orbit.</span></footer>
      </div>
    </main>
  );
}
