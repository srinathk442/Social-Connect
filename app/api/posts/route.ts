import { NextResponse } from "next/server";
import { postSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabase";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "10");

  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
  const safeLimit = Number.isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 50);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  const { data, count, error } = await supabaseAdmin
    .from("posts")
    .select("id, content, image_url, like_count, comment_count, created_at, updated_at, author", {
      count: "exact",
    })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    page: safePage,
    limit: safeLimit,
    total: count ?? 0,
    posts: data ?? [],
  });
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const userId = getUserIdFromAccessToken(accessToken);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    author: userId,
  };

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert(payload)
    .select("id, content, image_url, like_count, comment_count, created_at, updated_at, author")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Post created", post: data }, { status: 201 });
}
