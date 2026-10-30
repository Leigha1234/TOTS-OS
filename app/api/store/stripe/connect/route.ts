import { NextRequest, NextResponse } from "next/server";
import { authorisedUser, baseUrl, signState } from "../../../../../lib/store-stripe-connect";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer /i, "") || "";
    const { organisationId } = await req.json();
    if (!organisationId || typeof organisationId !== "string") return NextResponse.json({ error: "Missing organisation." }, { status: 400 });
    const user = await authorisedUser(token, organisationId);
    if (!process.env.STRIPE_CONNECT_CLIENT_ID || !baseUrl() || !process.env.STRIPE_CONNECT_STATE_SECRET)
      throw Error("Stripe Connect environment variables are missing.");
    const state = signState({ organisationId, userId: user.id, expires: Date.now() + 10 * 60 * 1000 });
    const url = new URL("https://connect.stripe.com/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", process.env.STRIPE_CONNECT_CLIENT_ID);
    url.searchParams.set("scope", "read_write");
    url.searchParams.set("redirect_uri", `${baseUrl()}/api/store/stripe/callback`);
    url.searchParams.set("state", state);
    const response = NextResponse.json({ url: url.toString() });
    response.cookies.set("orbi_stripe_connect", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/store/stripe/callback", maxAge: 600 });
    return response;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to connect Stripe." }, { status: 403 });
  }
}
