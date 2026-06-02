"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Upload, Loader2, ShieldCheck, FileCode } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploaderProps {
  onUploadSuccess?: (url: string) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement> | any) {
    const files = e.target.files || e.dataTransfer?.files;
    
    try {
      if (!files || files.length === 0) return;
      
      setUploading(true);
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      
      // System naming convention for archival integrity
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('vault').getPublicUrl(filePath);
      
      toast.success("Artifact Secured", { 
        description: `Neural Link: ${file.name.slice(0, 24)}`,
        className: "font-mono text-[10px] uppercase tracking-wider",
      });

      if (onUploadSuccess) onUploadSuccess(data.publicUrl);
      
    } catch (error: any) {
      toast.error("Vault Rejection", { 
        description: error.message,
        className: "font-mono text-[10px] uppercase tracking-wider",
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <label 
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(e); }}
        className={`
          relative flex flex-col items-center justify-center w-full h-48 
          border border-[var(--border)] rounded-[3rem] 
          bg-[var(--bg-soft)] transition-all duration-500 cursor-pointer overflow-hidden
          group shadow-sm
          ${uploading ? "cursor-wait opacity-60" : "hover:border-[var(--brand-primary)] hover:bg-[var(--card-bg)] hover:shadow-xl"}
          ${dragActive ? "border-[var(--brand-primary)] ring-4 ring-[var(--brand-primary)]/5" : ""}
        `}
      >
        <div className="flex flex-col items-center justify-center px-10 text-center">
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-[var(--brand-primary)] animate-spin" />
                  <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-primary)]" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)]">
                    Encrypting Data
                  </p>
                  <p className="text-[8px] font-mono text-[var(--text-muted)] animate-pulse">
                    ARCHIVING_TO_VAULT_NODE
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--border)] group-hover:text-[var(--brand-primary)] group-hover:border-[var(--brand-primary)]/20 transition-all">
                  <Upload className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-transform group-hover:-translate-y-1" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] group-hover:text-[var(--text-main)]">
                    Secure Artifact to Vault
                  </p>
                  <div className="flex items-center justify-center gap-4 opacity-30 group-hover:opacity-60 transition-opacity">
                    <FileCode size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest">PDF / IMG / TXT</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Decorative corner accents */}
        <div className="absolute top-6 left-6 w-2 h-2 border-t-2 border-l-2 border-[var(--border)] group-hover:border-[var(--brand-primary)]/30 transition-colors rounded-tl-sm" />
        <div className="absolute bottom-6 right-6 w-2 h-2 border-b-2 border-r-2 border-[var(--border)] group-hover:border-[var(--brand-primary)]/30 transition-colors rounded-br-sm" />
        
        <input 
          type="file" 
          className="hidden" 
          onChange={handleUpload} 
          disabled={uploading}
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
      </label>

      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="h-px w-8 bg-[var(--border)]" />
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-50">
          End-to-End Encryption Active
        </p>
        <div className="h-px w-8 bg-[var(--border)]" />
      </div>
    </div>
  );
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);