"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  onUploadSuccess?: (url: string) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const supabase = createClient();
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      
      // Improved naming to prevent collisions
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('vault').getPublicUrl(filePath);
      
      toast.success("Artifact Secured", { 
        description: `${file.name.slice(0, 20)}${file.name.length > 20 ? '...' : ''}` 
      });

      if (onUploadSuccess) onUploadSuccess(data.publicUrl);
      
    } catch (error: any) {
      toast.error("Vault Error", { description: error.message });
    } finally {
      setUploading(false);
      // Reset the input value so the same file can be uploaded twice if needed
      e.target.value = "";
    }
  }

  return (
    <div className="relative group w-full">
      <label 
        className={`
          flex flex-col items-center justify-center w-full h-32 
          border-2 border-dashed border-stone-200 rounded-[2rem] 
          bg-stone-50/50 transition-all cursor-pointer overflow-hidden
          ${uploading ? "cursor-not-allowed opacity-80" : "hover:bg-white hover:border-[#a9b897]"}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#a9b897] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">
                Encrypting...
              </p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-stone-300 group-hover:text-[#a9b897] transition-all group-hover:-translate-y-1" />
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover:text-stone-600">
                Secure Artifact to Vault
              </p>
            </>
          )}
        </div>
        
        <input 
          type="file" 
          className="hidden" 
          onChange={handleUpload} 
          disabled={uploading}
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
      </label>
    </div>
  );
}