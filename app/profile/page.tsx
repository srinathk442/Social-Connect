"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  location?: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMe() {
      const response = await fetch("/api/users/me", { credentials: "include" });
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user || {});
      }
    }

    void loadMe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      bio: String(formData.get("bio") || ""),
      avatar_url: String(formData.get("avatar_url") || ""),
      website: String(formData.get("website") || ""),
      location: String(formData.get("location") || ""),
    };

    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update profile");
      setLoading(false);
      return;
    }

    setProfile(data.user || {});
    setStatus("Profile updated successfully.");
    setLoading(false);
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Link href="/feed" className="text-sm underline text-slate-700">
          Back to feed
        </Link>
      </header>

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Username:</span> {profile.username || "-"}
        </p>
        <p>
          <span className="font-semibold">Name:</span> {profile.first_name || "-"} {profile.last_name || ""}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {profile.email || "-"}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Bio (max 160)</span>
          <textarea
            name="bio"
            maxLength={160}
            defaultValue={profile.bio || ""}
            className="min-h-20 w-full rounded-md border border-slate-300 p-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Avatar URL</span>
          <input
            name="avatar_url"
            type="url"
            defaultValue={profile.avatar_url || ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Website</span>
          <input
            name="website"
            type="url"
            defaultValue={profile.website || ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Location</span>
          <input
            name="location"
            defaultValue={profile.location || ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        {status ? <p className="text-sm text-green-700">{status}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
