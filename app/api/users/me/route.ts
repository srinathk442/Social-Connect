import { NextResponse } from "next/server";
import { getUserIdFromAccessToken } from "@/lib/session";
import { profileSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessTokenCookie = cookieHeader
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("access_token="));

  const accessToken = accessTokenCookie?.split("=")[1];
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updatePayload = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updatePayload)
    .eq("id", userId)
    .select(
      "id, email, username, first_name, last_name, bio, avatar_url, website, location, created_at, last_login",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Profile updated", user: data });
}

export async function PUT(request: Request) {
  return PATCH(request);
}
