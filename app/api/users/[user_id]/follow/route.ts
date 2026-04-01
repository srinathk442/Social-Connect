import { NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ user_id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { user_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const currentUserId = getUserIdFromAccessToken(accessToken);

  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (currentUserId === user_id) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("follows")
    .insert({ follower: currentUserId, following: user_id });

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Followed user" }, { status: 201 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { user_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const currentUserId = getUserIdFromAccessToken(accessToken);

  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("follows")
    .delete()
    .eq("follower", currentUserId)
    .eq("following", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Unfollowed user" });
}
