import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mishnayos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [mishnah] = await db.select().from(mishnayos).where(eq(mishnayos.id, parseInt(id)));
  if (!mishnah || !mishnah.pdfStartPage) {
    return new NextResponse("No PDF configured for this mishnah", { status: 404 });
  }

  const pdfPath = path.join(process.cwd(), "public", "brachos.pdf");
  let pdfBytes: Buffer;
  try {
    pdfBytes = await readFile(pdfPath);
  } catch {
    return new NextResponse("PDF file not found on server", { status: 404 });
  }

  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();

  // Convert 1-based page numbers to 0-based indices
  const startIdx = mishnah.pdfStartPage - 1;
  const endIdx = mishnah.pdfEndPage ? mishnah.pdfEndPage - 1 : startIdx;

  const clampedStart = Math.max(0, Math.min(startIdx, totalPages - 1));
  const clampedEnd = Math.max(clampedStart, Math.min(endIdx, totalPages - 1));

  const newDoc = await PDFDocument.create();
  const pageIndices = [];
  for (let i = clampedStart; i <= clampedEnd; i++) pageIndices.push(i);

  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach(p => newDoc.addPage(p));

  const outBytes = await newDoc.save();

  return new NextResponse(Buffer.from(outBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
