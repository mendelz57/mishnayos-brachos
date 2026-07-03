import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { chapters, mishnayos, studentProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "student") redirect("/");

  const studentId = parseInt(session.user!.id!);

  const allChapters = await db.select().from(chapters).orderBy(chapters.number);
  const allMishnayos = await db.select().from(mishnayos).orderBy(mishnayos.order);
  const progress = await db.select().from(studentProgress).where(eq(studentProgress.studentId, studentId));

  const progressMap = new Map(progress.map((p) => [p.mishnayosId, p]));

  const firstMishnah = allMishnayos[0];
  if (firstMishnah && !progressMap.has(firstMishnah.id)) {
    await db.insert(studentProgress).values({
      studentId,
      mishnayosId: firstMishnah.id,
      unlocked: true,
    }).onConflictDoNothing();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Learning</h1>
      <p className="text-gray-500 mb-6">Select any mishnah to start learning.</p>

      <div className="space-y-6">
        {allChapters.map((chapter) => {
          const chapterMishnayos = allMishnayos.filter((m) => m.chapterId === chapter.id);
          const completed = chapterMishnayos.filter((m) => progressMap.get(m.id)?.completed).length;

          return (
            <div key={chapter.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Perek {chapter.number} — {chapter.title}</h2>
                  {chapter.description && <p className="text-sm text-gray-500 mt-0.5">{chapter.description}</p>}
                </div>
                <span className="text-sm text-gray-500">{completed}/{chapterMishnayos.length} complete</span>
              </div>
              <div className="divide-y divide-gray-50">
                {chapterMishnayos.map((m) => {
                  const p = progressMap.get(m.id);
                  const completed = p?.completed ?? false;

                  return (
                    <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                          completed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {completed ? "✓" : m.number}
                        </span>
                        <span className="font-medium text-gray-900">
                          Mishnah {m.number} — {m.title}
                        </span>
                      </div>
                      <Link href={`/student/mishnah/${m.id}`}
                        className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-lg hover:bg-blue-800 transition font-medium">
                        {completed ? "Review" : "Study"}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
