import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role: string }).role;

  const navLinks: Record<string, { label: string; href: string }[]> = {
    student: [
      { label: "My Learning", href: "/student" },
    ],
    teacher: [
      { label: "Dashboard", href: "/teacher" },
      { label: "My Classes", href: "/teacher/classes" },
    ],
    parent: [
      { label: "Dashboard", href: "/parent" },
    ],
    admin: [
      { label: "Chapters", href: "/admin/chapters" },
      { label: "Mishnayos", href: "/admin/mishnayos" },
      { label: "Questions", href: "/admin/questions" },
      { label: "Flashcards", href: "/admin/flashcards" },
      { label: "Users", href: "/admin/users" },
    ],
  };

  const links = navLinks[role] || [];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-blue-800 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg">
            📖 Mishnayos Brachos
          </Link>
          <div className="flex gap-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-blue-100 hover:text-white text-sm transition">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200 capitalize">{role}: {session.user?.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-sm text-blue-200 hover:text-white transition">
              Sign Out
            </button>
          </form>
        </div>
      </nav>
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}
