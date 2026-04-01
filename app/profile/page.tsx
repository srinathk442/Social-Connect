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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  useEffect(() => {
    async function loadMe() {
      const response = await fetch("/api/users/me", { credentials: "include" });
      const data = await response.json();

      if (response.ok) {
        setProfile(data.user || {});
        setAvatarUrl(data.user?.avatar_url || "");
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
      avatar_url: avatarUrl,
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
    setAvatarUrl(data.user?.avatar_url || "");
    setStatus("Profile updated successfully.");
    setLoading(false);
  }

  async function uploadAvatar(file: File) {
    setError("");
    setStatus("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target", "avatar");

    const response = await fetch("/api/uploads", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Avatar upload failed");
      return;
    }

    const uploadedUrl = data.url || "";
    setAvatarUrl(uploadedUrl);

    // Persist avatar immediately so feed/profile reflect it without extra manual save.
    const saveResponse = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: uploadedUrl }),
      credentials: "include",
    });
    const savedData = await saveResponse.json();

    if (!saveResponse.ok) {
      setError(savedData.error || "Uploaded but failed to save profile picture");
      return;
    }

    setProfile(savedData.user || {});
    setAvatarUrl(savedData.user?.avatar_url || uploadedUrl);
    setStatus("Profile picture uploaded successfully.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
            My Profile
          </h1>
          <Link href="/feed" className="text-sm text-slate-700 underline">
            Back to feed
          </Link>
        </header>

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-lg">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="mb-3 h-20 w-20 rounded-full border border-slate-200 object-cover ring-2 ring-blue-500 ring-offset-2"
          />
        ) : null}
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

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
        >
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Bio (max 160)</span>
          <textarea
            name="bio"
            maxLength={160}
            defaultValue={profile.bio || ""}
            className="min-h-20 w-full rounded-xl border border-slate-300 p-2 transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Profile Photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFileName(file.name);
                void uploadAvatar(file);
              }
            }}
            className="hidden"
            id="profile-avatar-input"
          />
          <label
            htmlFor="profile-avatar-input"
            className="mt-1 inline-block cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Choose file
          </label>
          <span className="ml-2 text-sm text-slate-500">{selectedFileName || "No file chosen"}</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Website</span>
          <input
            name="website"
            type="url"
            defaultValue={profile.website || ""}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Location</span>
          <input
            name="location"
            defaultValue={profile.location || ""}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        {status ? <p className="text-sm text-green-700">{status}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2 font-medium text-white transition-all duration-300 hover:scale-[1.01] hover:shadow-lg disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
        </form>
      </div>
    </div>
  );
}
