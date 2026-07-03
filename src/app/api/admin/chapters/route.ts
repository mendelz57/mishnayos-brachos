import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.select().from(chapters).orderBy(chapters.number);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { number, title, description } = await req.json();
  const [chapter] = await db.insert(chapters).values({ number, title, description }).returning();
  return NextResponse.json(chapter);
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, number, title, description } = await req.json();
  const [chapter] = await db
    .update(chapters)
    .set({ number, title, description })
    .where(eq(chapters.id, id))
    .returning();
  return NextResponse.json(chapter);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(chapters).where(eq(chapters.id, id));
  return NextResponse.json({ success: true });
}
