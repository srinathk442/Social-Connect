import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <main className="w-full max-w-xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">SocialConnect</h1>
        <p className="mt-3 text-slate-600">
          Share posts, connect with people, and discover content in a clean feed.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/register"
            className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Login
          </Link>
          <Link href="/feed" className="rounded-md px-4 py-2 text-slate-700 hover:bg-slate-50">
            Open Feed
          </Link>
        </div>
      </main>
    </div>
  );
}
