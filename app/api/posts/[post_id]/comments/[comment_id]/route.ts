import { NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { syncPostCounters } from "@/lib/post-counters";

type RouteContext = {
  params: Promise<{ post_id: string; comment_id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { post_id, comment_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: comment, error: commentError } = await supabaseAdmin
    .from("comments")
    .select("id, author")
    .eq("id", comment_id)
    .eq("post_id", post_id)
    .maybeSingle();

  if (commentError) return NextResponse.json({ error: commentError.message }, { status: 500 });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (comment.author !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabaseAdmin.from("comments").delete().eq("id", comment_id).eq("post_id", post_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncPostCounters(post_id);
  return NextResponse.json({ message: "Comment deleted" });
}
