import { NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";
import { commentSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabase";
import { syncPostCounters } from "@/lib/post-counters";

type RouteContext = {
  params: Promise<{ post_id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { post_id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("id, content, author, created_at")
    .eq("post_id", post_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: Request, context: RouteContext) {
  const { post_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid comment data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("comments")
    .insert({
      post_id,
      author: userId,
      content: parsed.data.content,
    })
    .select("id, content, author, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncPostCounters(post_id);
  return NextResponse.json({ message: "Comment added", comment: data }, { status: 201 });
}
