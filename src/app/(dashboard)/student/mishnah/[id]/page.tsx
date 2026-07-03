import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mishnayos, chapters, flashcards, questions, questionOptions, matchingPairs, studentProgress } from "@/db/schema";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";
import MishnayosClient from "./MishnayosClient";

export default async function MishnayosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "student") redirect("/");

  const studentId = parseInt(session.user!.id!);
  const mishnayosId = parseInt(id);

  const [mishnah] = await db.select().from(mishnayos).where(eq(mishnayos.id, mishnayosId));
  if (!mishnah) redirect("/student");

  const [progress] = await db
    .select()
    .from(studentProgress)
    .where(and(eq(studentProgress.studentId, studentId), eq(studentProgress.mishnayosId, mishnayosId)));


  const [chapter] = await db.select().from(chapters).where(eq(chapters.id, mishnah.chapterId));
  const cards = await db.select().from(flashcards).where(eq(flashcards.mishnayosId, mishnayosId)).orderBy(flashcards.order);
  const qs = await db.select().from(questions).where(eq(questions.mishnayosId, mishnayosId)).orderBy(questions.order);

  const questionsWithData = await Promise.all(
    qs.map(async (q) => {
      const opts = await db.select().from(questionOptions).where(eq(questionOptions.questionId, q.id));
      const pairs = await db.select().from(matchingPairs).where(eq(matchingPairs.questionId, q.id));
      return { ...q, options: opts, pairs };
    })
  );

  return (
    <MishnayosClient
      mishnah={mishnah}
      chapter={chapter}
      flashcards={cards}
      questions={questionsWithData}
      studentId={studentId}
      alreadyCompleted={progress?.completed ?? false}
      pdfStartPage={mishnah.pdfStartPage ?? null}
    />
  );
}
