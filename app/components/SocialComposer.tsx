

"use client";

import { useState } from "react";

type SocialAccount = {
  id: string;
  platform: string;
  page_name?: string | null;
};

interface SocialComposerProps {
  accounts: SocialAccount[];
}

export default function SocialComposer({ accounts }: SocialComposerProps) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function publishPost() {
    if (!selectedAccount || !content) {
      setMessage("Select an account and add content first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/social/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socialAccountId: selectedAccount,
          content,
          imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to publish post");
      }

      setMessage("Post published successfully.");
      setContent("");
      setImageUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publishing failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">Create Social Post</h2>

      <select
        value={selectedAccount}
        onChange={(e) => setSelectedAccount(e.target.value)}
        className="w-full rounded-xl bg-stone-50 p-3 text-sm"
      >
        <option value="">Select account</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.platform}{account.page_name ? ` - ${account.page_name}` : ""}
          </option>
        ))}
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your post..."
        rows={5}
        className="w-full rounded-xl bg-stone-50 p-3 text-sm"
      />

      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Image URL (required for Instagram posts)"
        className="w-full rounded-xl bg-stone-50 p-3 text-sm"
      />

      <button
        type="button"
        onClick={publishPost}
        disabled={loading}
        className="rounded-xl bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Publishing..." : "Publish Post"}
      </button>

      {message && (
        <p className="text-sm text-neutral-600">{message}</p>
      )}
    </div>
  );
}