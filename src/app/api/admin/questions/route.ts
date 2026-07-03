import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { questions, questionOptions, matchingPairs } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mishnayosId = req.nextUrl.searchParams.get("mishnayosId");
  const query = db.select().from(questions);
  const all = mishnayosId
    ? await query.where(eq(questions.mishnayosId, parseInt(mishnayosId)))
    : await query;

  const withOptions = await Promise.all(
    all.map(async (q) => {
      const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, q.id));
      const pairs = await db.select().from(matchingPairs).where(eq(matchingPairs.questionId, q.id));
      return { ...q, options, pairs };
    })
  );
  return NextResponse.json(withOptions);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mishnayosId, type, questionText, order, options, pairs } = await req.json();

  const [question] = await db
    .insert(questions)
    .values({ mishnayosId, type, questionText, order })
    .returning();

  if (options?.length) {
    await db.insert(questionOptions).values(
      options.map((o: { text: string; isCorrect: boolean }) => ({
        questionId: question.id,
        text: o.text,
        isCorrect: o.isCorrect,
      }))
    );
  }

  if (pairs?.length) {
    await db.insert(matchingPairs).values(
      pairs.map((p: { leftText: string; rightText: string }) => ({
        questionId: question.id,
        leftText: p.leftText,
        rightText: p.rightText,
      }))
    );
  }

  return NextResponse.json(question);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(questionOptions).where(eq(questionOptions.questionId, id));
  await db.delete(matchingPairs).where(eq(matchingPairs.questionId, id));
  await db.delete(questions).where(eq(questions.id, id));
  return NextResponse.json({ success: true });
}
