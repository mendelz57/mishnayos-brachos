import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

  // Always return success so we don't reveal whether an email exists
  if (!user) return NextResponse.json({ success: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.insert(passwordResets).values({ userId: user.id, token, expiresAt });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Mishnayos Brachos <onboarding@resend.dev>",
    to: email,
    subject: "Reset your password — Mishnayos Brachos",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1e3a5f;margin-bottom:8px;">Reset Your Password</h2>
        <p style="color:#374151;margin-bottom:24px;">
          Hi ${user.name},<br><br>
          Click the button below to reset your password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
          style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px;">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
          If you didn't request this, you can ignore this email. Your password won't change.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
