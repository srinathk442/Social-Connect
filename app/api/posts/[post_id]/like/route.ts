import { NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { syncPostCounters } from "@/lib/post-counters";

type RouteContext = {
  params: Promise<{ post_id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { post_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .select("id, is_active")
    .eq("id", post_id)
    .maybeSingle();

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });
  if (!post || !post.is_active) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("likes").insert({ post_id, user_id: userId });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncPostCounters(post_id);
  return NextResponse.json({ message: "Post liked" }, { status: 201 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { post_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin.from("likes").delete().eq("post_id", post_id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncPostCounters(post_id);
  return NextResponse.json({ message: "Post unliked" });
}
