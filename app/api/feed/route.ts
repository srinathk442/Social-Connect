import { NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, getUserIdFromAccessToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const accessToken = getAccessTokenFromCookieHeader(cookieHeader);
  const currentUserId = getUserIdFromAccessToken(accessToken);

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

  let userMap: Record<string, { username: string; avatar_url: string | null }> = {};
  let followingMap: Record<string, boolean> = {};
  if (authorIds.length > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, username, avatar_url")
      .in("id", authorIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    userMap = (users ?? []).reduce<Record<string, { username: string; avatar_url: string | null }>>(
      (acc, user) => {
        acc[user.id] = { username: user.username, avatar_url: user.avatar_url ?? null };
        return acc;
      },
      {},
    );

    if (currentUserId) {
      const { data: follows, error: followsError } = await supabaseAdmin
        .from("follows")
        .select("following")
        .eq("follower", currentUserId)
        .in("following", authorIds);

      if (followsError) {
        return NextResponse.json({ error: followsError.message }, { status: 500 });
      }

      followingMap = (follows ?? []).reduce<Record<string, boolean>>((acc, follow) => {
        acc[follow.following] = true;
        return acc;
      }, {});
    }
  }

  const feed = posts.map((post) => ({
    ...post,
    author_username: userMap[post.author]?.username ?? "user",
    author_avatar_url: userMap[post.author]?.avatar_url ?? null,
    is_following_author: Boolean(followingMap[post.author]),
  }));

  return NextResponse.json({
    page: safePage,
    limit: safeLimit,
    total: count ?? 0,
    feed,
  });
}
