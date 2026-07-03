"use client";
import { useEffect, useState } from "react";

type Chapter = { id: number; number: number; title: string };
type MishnayosRow = { mishnah: { id: number; number: number; title: string; chapterId: number }; chapter: Chapter | null };
type Option = { text: string; isCorrect: boolean };
type Question = {
  id: number; mishnayosId: number; type: string; questionText: string; order: number;
  options: { id: number; text: string; isCorrect: boolean }[];
  pairs: { id: number; leftText: string; rightText: string }[];
};

export default function QuestionsAdmin() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mishnayosList, setMishnayosList] = useState<MishnayosRow[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filterMishnayos, setFilterMishnayos] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    mishnayosId: "",
    type: "multiple_choice" as "multiple_choice",
    questionText: "",
    order: "0",
  });
  const [options, setOptions] = useState<Option[]>([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  async function load() {
    const [c, m] = await Promise.all([
      fetch("/api/admin/chapters").then((r) => r.json()),
      fetch("/api/admin/mishnayos").then((r) => r.json()),
    ]);
    setChapters(c);
    setMishnayosList(m);
  }

  async function loadQuestions(mishnayosId: string) {
    if (!mishnayosId) { setQuestions([]); return; }
    const q = await fetch(`/api/admin/questions?mishnayosId=${mishnayosId}`).then((r) => r.json());
    setQuestions(q);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadQuestions(filterMishnayos); }, [filterMishnayos]);

  const filteredMishnayos = filterChapter
    ? mishnayosList.filter((m) => String(m.mishnah.chapterId) === filterChapter)
    : mishnayosList;

  async function save() {
    setLoading(true);
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mishnayosId: parseInt(form.mishnayosId),
        type: "multiple_choice",
        questionText: form.questionText,
        order: parseInt(form.order),
        options,
        pairs: [],
      }),
    });

    setShowForm(false);
    setForm({ mishnayosId: filterMishnayos, type: "multiple_choice", questionText: "", order: "0" });
    await loadQuestions(filterMishnayos);
    setLoading(false);
  }

  async function remove(id: number) {
    if (!confirm("Delete this question?")) return;
    await fetch("/api/admin/questions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadQuestions(filterMishnayos);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
        <button onClick={() => { setShowForm(true); setForm((f) => ({ ...f, mishnayosId: filterMishnayos })); }}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          + Add Question
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={filterChapter} onChange={(e) => { setFilterChapter(e.target.value); setFilterMishnayos(""); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All chapters</option>
          {chapters.map((c) => <option key={c.id} value={c.id}>Perek {c.number} — {c.title}</option>)}
        </select>
        <select value={filterMishnayos} onChange={(e) => setFilterMishnayos(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select mishnah...</option>
          {filteredMishnayos.map((m) => (
            <option key={m.mishnah.id} value={m.mishnah.id}>
              Perek {m.chapter?.number} Mishnah {m.mishnah.number} — {m.mishnah.title}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">New Question</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mishnah</label>
              <select value={form.mishnayosId} onChange={(e) => setForm((f) => ({ ...f, mishnayosId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select...</option>
                {mishnayosList.map((m) => (
                  <option key={m.mishnah.id} value={m.mishnah.id}>
                    P{m.chapter?.number}:M{m.mishnah.number} — {m.mishnah.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
              <textarea value={form.questionText} rows={2}
                onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options (check the correct one)</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input type="radio" checked={opt.isCorrect} onChange={() =>
                  setOptions(options.map((o, j) => ({ ...o, isCorrect: j === i })))}
                  className="mt-1" />
                <input type="text" value={opt.text} placeholder={`Option ${i + 1}`}
                  onChange={(e) => setOptions(options.map((o, j) => j === i ? { ...o, text: e.target.value } : o))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={loading || !form.questionText || !form.mishnayosId}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? "Saving..." : "Save Question"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-full mr-2">
                  {q.type.replace("_", " ")}
                </span>
                <span className="font-medium text-gray-900">{q.questionText}</span>
              </div>
              <button onClick={() => remove(q.id)} className="text-red-500 hover:underline text-sm ml-4 shrink-0">Delete</button>
            </div>
            {q.options.length > 0 && (
              <ul className="mt-2 space-y-1">
                {q.options.map((o) => (
                  <li key={o.id} className={`text-sm pl-2 ${o.isCorrect ? "text-green-700 font-medium" : "text-gray-500"}`}>
                    {o.isCorrect ? "✓ " : "• "}{o.text}
                  </li>
                ))}
              </ul>
            )}
            {q.pairs.length > 0 && (
              <ul className="mt-2 space-y-1">
                {q.pairs.map((p) => (
                  <li key={p.id} className="text-sm text-gray-600 pl-2">{p.leftText} ↔ {p.rightText}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {filterMishnayos && questions.length === 0 && (
          <p className="text-center text-gray-400 py-8">No questions yet for this mishnah.</p>
        )}
        {!filterMishnayos && (
          <p className="text-center text-gray-400 py-8">Select a mishnah above to view its questions.</p>
        )}
      </div>
    </div>
  );
}
