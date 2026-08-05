"use client";

import { Loader2, UserPlus } from "lucide-react";

import type {
  TeamContactOption,
  TeamMemberView,
} from "../types";

type TeamSettingsProps = {
  teamLoading: boolean;
  teamMembers: TeamMemberView[];

  allContacts: TeamContactOption[];
  filteredContacts: TeamContactOption[];

  contactSearchQuery: string;
  setContactSearchQuery: (value: string) => void;

  addingContactId: string | null;

  onAddContact: (
    contact: TeamContactOption
  ) => Promise<void> | void;
};

export default function TeamSettings({
  teamLoading,
  teamMembers,
  filteredContacts,
  contactSearchQuery,
  setContactSearchQuery,
  addingContactId,
  onAddContact,
}: TeamSettingsProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-stone-200 bg-[#faf9f6] p-4 sm:p-5">
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">
          Team
        </label>

        <p className="mt-1 text-xs text-stone-500">
          All members in your organisation.
        </p>
      </div>

      {teamLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2
            size={14}
            className="animate-spin text-stone-400"
          />

          <span className="text-xs text-stone-400">
            Loading team...
          </span>
        </div>
      ) : teamMembers.length === 0 ? (
        <p className="text-xs text-stone-500">
          No team members found.
        </p>
      ) : (
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="break-all text-xs font-semibold text-stone-700">
                {member.full_name || "Unnamed user"}

                {member.email
                  ? ` (${member.email})`
                  : ""}
              </span>

              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t border-stone-100 pt-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
          Contacts
        </p>

        <input
          value={contactSearchQuery}
          onChange={(e) =>
            setContactSearchQuery(e.target.value)
          }
          placeholder="Search contacts by name, email or company"
          className="w-full rounded-xl border border-stone-200 bg-white p-3 text-xs font-semibold outline-none focus:border-stone-400"
        />

        {filteredContacts.length === 0 ? (
          <p className="py-1 text-xs text-stone-500">
            {contactSearchQuery
              ? "No matching contacts."
              : "No contacts found."}
          </p>
        ) : (
          <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate break-all text-xs font-semibold text-stone-700">
                  {contact.name || "Unnamed contact"}

                  {contact.email
                    ? ` (${contact.email})`
                    : ""}

                  {contact.company_name
                    ? ` — ${contact.company_name}`
                    : ""}
                </span>

                <button
                  type="button"
                  disabled={
                    teamLoading ||
                    addingContactId === contact.id
                  }
                  onClick={() =>
                    void onAddContact(contact)
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-stone-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {addingContactId === contact.id ? (
                    <Loader2
                      size={11}
                      className="animate-spin"
                    />
                  ) : (
                    <UserPlus size={11} />
                  )}

                  {addingContactId === contact.id
                    ? "Adding"
                    : "Add"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}