import { NextResponse } from "next/server";
import { postSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabase";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";

type RouteContext = {
  params: Promise<{ post_id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { post_id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id, content, image_url, like_count, comment_count, created_at, updated_at, author, is_active")
    .eq("id", post_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || !data.is_active) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { post_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingPost, error: existingPostError } = await supabaseAdmin
    .from("posts")
    .select("id, author, is_active")
    .eq("id", post_id)
    .maybeSingle();

  if (existingPostError) {
    return NextResponse.json({ error: existingPostError.message }, { status: 500 });
  }

  if (!existingPost || !existingPost.is_active) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (existingPost.author !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = postSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid post data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { content, image_url } = parsed.data;
  const payload = {
    content,
    image_url: image_url || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(payload)
    .eq("id", post_id)
    .select("id, content, image_url, like_count, comment_count, created_at, updated_at, author")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Post updated", post: data });
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { post_id } = await context.params;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingPost, error: existingPostError } = await supabaseAdmin
    .from("posts")
    .select("id, author, is_active")
    .eq("id", post_id)
    .maybeSingle();

  if (existingPostError) {
    return NextResponse.json({ error: existingPostError.message }, { status: 500 });
  }

  if (!existingPost || !existingPost.is_active) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (existingPost.author !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("posts")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", post_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Post deleted" });
}
