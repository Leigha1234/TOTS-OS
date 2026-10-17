import { NextRequest, NextResponse } from "next/server";
import { requireAgencySocialAccess } from "../../../../../lib/agency-social-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 25 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/quicktime": "mov",
};
const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/** Authorised organisation-scoped media upload; returns a public URL. */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const organisationId = form.get("organisationId");
    if (typeof organisationId !== "string") return jsonError("Missing organisation", 400);
    const access = await requireAgencySocialAccess(request.headers.get("authorization"), organisationId, "create");
    if (!access.ok) return jsonError(access.error, access.status);
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("Missing file", 400);
    const extension = TYPES[file.type];
    if (!extension || file.size < 1 || file.size > MAX_BYTES) {
      return jsonError("Unsupported file or file exceeds 25 MB", 400);
    }
    const key = `organisations/${organisationId}/${crypto.randomUUID()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await access.db.storage.from("social-assets").upload(key, bytes, {
      contentType: file.type, upsert: false, cacheControl: "3600",
    });
    if (error) {
      console.error("[AGENCY SOCIAL UPLOAD]", error.message);
      return jsonError("Unable to upload media", 500);
    }
    const { data } = access.db.storage.from("social-assets").getPublicUrl(key);
    return NextResponse.json({ url: data.publicUrl, path: key }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Invalid upload request", 400);
  }
}
