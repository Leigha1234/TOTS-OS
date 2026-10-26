import { NextRequest, NextResponse } from "next/server";
import { requireAgencyEmailAccess } from "@/lib/agency-email-access";
export const runtime = "nodejs";
const types: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") || 0) > 6_000_000) return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 413 });
  const form = await req.formData();
  const org = String(form.get("organisationId") || "");
  let access = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "edit");
  if (!access.ok && access.status === 403) access = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "create");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const file = form.get("file");
  if (!(file instanceof File) || !types[file.type] || !file.size || file.size > 5_000_000) return NextResponse.json({ error: "Choose a PNG, JPEG, WebP or GIF under 5 MB" }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid = file.type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === "image/gif" ? ["GIF87a", "GIF89a"].includes(bytes.subarray(0,6).toString())
    : bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
  if (!valid) return NextResponse.json({ error: "Image content does not match its file type" }, { status: 400 });
  const path = `${org}/${crypto.randomUUID()}.${types[file.type]}`;
  const result = await access.db.storage.from("campaign-images").upload(path, bytes, { contentType: file.type, upsert: false });
  if (result.error) return NextResponse.json({ error: "Could not upload campaign image" }, { status: 500 });
  return NextResponse.json({ url: access.db.storage.from("campaign-images").getPublicUrl(path).data.publicUrl });
}
