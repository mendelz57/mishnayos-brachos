import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireTeacher() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "teacher") return null;
  return session;
}

export async function GET() {
  const session = await requireTeacher();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const teacherId = parseInt(session.user!.id!);
  const all = await db.select().from(classes).where(eq(classes.teacherId, teacherId));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await requireTeacher();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const teacherId = parseInt(session.user!.id!);
  const { name, classCode } = await req.json();
  const [cls] = await db.insert(classes).values({ name, teacherId, classCode }).returning();
  return NextResponse.json(cls);
}

export async function DELETE(req: NextRequest) {
  const session = await requireTeacher();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await db.delete(classes).where(eq(classes.id, id));
  return NextResponse.json({ success: true });
}
