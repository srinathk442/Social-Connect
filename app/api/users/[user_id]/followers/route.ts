import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ user_id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { user_id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from("follows")
    .select("follower, created_at")
    .eq("following", user_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ followers: data ?? [] });
}
