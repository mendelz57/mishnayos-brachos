import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session) {
    const role = (session.user as { role: string }).role;
    redirect(`/${role}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="text-center max-w-xl">
        <div className="text-6xl mb-4">📖</div>
        <h1 className="text-4xl font-bold text-blue-900 mb-2">משניות ברכות</h1>
        <h2 className="text-2xl font-semibold text-blue-700 mb-4">Mishnayos Brachos</h2>
        <p className="text-gray-600 mb-8">
          Learn Mishnayos Brachos with videos, flashcards, and quizzes — taught by Rabbi Mendel Zajac.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="border border-blue-700 text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Register
          </Link>
          <Link
            href="/donate"
            className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            ❤️ Donate
          </Link>
        </div>
      </div>
    </main>
  );
}
