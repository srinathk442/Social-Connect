"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      identifier: String(formData.get("identifier") || ""),
      password: String(formData.get("password") || ""),
    };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }

    router.push("/feed");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
        <h1 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
          Welcome Back
        </h1>
        <p className="mt-1 text-sm text-slate-600">Login with email or username.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            name="identifier"
            placeholder="Email or username"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2 transition-all duration-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white transition-all duration-300 hover:scale-[1.01] hover:shadow-lg disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/register" className="text-slate-900 underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
