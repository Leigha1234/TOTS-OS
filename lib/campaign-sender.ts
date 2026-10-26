/** Display the client's sender name while retaining the configured verified address.
 * A client reply-to address is not permission to send from an unverified domain.
 */
export function campaignSender(configured: string, name: unknown) {
  const address = configured.match(/<([^<>]+)>/)?.[1]?.trim() || configured.trim();
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address)) throw new Error("RESEND_FROM_EMAIL must contain a verified sender address");
  const display = typeof name === "string" ? name.replace(/[\r\n]/g, " ").trim().slice(0, 150) : "";
  return { from: display ? `${JSON.stringify(display)} <${address}>` : configured, address };
}
