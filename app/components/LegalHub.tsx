"use client";

import React from "react";
import Link from "next/link";

const legalDocs = [
  { name: "AI Policy", href: "/docs/aipolicy" },
  { name: "Beta Terms", href: "/docs/betaterms" },
  { name: "Cancellation Policy", href: "/docs/cancellationpolicy" },
  { name: "Cookies Policy", href: "/docs/cookies" },
  { name: "Data Terms", href: "/docs/dataterms" },
  { name: "Privacy Policy", href: "/docs/privacypolicy" },
  { name: "Property Notice", href: "/docs/propertynotice" },
  { name: "Security Policy", href: "/docs/securitypolicy" },
  { name: "Service Policy", href: "/docs/servicepolicy" },
  { name: "Terms & Conditions", href: "/docs/termsconditions" },
];

export default function LegalHub() {
  return (
    <section className="space-y-4 max-w-md">
      <div>
        <h2 className="text-xl font-bold">Legal & Support</h2>
        <p className="text-sm text-gray-500">
          Manage your legal information and documentation.
        </p>
      </div>

      <div className="space-y-2">
        {legalDocs.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              {doc.name}
            </span>
            <span className="text-gray-400">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}