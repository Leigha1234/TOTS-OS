"use client";

import OriginalEmailCampaigns from "./OriginalEmailCampaigns";
import { useActiveAgencyContext } from "@/lib/use-active-agency-context";

export default function EmailCampaignsPage() {
  const context = useActiveAgencyContext();

  if (context.loading) {
    return <p className="p-6">Checking organisation access…</p>;
  }
  if (context.error || !context.active) {
    return <p role="alert" className="p-6">{context.error || "Organisation not available"}</p>;
  }
  if (context.delegated && context.active.permissions?.email?.view !== true) {
    return <p role="alert" className="p-6">Email Marketing access has not been granted.</p>;
  }

  return (
    <OriginalEmailCampaigns
      key={context.active.id}
      agencyOrganisationId={context.delegated ? context.active.id : undefined}
    />
  );
}
