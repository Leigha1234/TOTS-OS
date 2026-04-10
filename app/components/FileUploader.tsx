"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FileUploader({ onUploadSuccess }: { onUploadSuccess?: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('vault').getPublicUrl(filePath);
      
      toast.success("Artifact Secured", { description: file.name });
      if (onUploadSuccess) onUploadSuccess(data.publicUrl);
      setFile(null);
      
    } catch (error: any) {
      toast.error("Vault Error", { description: error.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative group">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-200 rounded-[2rem] bg-stone-50/50 hover:bg-white hover:border-[#a9b897] transition-all cursor-pointer overflow-hidden">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-stone-300 group-hover:text-[#a9b897] transition-colors mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                Secure Artifact to Vault
              </p>
            </>
          )}
        </div>
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}