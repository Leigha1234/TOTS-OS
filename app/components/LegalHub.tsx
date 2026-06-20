

"use client";

import React from "react";

export default function LegalHub() {
  return (
    <section className="space-y-4 max-w-md">
      <div>
        <h2 className="text-xl font-bold">Legal & Support</h2>
        <p className="text-sm text-gray-500">
          Manage your legal information and support options.
        </p>
      </div>

      <div className="space-y-2">
        <a
          href="/privacy"
          className="block p-3 border rounded-lg hover:bg-gray-50"
        >
          Privacy Policy
        </a>

        <a
          href="/terms"
          className="block p-3 border rounded-lg hover:bg-gray-50"
        >
          Terms of Service
        </a>

        <a
          href="/support"
          className="block p-3 border rounded-lg hover:bg-gray-50"
        >
          Support Center
        </a>

        <a
          href="/contact"
          className="block p-3 border rounded-lg hover:bg-gray-50"
        >
          Contact Us
        </a>
      </div>
    </section>
  );
}