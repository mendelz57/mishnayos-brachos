import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { parentChildren, users, studentProgress, quizAttempts, mishnayos, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ParentDashboard() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "parent") redirect("/");

  const parentId = parseInt(session.user!.id!);

  const children = await db
    .select({ child: users })
    .from(parentChildren)
    .leftJoin(users, eq(parentChildren.childId, users.id))
    .where(eq(parentChildren.parentId, parentId));

  const allChapters = await db.select().from(chapters).orderBy(chapters.number);
  const allMishnayos = await db.select().from(mishnayos).orderBy(mishnayos.order);

  const childData = await Promise.all(
    children.map(async ({ child }) => {
      if (!child) return null;
      const progress = await db.select().from(studentProgress).where(eq(studentProgress.studentId, child.id));
      const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.studentId, child.id));
      const completed = progress.filter((p) => p.completed).length;
      const progressMap = new Map(progress.map((p) => [p.mishnayosId, p]));
      const bestAttempt = new Map<number, number>();
      attempts.forEach((a) => {
        const current = bestAttempt.get(a.mishnayosId) ?? 0;
        if (a.score > current) bestAttempt.set(a.mishnayosId, a.score);
      });
      return { child, completed, total: allMishnayos.length, attempts, progressMap, bestAttempt };
    })
  );

  const validChildren = childData.filter(Boolean);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Child&apos;s Progress</h1>

      {validChildren.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No children linked to your account. Make sure your child registered using the same email you provided.
        </div>
      )}

      {validChildren.map((data) => data && (
        <div key={data.child.id} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{data.child.name}</h2>
              <p className="text-sm text-gray-500">{data.completed}/{data.total} mishnayos completed</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-700">{data.completed}</div>
              <div className="text-sm text-gray-500 mt-1">Completed</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">{data.attempts.filter((a) => a.passed).length}</div>
              <div className="text-sm text-gray-500 mt-1">Quizzes Passed</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-gray-700">
                {data.attempts.length > 0
                  ? Math.round(data.attempts.reduce((s, a) => s + a.score, 0) / data.attempts.length)
                  : "—"}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Avg. Score</div>
            </div>
          </div>

          <div className="space-y-3">
            {allChapters.map((chapter) => {
              const chapterMishnayos = allMishnayos.filter((m) => m.chapterId === chapter.id);
              const doneInChapter = chapterMishnayos.filter((m) => data.progressMap.get(m.id)?.completed).length;

              return (
                <div key={chapter.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Perek {chapter.number} — {chapter.title}</h3>
                    <span className="text-sm text-gray-500">{doneInChapter}/{chapterMishnayos.length}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {chapterMishnayos.map((m) => {
                      const p = data.progressMap.get(m.id);
                      const score = data.bestAttempt.get(m.id);
                      return (
                        <div key={m.id} className="px-5 py-2.5 flex items-center justify-between text-sm">
                          <span className={p?.unlocked ? "text-gray-900" : "text-gray-400"}>
                            {m.number}. {m.title}
                          </span>
                          <div className="flex items-center gap-4">
                            {score !== undefined && (
                              <span className="text-gray-500">Best: {Math.round(score)}%</span>
                            )}
                            <span className={
                              p?.completed ? "text-green-600 font-medium" :
                              p?.unlocked ? "text-blue-600" : "text-gray-400"
                            }>
                              {p?.completed ? "✓ Done" : p?.unlocked ? "In Progress" : "Locked"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
