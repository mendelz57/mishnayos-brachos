import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mishnayos, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db
    .select({ mishnah: mishnayos, chapter: chapters })
    .from(mishnayos)
    .leftJoin(chapters, eq(mishnayos.chapterId, chapters.id))
    .orderBy(mishnayos.order);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId, number, title, hebrewText, englishSummary, youtubeVideoId, pdfStartPage, order } = await req.json();
  const [mishnah] = await db
    .insert(mishnayos)
    .values({ chapterId, number, title, hebrewText, englishSummary, youtubeVideoId, pdfStartPage, order })
    .returning();
  return NextResponse.json(mishnah);
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, chapterId, number, title, hebrewText, englishSummary, youtubeVideoId, pdfStartPage, order } = await req.json();
  const [mishnah] = await db
    .update(mishnayos)
    .set({ chapterId, number, title, hebrewText, englishSummary, youtubeVideoId, pdfStartPage, order })
    .where(eq(mishnayos.id, id))
    .returning();
  return NextResponse.json(mishnah);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(mishnayos).where(eq(mishnayos.id, id));
  return NextResponse.json({ success: true });
}
