import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizAttempts, quizAnswers, studentProgress, mishnayos } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, mishnayosId, score, maxScore, passed, answers } = await req.json();

  const [attempt] = await db
    .insert(quizAttempts)
    .values({ studentId, mishnayosId, score, maxScore, passed })
    .returning();

  if (answers?.length) {
    await db.insert(quizAnswers).values(
      answers.map((a: { questionId: number; answer: string; isCorrect: boolean }) => ({
        attemptId: attempt.id,
        questionId: a.questionId,
        studentAnswer: a.answer,
        isCorrect: a.isCorrect,
      }))
    );
  }

  if (passed) {
    await db
      .update(studentProgress)
      .set({ completed: true, completedAt: new Date() })
      .where(and(eq(studentProgress.studentId, studentId), eq(studentProgress.mishnayosId, mishnayosId)));

    // Unlock next mishnah
    const [current] = await db.select().from(mishnayos).where(eq(mishnayos.id, mishnayosId));
    if (current) {
      const [next] = await db
        .select()
        .from(mishnayos)
        .where(eq(mishnayos.chapterId, current.chapterId))
        .orderBy(asc(mishnayos.order))
        .limit(1);

      // Find next mishnah by order globally
      const all = await db.select().from(mishnayos).orderBy(asc(mishnayos.order));
      const idx = all.findIndex((m) => m.id === mishnayosId);
      const nextMishnah = all[idx + 1];

      if (nextMishnah) {
        await db
          .insert(studentProgress)
          .values({ studentId, mishnayosId: nextMishnah.id, unlocked: true })
          .onConflictDoNothing();
      }

      void next; // suppress unused warning
    }
  }

  return NextResponse.json({ success: true, attempt });
}
