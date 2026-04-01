"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") || ""),
      username: String(formData.get("username") || ""),
      password: String(formData.get("password") || ""),
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/feed");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <div className="w-full rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">Start using SocialConnect.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input name="first_name" placeholder="First name" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <input name="last_name" placeholder="Last name" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <input name="username" placeholder="Username" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <input name="email" type="email" placeholder="Email" required className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <input name="password" type="password" placeholder="Password" required className="w-full rounded-md border border-slate-300 px-3 py-2" />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-900 underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
