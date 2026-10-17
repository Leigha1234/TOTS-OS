"use client";

import OriginalEmailCampaigns from "./OriginalEmailCampaigns";
import { useActiveAgencyContext } from "@/lib/use-active-agency-context";

export default function EmailCampaignsPage() {
  const context = useActiveAgencyContext();
  if (context.loading) return <p className="p-6">Checking organisation access…</p>;
  if (context.error || !context.active) return <p role="alert" className="p-6">{context.error || "Organisation not available"}</p>;
  if (context.delegated && context.active.permissions?.email?.view !== true) {
    return <p role="alert" className="p-6">Email Marketing access has not been granted.</p>;
  }
  return <>
    {context.delegated && <div role="status" className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950">Client workspace: campaign and audience viewing uses agency permissions. Editing, importing and sending through the original designer are not yet connected to the agency write APIs; do not use these controls for client campaigns.</div>}
    <OriginalEmailCampaigns key={context.active.id} agencyOrganisationId={context.delegated ? context.active.id : undefined}/>
  </>;
}
