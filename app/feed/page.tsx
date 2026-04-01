"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type FeedPost = {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: string;
};

type PostComment = {
  id: string;
  content: string;
  author: string;
  created_at: string;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [newPost, setNewPost] = useState("");
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadFeed() {
    const response = await fetch("/api/feed?page=1&limit=20", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load feed");
      return;
    }
    setPosts(data.feed || []);
  }

  useEffect(() => {
    void loadFeed();
  }, []);

  async function createPost(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newPost, image_url: "" }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to create post");
      setLoading(false);
      return;
    }

    setNewPost("");
    setPosts((prev) => [data.post, ...prev]);
    setLoading(false);
  }

  async function likePost(postId: string) {
    await fetch(`/api/posts/${postId}/like`, { method: "POST", credentials: "include" });
    await loadFeed();
  }

  async function loadComments(postId: string) {
    const response = await fetch(`/api/posts/${postId}/comments`, { credentials: "include" });
    const data = await response.json();
    if (response.ok) {
      setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
    }
  }

  async function addComment(postId: string) {
    const content = (newComment[postId] || "").trim();
    if (!content) return;

    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      await Promise.all([loadComments(postId), loadFeed()]);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm text-slate-600 underline">
            Profile
          </Link>
          <Link href="/" className="text-sm text-slate-600 underline">
            Home
          </Link>
          <button onClick={logout} className="rounded-md border border-slate-300 px-3 py-1 text-sm">
            Logout
          </button>
        </div>
      </header>

      <form onSubmit={createPost} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          maxLength={280}
          placeholder="What are you thinking?"
          className="min-h-20 w-full rounded-md border border-slate-300 p-2"
          required
        />
        <div className="mt-2 flex justify-between">
          <span className="text-xs text-slate-500">{newPost.length}/280</span>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className="space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="whitespace-pre-wrap text-slate-900">{post.content}</p>
            {post.image_url ? (
              <img src={post.image_url} alt="Post" className="mt-3 max-h-96 w-full rounded-md object-cover" />
            ) : null}

            <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
              <button onClick={() => likePost(post.id)} className="underline">
                Like ({post.like_count})
              </button>
              <button onClick={() => loadComments(post.id)} className="underline">
                Comments ({post.comment_count})
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {(comments[post.id] || []).map((comment) => (
                <p key={comment.id} className="rounded bg-slate-50 px-2 py-1 text-sm text-slate-700">
                  {comment.content}
                </p>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={newComment[post.id] || ""}
                onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                placeholder="Write a comment"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                onClick={() => addComment(post.id)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                Send
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
