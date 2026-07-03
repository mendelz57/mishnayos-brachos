import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, studentProgress, quizAttempts, mishnayos, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "teacher") redirect("/");

  const studentId = parseInt(id);
  const [student] = await db.select().from(users).where(eq(users.id, studentId));
  if (!student) redirect("/teacher");

  const allChapters = await db.select().from(chapters).orderBy(chapters.number);
  const allMishnayos = await db.select().from(mishnayos).orderBy(mishnayos.order);
  const progress = await db.select().from(studentProgress).where(eq(studentProgress.studentId, studentId));
  const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.studentId, studentId));

  const progressMap = new Map(progress.map((p) => [p.mishnayosId, p]));
  const bestAttempt = new Map<number, number>();
  attempts.forEach((a) => {
    const current = bestAttempt.get(a.mishnayosId) ?? 0;
    if (a.score > current) bestAttempt.set(a.mishnayosId, a.score);
  });

  const completed = progress.filter((p) => p.completed).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{student.email} · {completed}/{allMishnayos.length} mishnayos completed</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-700">{completed}</div>
          <div className="text-sm text-gray-500 mt-1">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{attempts.filter((a) => a.passed).length}</div>
          <div className="text-sm text-gray-500 mt-1">Quizzes Passed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-700">
            {attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : "—"}%
          </div>
          <div className="text-sm text-gray-500 mt-1">Avg. Score</div>
        </div>
      </div>

      <div className="space-y-4">
        {allChapters.map((chapter) => {
          const chapterMishnayos = allMishnayos.filter((m) => m.chapterId === chapter.id);
          return (
            <div key={chapter.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Perek {chapter.number} — {chapter.title}</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {chapterMishnayos.map((m) => {
                    const p = progressMap.get(m.id);
                    const score = bestAttempt.get(m.id);
                    return (
                      <tr key={m.id} className="border-b border-gray-50">
                        <td className="px-5 py-2.5 font-medium">{m.number}. {m.title}</td>
                        <td className="px-5 py-2.5">
                          {p?.completed ? (
                            <span className="text-green-600 font-medium">✓ Completed</span>
                          ) : p?.unlocked ? (
                            <span className="text-blue-600">In Progress</span>
                          ) : (
                            <span className="text-gray-400">Locked</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-gray-500">
                          {score !== undefined ? `Best score: ${Math.round(score)}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
