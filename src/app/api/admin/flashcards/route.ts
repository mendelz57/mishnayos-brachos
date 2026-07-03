import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { flashcards } from "@/db/schema";
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
  const all = mishnayosId
    ? await db.select().from(flashcards).where(eq(flashcards.mishnayosId, parseInt(mishnayosId))).orderBy(flashcards.order)
    : await db.select().from(flashcards).orderBy(flashcards.order);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mishnayosId, front, back, order } = await req.json();
  const [card] = await db.insert(flashcards).values({ mishnayosId, front, back, order }).returning();
  return NextResponse.json(card);
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, front, back, order } = await req.json();
  const [card] = await db.update(flashcards).set({ front, back, order }).where(eq(flashcards.id, id)).returning();
  return NextResponse.json(card);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(flashcards).where(eq(flashcards.id, id));
  return NextResponse.json({ success: true });
}
