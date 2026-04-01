import { supabaseAdmin } from "@/lib/supabase";

export async function syncPostCounters(postId: string) {
  const [{ count: likeCount, error: likeError }, { count: commentCount, error: commentError }] =
    await Promise.all([
      supabaseAdmin.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId),
      supabaseAdmin
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId),
    ]);

  if (likeError) throw new Error(likeError.message);
  if (commentError) throw new Error(commentError.message);

  const { error: updateError } = await supabaseAdmin
    .from("posts")
    .update({
      like_count: likeCount ?? 0,
      comment_count: commentCount ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (updateError) throw new Error(updateError.message);
}
