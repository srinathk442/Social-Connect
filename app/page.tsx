import Link from "next/link";
import { ArrowRight, Sparkles, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl backdrop-blur-xl md:p-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm text-blue-700">
            <Sparkles className="h-4 w-4" />
            Modern social experience
          </div>

          <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              SocialConnect
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Share your thoughts, post images, discover public feeds, and connect through likes
            and comments in a clean, fast interface.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition-all duration-300 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/feed"
              className="rounded-xl px-5 py-3 font-medium text-slate-700 transition-all duration-300 hover:bg-slate-100"
            >
              Explore Feed
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 inline-flex rounded-lg bg-blue-100 p-2 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Profiles</h3>
              <p className="mt-1 text-sm text-slate-600">Create and edit your public profile.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 inline-flex rounded-lg bg-cyan-100 p-2 text-cyan-700">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Realtime Feel</h3>
              <p className="mt-1 text-sm text-slate-600">Like, comment, and get quick notifications.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-slate-900">Media Posts</h3>
              <p className="mt-1 text-sm text-slate-600">Share text with image uploads in seconds.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
