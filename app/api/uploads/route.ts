import { NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "socialconnect-media";

function getExtFromMimeType(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "bin";
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const target = String(formData.get("target") || "post");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG and PNG are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be <= 2MB" }, { status: 400 });
  }

  const ext = getExtFromMimeType(file.type);
  const filePath = `${target}/${userId}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return NextResponse.json({
    message: "Upload successful",
    url: data.publicUrl,
    path: filePath,
  });
}
