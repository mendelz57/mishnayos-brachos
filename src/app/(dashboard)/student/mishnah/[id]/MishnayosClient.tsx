"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Mishnah = {
  id: number; chapterId: number; number: number; title: string;
  hebrewText: string | null; englishSummary: string | null; youtubeVideoId: string | null;
};
type Chapter = { id: number; number: number; title: string };
type Flashcard = { id: number; front: string; back: string };
type Option = { id: number; text: string; isCorrect: boolean };
type Pair = { id: number; leftText: string; rightText: string };
type Question = { id: number; type: string; questionText: string; options: Option[]; pairs: Pair[] };

type Props = {
  mishnah: Mishnah;
  chapter: Chapter;
  flashcards: Flashcard[];
  questions: Question[];
  studentId: number;
  alreadyCompleted: boolean;
  pdfStartPage: number | null;
};

type Tab = "video" | "flashcards" | "quiz";

export default function MishnayosClient({ mishnah, chapter, flashcards, questions, studentId, alreadyCompleted, pdfStartPage }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("video");

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [matchSelections, setMatchSelections] = useState<Record<number, Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function submitQuiz() {
    setSubmitting(true);
    let correct = 0;
    const answerPayload: { questionId: number; answer: string; isCorrect: boolean }[] = [];

    questions.forEach((q) => {
      let isCorrect = false;
      let studentAnswer = "";

      if (q.type === "multiple_choice") {
        studentAnswer = answers[q.id] || "";
        const correctOpt = q.options.find((o) => o.isCorrect);
        isCorrect = studentAnswer === String(correctOpt?.id);
      } else if (q.type === "fill_blank") {
        studentAnswer = answers[q.id] || "";
        const correctOpt = q.options.find((o) => o.isCorrect);
        isCorrect = studentAnswer.trim().toLowerCase() === correctOpt?.text.trim().toLowerCase();
      } else if (q.type === "matching") {
        const sel = matchSelections[q.id] || {};
        isCorrect = q.pairs.every((p) => sel[String(p.id)] === p.rightText);
        studentAnswer = JSON.stringify(sel);
      }

      if (isCorrect) correct++;
      answerPayload.push({ questionId: q.id, answer: studentAnswer, isCorrect });
    });

    const scoreVal = questions.length > 0 ? (correct / questions.length) * 100 : 100;
    setScore(scoreVal);

    await fetch("/api/student/submit-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        mishnayosId: mishnah.id,
        score: scoreVal,
        maxScore: 100,
        passed: scoreVal >= 70,
        answers: answerPayload,
      }),
    });

    setSubmitted(true);
    setSubmitting(false);

    if (scoreVal >= 70) {
      setTimeout(() => router.push("/student"), 3000);
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "video", label: "Video" },
    { key: "flashcards", label: `Flashcards (${flashcards.length})` },
    { key: "quiz", label: `Quiz (${questions.length})` },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">
          Perek {chapter.number} — {chapter.title}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mishnah {mishnah.number} — {mishnah.title}
        </h1>
        {alreadyCompleted && (
          <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
            ✓ Completed
          </span>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t.key ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "video" && (
        <div className="space-y-6">
          {mishnah.youtubeVideoId ? (
            <div className="aspect-video rounded-xl overflow-hidden shadow-md">
              <iframe
                src={`https://www.youtube.com/embed/${mishnah.youtubeVideoId}`}
                title={mishnah.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
              No video uploaded yet
            </div>
          )}

          {mishnah.hebrewText && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
              <h3 className="text-sm font-medium text-amber-800 mb-3">Hebrew Text</h3>
              <p className="text-xl leading-relaxed text-right font-serif" dir="rtl">
                {mishnah.hebrewText}
              </p>
            </div>
          )}

          {mishnah.englishSummary && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
              <p className="text-gray-700">{mishnah.englishSummary}</p>
            </div>
          )}

          {pdfStartPage && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">📄 Mishnah Text — Illustrated Sefer</h3>
                <a
                  href={`/brachos.pdf#page=${pdfStartPage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Open in new tab ↗
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100" style={{ height: "680px" }}>
                <iframe
                  src={`/brachos.pdf#page=${pdfStartPage}&toolbar=0&navpanes=0&scrollbar=1`}
                  title={`Mishnah text — Perek ${chapter.number} Mishnah ${mishnah.number}`}
                  className="w-full h-full"
                  style={{ border: "none" }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setTab("flashcards")}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition">
              Continue to Flashcards →
            </button>
          </div>
        </div>
      )}

      {tab === "flashcards" && (
        <div className="flex flex-col items-center">
          {flashcards.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-lg mb-4">No flashcards for this mishnah yet.</p>
              <button onClick={() => setTab("quiz")}
                className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition">
                Continue to Quiz →
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-4">
                {cardIndex + 1} / {flashcards.length}
              </div>
              <div
                onClick={() => setFlipped(!flipped)}
                className="w-full max-w-lg h-56 cursor-pointer perspective-1000"
              >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${flipped ? "rotate-y-180" : ""}`}
                  style={{ transformStyle: "preserve-3d", transition: "transform 0.5s" }}>
                  <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-md flex items-center justify-center p-6 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}>
                    <p className="text-xl text-center font-medium text-gray-900">{flashcards[cardIndex].front}</p>
                  </div>
                  <div className="absolute inset-0 bg-blue-700 rounded-2xl shadow-md flex items-center justify-center p-6"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <p className="text-xl text-center font-medium text-white">{flashcards[cardIndex].back}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-3">Click to flip</p>

              <div className="flex gap-4 mt-6">
                <button onClick={() => { setCardIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
                  disabled={cardIndex === 0}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
                  ← Previous
                </button>
                {cardIndex < flashcards.length - 1 ? (
                  <button onClick={() => { setCardIndex((i) => i + 1); setFlipped(false); }}
                    className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
                    Next →
                  </button>
                ) : (
                  <button onClick={() => setTab("quiz")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    Take Quiz →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "quiz" && (
        <div className="max-w-2xl">
          {questions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No quiz questions for this mishnah yet.</div>
          ) : submitted ? (
            <div className={`text-center py-12 rounded-2xl ${score >= 70 ? "bg-green-50" : "bg-red-50"}`}>
              <div className="text-5xl mb-4">{score >= 70 ? "🎉" : "📚"}</div>
              <h2 className="text-2xl font-bold mb-2">{score >= 70 ? "Great job!" : "Keep trying!"}</h2>
              <p className="text-gray-600 mb-4">You scored {Math.round(score)}%</p>
              {score >= 70 ? (
                <p className="text-green-700 font-medium">Next mishnah unlocked! Redirecting...</p>
              ) : (
                <button onClick={() => { setSubmitted(false); setAnswers({}); setMatchSelections({}); }}
                  className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition">
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qi) => (
                <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <p className="font-medium text-gray-900 mb-4">{qi + 1}. {q.questionText}</p>

                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            answers[q.id] === String(opt.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                          }`}>
                          <input type="radio" name={`q${q.id}`} value={String(opt.id)}
                            checked={answers[q.id] === String(opt.id)}
                            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                            className="text-blue-700" />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "fill_blank" && (
                    <input type="text" value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      placeholder="Type your answer..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}

                  {q.type === "matching" && (
                    <div className="space-y-2">
                      {q.pairs.map((p) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="w-40 text-sm font-medium text-gray-700 shrink-0">{p.leftText}</span>
                          <span className="text-gray-400">→</span>
                          <select
                            value={matchSelections[q.id]?.[String(p.id)] || ""}
                            onChange={(e) => setMatchSelections((m) => ({
                              ...m,
                              [q.id]: { ...(m[q.id] || {}), [String(p.id)]: e.target.value }
                            }))}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select match...</option>
                            {[...q.pairs].sort(() => Math.random() - 0.5).map((pair) => (
                              <option key={pair.id} value={pair.rightText}>{pair.rightText}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button onClick={submitQuiz} disabled={submitting}
                className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
