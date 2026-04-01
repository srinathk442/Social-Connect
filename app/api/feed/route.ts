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

  return NextResponse.json({
    page: safePage,
    limit: safeLimit,
    total: count ?? 0,
    feed: data ?? [],
  });
}
