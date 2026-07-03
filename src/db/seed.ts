// Run with: npx tsx src/db/seed.ts
// Seeds all 9 chapters and 57 mishnayos with their PDF page numbers
import { db } from "./index";
import { chapters, mishnayos } from "./schema";

const CHAPTERS = [
  { number: 1, title: "Perek Aleph", description: "Hilchos Krias Shema" },
  { number: 2, title: "Perek Beis", description: "Hilchos Krias Shema" },
  { number: 3, title: "Perek Gimmel", description: "Hilchos Krias Shema" },
  { number: 4, title: "Perek Daled", description: "Hilchos Tefillah" },
  { number: 5, title: "Perek Hey", description: "Hilchos Tefillah" },
  { number: 6, title: "Perek Vov", description: "Hilchos Brachos" },
  { number: 7, title: "Perek Zayin", description: "Hilchos Birchas HaMazon" },
  { number: 8, title: "Perek Ches", description: "Hilchos Birchas HaMazon" },
  { number: 9, title: "Perek Tes", description: "Hilchos Brachos" },
];

// [chapterNumber, mishnayosNumber, title, pdfStartPage, globalOrder]
const MISHNAYOS: [number, number, string, number, number][] = [
  // Perek 1
  [1, 1, "Me'eimasai", 10, 1],
  [1, 2, "Hayah Korei", 20, 2],
  [1, 3, "Beis Shammai", 26, 3],
  [1, 4, "BaShachar", 36, 4],
  [1, 5, "Hizkir", 42, 5],
  // Perek 2
  [2, 1, "Hayah Korei BaTorah", 50, 6],
  [2, 2, "Hayu Osim", 56, 7],
  [2, 3, "Mi SheMetо", 64, 8],
  [2, 4, "Chassanim", 70, 9],
  [2, 5, "Al Yiptar", 72, 10],
  [2, 6, "HaKorei Me'omeif", 78, 11],
  [2, 7, "Ba'al Keri", 82, 12],
  [2, 8, "Hazan", 86, 13],
  // Perek 3
  [3, 1, "Mi SheMetо Mutal", 92, 14],
  [3, 2, "Nashim VaAvadim", 98, 15],
  [3, 3, "HaZav", 102, 16],
  [3, 4, "Ba'al Keri", 104, 17],
  [3, 5, "Choleh", 106, 18],
  [3, 6, "B'Emes Amru", 110, 19],
  // Perek 4
  [4, 1, "Tefillas HaShachar", 114, 20],
  [4, 2, "Rabban Gamliel", 118, 21],
  [4, 3, "Rabbi Yehoshua", 122, 22],
  [4, 4, "Rabbi Eliezer", 126, 23],
  [4, 5, "Rabbi Nechunya", 132, 24],
  [4, 6, "Rabbi Elazar", 136, 25],
  [4, 7, "B'nei Yehudah", 138, 26],
  // Perek 5
  [5, 1, "Ein Omdin", 144, 27],
  [5, 2, "HaMafkid", 150, 28],
  [5, 3, "HaMotzi", 156, 29],
  [5, 4, "Kohen Gadol", 162, 30],
  [5, 5, "Ein Omdin LeHispallel", 166, 31],
  // Perek 6
  [6, 1, "Keitzad Mevarchain", 174, 32],
  [6, 2, "Al Peiros HaEtz", 180, 33],
  [6, 3, "Al Davar SheEin", 184, 34],
  [6, 4, "SheHakol", 190, 35],
  [6, 5, "HaYayin", 192, 36],
  [6, 6, "B'Makom SheAmar", 196, 37],
  [6, 7, "Im Hamar", 202, 38],
  [6, 8, "Achlu Ugeshu", 206, 39],
  // Perek 7
  [7, 1, "Shelosha SheAchlu", 212, 40],
  [7, 2, "Nashim VaAvadim VaKatanim", 216, 41],
  [7, 3, "HaZimun", 218, 42],
  [7, 4, "Shelosha SheAchlu K'Echad", 232, 43],
  [7, 5, "Shtei Chavuros", 236, 44],
  // Perek 8
  [8, 1, "Beis Shammai Omrim", 242, 45],
  [8, 2, "Beis Shammai Omrim Al HaEsh", 246, 46],
  [8, 3, "Beis Shammai Omrim Mevarchin", 248, 47],
  [8, 4, "Beis Shammai Omrim HaMavdil", 250, 48],
  [8, 5, "HaNer VeHaBsamim", 252, 49],
  [8, 6, "Mi SheBa", 256, 50],
  [8, 7, "Asur LeAdam", 260, 51],
  [8, 8, "HaMevarech", 264, 52],
  // Perek 9
  [9, 1, "HaRo'eh", 272, 53],
  [9, 2, "Al Kol Tzarah", 276, 54],
  [9, 3, "HaBa Min HaDerech", 284, 55],
  [9, 4, "HaNichnas LeKrach", 288, 56],
  [9, 5, "Chayav Adam", 290, 57],
];

async function seed() {
  console.log("Seeding chapters...");
  const insertedChapters = await db
    .insert(chapters)
    .values(CHAPTERS)
    .onConflictDoNothing()
    .returning();
  console.log(`  Inserted ${insertedChapters.length} chapters`);

  // Build chapter number → id map
  const allChapters = await db.select().from(chapters);
  const chapterMap = new Map(allChapters.map((c) => [c.number, c.id]));

  console.log("Seeding mishnayos...");
  const mishnahRows = MISHNAYOS.map(([chapterNum, num, title, pdfStartPage, order]) => ({
    chapterId: chapterMap.get(chapterNum)!,
    number: num,
    title,
    pdfStartPage,
    order,
  }));

  const inserted = await db
    .insert(mishnayos)
    .values(mishnahRows)
    .onConflictDoNothing()
    .returning();
  console.log(`  Inserted ${inserted.length} mishnayos`);
  console.log("Done!");
}

seed().catch(console.error);
