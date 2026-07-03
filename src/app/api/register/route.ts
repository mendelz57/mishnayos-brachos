import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, classes, classEnrollments, parentChildren } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

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

  // Email notification to admin
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Mishnayos Brachos <onboarding@resend.dev>",
      to: "rabbimendel@chabadsola.com",
      subject: `New registration: ${name} (${role})`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#1e3a5f;margin-bottom:16px;">New User Registered</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f0f4f6;">Name</td><td style="padding:8px 0;font-weight:600;border-bottom:1px solid #f0f4f6;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f0f4f6;">Email</td><td style="padding:8px 0;border-bottom:1px solid #f0f4f6;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;">Role</td><td style="padding:8px 0;text-transform:capitalize;">${role}</td></tr>
          </table>
        </div>
      `,
    });
  } catch (err) {
    console.error("Registration notification email failed:", err);
  }

  return NextResponse.json({ success: true });
}
