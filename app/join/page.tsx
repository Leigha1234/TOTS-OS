"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { 
  Loader2, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function JoinInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // -- Form State --
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (token) {
      verifyInvite();
    } else {
      setLoading(false);
    }
  }, [token]);

async function verifyInvite() {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*, settings:organisation_id(business_name, brand_color)')
      .eq('token', token)
      .single();

    if (error || !data) {
      router.push("/login");
      return;
    }

    // World-Class Handling: If pending, redirect to Stripe
    if (data.status === 'pending' && data.stripe_session_id) {
      toast.info("Payment verification pending. Redirecting...");
      
      // We can use a simple Stripe client-side redirect
      // Or just provide a link to finish payment
      window.location.href = `https://checkout.stripe.com/pay/${data.stripe_session_id}`;
      return;
    }

    setInviteData(data);
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    setLoading(false);
  }
}
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setProcessing(true);

    try {
      // 1. Create the Auth User with Metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            organisation_id: inviteData.organisation_id,
            role: inviteData.role,
          }
        }
      });

      if (authError) throw authError;

      // 2. Clean up the used invitation
      await supabase.from('invites').delete().eq('id', inviteData.id);

      toast.success("Account initialized successfully.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to join organization.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#A3B18A]" size={32} />
        <p className="font-black uppercase tracking-[0.4em] text-stone-300 text-[10px]">Verifying Invitation</p>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-serif italic">Access Denied</h1>
          <p className="text-stone-400 text-sm">This invitation link is no longer active.</p>
          <button onClick={() => router.push('/login')} className="text-[#A3B18A] font-black uppercase tracking-widest text-[10px]">Return to Login</button>
        </div>
      </div>
    );
  }

  const brandColor = inviteData.settings?.brand_color || "#A3B18A";

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[3rem] md:rounded-[4.5rem] border border-stone-200 shadow-xl overflow-hidden"
      >
        <div className="p-8 md:p-16 space-y-10">
          
          {/* Brand Header */}
          <div className="text-center space-y-4">
            <div 
              className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-inner"
              style={{ backgroundColor: brandColor }}
            >
              <ShieldCheck className="text-white" size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">You've been invited to join</p>
              <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight text-stone-900">
                {inviteData.settings?.business_name || "New Organization"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 ml-4">Your Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe" 
                    className="w-full p-5 bg-[#faf9f6] border border-stone-100 rounded-2xl text-xs font-bold outline-none focus:border-stone-900 transition-all"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 ml-4">Assigned Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input 
                    type="email" 
                    disabled 
                    value={inviteData.email}
                    className="w-full pl-14 pr-5 py-5 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 ml-4">Set Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-5 bg-[#faf9f6] border border-stone-100 rounded-2xl text-xs font-bold outline-none focus:border-stone-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 ml-4">Confirm</label>
                  <input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-5 bg-[#faf9f6] border border-stone-100 rounded-2xl text-xs font-bold outline-none focus:border-stone-900 transition-all"
                  />
                </div>
              </div>

            </div>

            <button 
              type="submit" 
              disabled={processing}
              className="w-full py-6 bg-stone-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Accept Membership
            </button>
          </form>

          <p className="text-center text-[9px] font-black uppercase tracking-widest text-stone-300">
            By joining, you agree to the organization's security protocols.
          </p>
        </div>
        
        {/* Footer Accent */}
        <div 
          className="h-3 w-full" 
          style={{ backgroundColor: brandColor }}
        />
      </motion.div>
    </div>
  );
}

// Main Page Component with Suspense (Next.js requirement for useSearchParams)
export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-200" size={32} />
      </div>
    }>
      <JoinInterface />
    </Suspense>
  );
}