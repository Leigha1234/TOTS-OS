"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AdminPermissionToggle({ memberId, pageSlug, initialAccess }: any) {
  const [enabled, setEnabled] = useState(initialAccess);

  const toggleAccess = async () => {
    const newStatus = !enabled;
    setEnabled(newStatus);

    try {
      const response = await fetch("/api/admin/update-permissions", {
        method: "POST",
        body: JSON.stringify({ memberId, pageSlug, canAccess: newStatus }),
      });

      if (!response.ok) throw new Error("Update failed");
      toast.success(newStatus ? `Access granted to ${pageSlug}` : `Access revoked`);
    } catch (err) {
      setEnabled(!newStatus); // Revert on error
      toast.error("Failed to update permissions");
    }
  };

  return (
    <button 
      onClick={toggleAccess}
      className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-[#a9b897]' : 'bg-stone-200'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );
}