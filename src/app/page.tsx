import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const session = await auth();
  if (session) {
    const role = (session.user as { role: string }).role;
    redirect(`/${role}`);
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #3b0a1f 0%, #5c1a2e 40%, #2d0a14 100%)" }}>

      {/* Gold top border */}
      <div style={{ height: "4px", background: "linear-gradient(90deg, transparent, #c9a227, #f0d060, #c9a227, transparent)" }} />

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-8 py-16 max-w-6xl mx-auto w-full">

        {/* Book cover */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div style={{
            filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.7))",
            transform: "perspective(800px) rotateY(-6deg) rotateX(2deg)",
            transition: "transform .3s ease",
          }}>
            <Image
              src="/cover.jpg"
              alt="The Illustrated Mishnayos — Maseches Brachos"
              width={340}
              height={270}
              className="rounded-lg"
              priority
            />
          </div>
          <p style={{ color: "rgba(201,162,39,0.6)", fontSize: "11px", marginTop: "16px", letterSpacing: ".1em", textTransform: "uppercase" }}>
            The Illustrated Mishnayos
          </p>
        </div>

        {/* Text & buttons */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg">

          {/* Hebrew subtitle */}
          <div style={{
            fontSize: "13px",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#c9a227",
            marginBottom: "12px",
            fontWeight: 600,
          }}>
            מסכת ברכות
          </div>

          {/* Main title */}
          <h1 style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            marginBottom: "8px",
            textWrap: "balance",
          }}>
            Mishnayos Brachos<br />
            <span style={{ color: "#c9a227" }}>for Kids</span>
          </h1>

          {/* Decorative rule */}
          <div style={{
            width: "60px",
            height: "2px",
            background: "linear-gradient(90deg, #c9a227, #f0d060)",
            margin: "20px 0",
          }} />

          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: 1.7, marginBottom: "36px" }}>
            Watch videos, review flashcards, and take quizzes on all 9 chapters of Maseches Brachos — taught by Rabbi Mendel Zajac.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "32px", marginBottom: "40px" }}>
            {[
              { num: "9", label: "Chapters" },
              { num: "57", label: "Mishnayos" },
              { num: "44", label: "Videos" },
            ].map(({ num, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 700, color: "#c9a227", lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: "4px" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Link
              href="/login"
              style={{
                background: "linear-gradient(135deg, #c9a227, #e8c040)",
                color: "#2d0a14",
                padding: "13px 28px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
                letterSpacing: ".02em",
                boxShadow: "0 4px 20px rgba(201,162,39,0.35)",
                transition: "all .15s",
              }}
            >
              Log In
            </Link>
            <Link
              href="/register"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                padding: "13px 28px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
                border: "1px solid rgba(201,162,39,0.4)",
                backdropFilter: "blur(8px)",
                transition: "all .15s",
              }}
            >
              Register
            </Link>
          </div>

          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginTop: "20px" }}>
            Students · Teachers · Parents
          </p>
        </div>
      </div>

      {/* Gold bottom border */}
      <div style={{ height: "4px", background: "linear-gradient(90deg, transparent, #c9a227, #f0d060, #c9a227, transparent)" }} />
    </main>
  );
}
