import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ user_id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { user_id } = await context.params;

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select(
      "id, email, username, first_name, last_name, bio, avatar_url, website, location, created_at, last_login",
    )
    .eq("id", user_id)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { count, error: postCountError } = await supabaseAdmin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author", user_id)
    .eq("is_active", true);

  if (postCountError) {
    return NextResponse.json({ error: postCountError.message }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      ...user,
      posts_count: count ?? 0,
    },
  });
}
