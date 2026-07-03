import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, classes, classEnrollments, parentChildren } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, password, role, classCode, childEmail } = await req.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning();

  if (role === "student" && classCode) {
    const [cls] = await db.select().from(classes).where(eq(classes.classCode, classCode));
    if (cls) {
      await db.insert(classEnrollments).values({ studentId: user.id, classId: cls.id });
    }
  }

  if (role === "parent" && childEmail) {
    const [child] = await db.select().from(users).where(eq(users.email, childEmail));
    if (child && child.role === "student") {
      await db.insert(parentChildren).values({ parentId: user.id, childId: child.id });
    }
  }

  return NextResponse.json({ success: true });
}
