import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") redirect("/");

  const cards = [
    { title: "Chapters", description: "Manage the 9 perakim", href: "/admin/chapters", icon: "📚" },
    { title: "Mishnayos", description: "Add videos, Hebrew text & summaries", href: "/admin/mishnayos", icon: "📜" },
    { title: "Questions", description: "Create quiz questions", href: "/admin/questions", icon: "❓" },
    { title: "Flashcards", description: "Manage flashcard sets", href: "/admin/flashcards", icon: "🃏" },
    { title: "Users", description: "View students, teachers & parents", href: "/admin/users", icon: "👥" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition group"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-blue-700 transition">{card.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
