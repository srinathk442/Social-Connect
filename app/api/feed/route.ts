import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

  const posts = data ?? [];
  const authorIds = Array.from(new Set(posts.map((post) => post.author))).filter(Boolean);

  let usernameMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, username")
      .in("id", authorIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    usernameMap = (users ?? []).reduce<Record<string, string>>((acc, user) => {
      acc[user.id] = user.username;
      return acc;
    }, {});
  }

  const feed = posts.map((post) => ({
    ...post,
    author_username: usernameMap[post.author] ?? "user",
  }));

  return NextResponse.json({
    page: safePage,
    limit: safeLimit,
    total: count ?? 0,
    feed,
  });
}
