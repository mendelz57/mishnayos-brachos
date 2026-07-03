import { NextResponse } from "next/server";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    // Main app donations
    const mainRows = await db
      .select({
        name: donations.name,
        amount: donations.amount,
        dedication: donations.dedication,
        isMonthly: donations.isMonthly,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .orderBy(desc(donations.createdAt));

    // Fundraiser site donations (separate Neon database)
    let fundraiserRows: typeof mainRows = [];
    if (process.env.FUNDRAISER_DATABASE_URL) {
      try {
        const sql = neon(process.env.FUNDRAISER_DATABASE_URL);
        const rows = await sql`
          SELECT name, amount, dedication, is_monthly AS "isMonthly", created_at AS "createdAt"
          FROM donations
          ORDER BY created_at DESC
        `;
        fundraiserRows = rows.map(r => ({
          name: r.name as string,
          amount: typeof r.amount === "string" ? parseFloat(r.amount) : r.amount as number,
          dedication: r.dedication as string | null,
          isMonthly: r.isMonthly as boolean,
          createdAt: r.createdAt as Date,
        }));
      } catch (e) {
        console.error("Failed to load fundraiser donations:", e);
      }
    }

    // Merge and sort by date descending
    const allRows = [...mainRows, ...fundraiserRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalRaised = allRows.reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({ donors: allRows, totalRaised });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load donors." }, { status: 500 });
  }
}
