"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  User,
} from "lucide-react";

type FeedPost = {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: string;
  author_username?: string;
  author_avatar_url?: string | null;
};

type PostComment = {
  id: string;
  content: string;
  author: string;
  created_at: string;
};

type AppNotification = {
  id: string;
  message: string;
  createdAt: number;
  read: boolean;
};

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("you");
  const [newPost, setNewPost] = useState("");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const previousCountsRef = useRef<Record<string, { like_count: number; comment_count: number }>>({});

  function pushNotification(message: string) {
    const item: AppNotification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      createdAt: Date.now(),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 20));
  }

  function getInitials(value: string | undefined) {
    const safe = (value || "you").trim();
    return safe.slice(0, 2).toUpperCase();
  }

  async function loadFeed(checkForNotifications = true) {
    const response = await fetch("/api/feed?page=1&limit=20", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to load feed");
      return;
    }

    const incomingPosts = (data.feed || []) as FeedPost[];

    if (checkForNotifications) {
      for (const post of incomingPosts) {
        const previous = previousCountsRef.current[post.id];
        if (!previous) continue;

        const likesAdded = post.like_count - previous.like_count;
        const commentsAdded = post.comment_count - previous.comment_count;

        if (likesAdded > 0) {
          pushNotification(`Someone liked a post (+${likesAdded})`);
        }
        if (commentsAdded > 0) {
          pushNotification(`New comment on a post (+${commentsAdded})`);
        }
      }
    }

    const nextCounts: Record<string, { like_count: number; comment_count: number }> = {};
    for (const post of incomingPosts) {
      nextCounts[post.id] = { like_count: post.like_count, comment_count: post.comment_count };
    }
    previousCountsRef.current = nextCounts;
    setPosts(incomingPosts);
  }

  async function loadCurrentUser() {
    const response = await fetch("/api/users/me", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await response.json();
    if (response.ok) {
      setCurrentUserId(data.user?.id ?? null);
      setCurrentUserAvatarUrl(data.user?.avatar_url ?? null);
      setCurrentUsername(data.user?.username ?? "you");
    }
  }

  useEffect(() => {
    void loadCurrentUser();
    void loadFeed(false);
    const interval = setInterval(() => {
      void loadCurrentUser();
      void loadFeed(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  async function createPost(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newPost, image_url: newPostImageUrl }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to create post");
      setLoading(false);
      return;
    }

    setNewPost("");
    setNewPostImageUrl("");
    await loadFeed(false);
    setLoading(false);
  }

  async function uploadPostImage(file: File) {
    setError("");
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target", "post");

    const response = await fetch("/api/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Image upload failed");
      setUploadingImage(false);
      return;
    }

    setNewPostImageUrl(data.url || "");
    setUploadingImage(false);
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

  async function deletePost(postId: string) {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    const response = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to delete post");
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
    pushNotification("Post deleted");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <h1 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
              SocialConnect
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="relative rounded-full p-2 transition-all duration-300 hover:scale-110 hover:bg-slate-100"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
              }}
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {notifications.some((item) => !item.read) ? (
                <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-red-500" />
              ) : null}
            </button>
            <Link
              href="/profile"
              className="rounded-full p-2 transition-all duration-300 hover:scale-110 hover:bg-slate-100"
            >
              <User className="h-5 w-5 text-slate-600" />
            </Link>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
        {showNotifications ? (
          <div className="mx-auto w-full max-w-6xl px-4 pb-3">
            <div className="max-w-md rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow">
              {notifications.length === 0 ? (
                <p className="text-slate-500">No new notifications.</p>
              ) : (
                notifications.slice(0, 5).map((item) => (
                  <p key={item.id} className="py-1">
                    {item.message}
                  </p>
                ))
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <form
          onSubmit={createPost}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          <div className="flex gap-3">
            {currentUserAvatarUrl ? (
              <img
                src={currentUserAvatarUrl}
                alt="Your avatar"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500 ring-offset-2"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-xl font-semibold text-white ring-2 ring-blue-500 ring-offset-2">
                {getInitials(currentUsername)}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                maxLength={280}
                placeholder="What's on your mind?"
                className="w-full resize-none rounded-xl border border-slate-200 p-3 transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />

              <div className="mt-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-slate-600 transition-all duration-300 hover:scale-105 hover:bg-slate-100">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadPostImage(file);
                    }}
                    className="hidden"
                  />
                </label>
                {uploadingImage ? <p className="mt-1 text-xs text-slate-600">Uploading image...</p> : null}
                {newPostImageUrl ? (
                  <div className="mt-2">
                    <img
                      src={newPostImageUrl}
                      alt="Preview"
                      className="max-h-48 rounded-md border border-slate-200"
                    />
                    <p className="mt-1 text-xs text-green-700">Image uploaded.</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">{newPost.length}/280</span>
                <button
                  type="submit"
                  disabled={loading || uploadingImage || !newPost.trim()}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Posting..." : uploadingImage ? "Wait..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mb-3">{error ? <p className="text-sm text-red-600">{error}</p> : null}</div>

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  {post.author_avatar_url ? (
                    <img
                      src={post.author_avatar_url}
                      alt={post.author_username ?? post.author}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200 transition-all duration-300 hover:ring-blue-500"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-xl font-semibold text-white ring-2 ring-slate-200 transition-all duration-300 hover:ring-blue-500">
                      {getInitials(post.author_username ?? post.author)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{post.author_username ?? post.author}</h3>
                    <p className="text-sm text-slate-500">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="mb-4 whitespace-pre-wrap leading-relaxed text-slate-700">{post.content}</p>

                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full cursor-pointer rounded-xl object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-4 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-slate-100"
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-sm font-medium">{post.like_count}</span>
                </button>

                <button
                  onClick={() => loadComments(post.id)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-slate-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{post.comment_count}</span>
                </button>

                {currentUserId && post.author === currentUserId ? (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="ml-auto rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-300 hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : null}

              </div>

              <div className="px-6 pb-5">
                <div className="mt-2 space-y-2">
                  {(comments[post.id] || []).map((comment) => (
                    <p key={comment.id} className="rounded bg-slate-50 px-2 py-1 text-sm text-slate-700">
                      {comment.content}
                    </p>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={newComment[post.id] || ""}
                    onChange={(e) =>
                      setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Write a comment"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <div className="fixed right-4 top-20 z-50 space-y-2">
        {notifications
          .filter((item) => !item.read)
          .slice(0, 3)
          .map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow">
              {item.message}
            </div>
          ))}
      </div>
    </div>
  );
}
