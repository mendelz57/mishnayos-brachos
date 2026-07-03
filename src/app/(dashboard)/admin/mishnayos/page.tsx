"use client";
import { useEffect, useState } from "react";

type Chapter = { id: number; number: number; title: string };
type Mishnah = {
  mishnah: {
    id: number; chapterId: number; number: number; title: string;
    hebrewText: string | null; englishSummary: string | null;
    youtubeVideoId: string | null; pdfStartPage: number | null; order: number;
  };
  chapter: Chapter | null;
};

const emptyForm = { chapterId: "", number: "", title: "", hebrewText: "", englishSummary: "", youtubeVideoId: "", pdfStartPage: "", order: "" };

export default function MishnayosAdmin() {
  const [rows, setRows] = useState<Mishnah[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterChapter, setFilterChapter] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [m, c] = await Promise.all([
      fetch("/api/admin/mishnayos").then((r) => r.json()),
      fetch("/api/admin/chapters").then((r) => r.json()),
    ]);
    setRows(m);
    setChapters(c);
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startEdit(row: Mishnah) {
    setEditing(row.mishnah.id);
    setForm({
      chapterId: String(row.mishnah.chapterId),
      number: String(row.mishnah.number),
      title: row.mishnah.title,
      hebrewText: row.mishnah.hebrewText || "",
      englishSummary: row.mishnah.englishSummary || "",
      youtubeVideoId: row.mishnah.youtubeVideoId || "",
      pdfStartPage: row.mishnah.pdfStartPage != null ? String(row.mishnah.pdfStartPage) : "",
      order: String(row.mishnah.order),
    });
  }

  async function save() {
    setLoading(true);
    const body = {
      chapterId: parseInt(form.chapterId),
      number: parseInt(form.number),
      title: form.title,
      hebrewText: form.hebrewText || null,
      englishSummary: form.englishSummary || null,
      youtubeVideoId: form.youtubeVideoId || null,
      pdfStartPage: form.pdfStartPage ? parseInt(form.pdfStartPage) : null,
      order: parseInt(form.order),
      ...(editing !== null ? { id: editing } : {}),
    };
    await fetch("/api/admin/mishnayos", {
      method: editing !== null ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setForm(emptyForm);
    setEditing(null);
    await load();
    setLoading(false);
  }

  async function remove(id: number) {
    if (!confirm("Delete this mishnah?")) return;
    await fetch("/api/admin/mishnayos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  const filtered = filterChapter
    ? rows.filter((r) => String(r.mishnah.chapterId) === filterChapter)
    : rows;

  const showForm = editing !== null || Object.values(form).some(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mishnayos</h1>
        <button onClick={startAdd} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          + Add Mishnah
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">{editing !== null ? "Edit Mishnah" : "New Mishnah"}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter (Perek)</label>
              <select
                value={form.chapterId}
                onChange={(e) => setForm((f) => ({ ...f, chapterId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select chapter...</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>Perek {c.number} — {c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mishnah Number</label>
              <input type="number" min={1} value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input type="number" min={1} value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video ID</label>
              <input type="text" value={form.youtubeVideoId}
                onChange={(e) => setForm((f) => ({ ...f, youtubeVideoId: e.target.value }))}
                placeholder="e.g. dQw4w9WgXcQ (part after ?v=)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF Start Page</label>
              <input type="number" min={1} value={form.pdfStartPage}
                onChange={(e) => setForm((f) => ({ ...f, pdfStartPage: e.target.value }))}
                placeholder="e.g. 10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hebrew Text (optional)</label>
              <textarea value={form.hebrewText} rows={3} dir="rtl"
                onChange={(e) => setForm((f) => ({ ...f, hebrewText: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-hebrew text-right" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">English Summary (optional)</label>
              <textarea value={form.englishSummary} rows={3}
                onChange={(e) => setForm((f) => ({ ...f, englishSummary: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading || !form.title || !form.chapterId} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setForm(emptyForm); setEditing(null); }} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <select value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>Perek {c.number} — {c.title}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Perek</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mishnah</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Video</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PDF Page</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.mishnah.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-blue-700 font-medium">{row.chapter?.number ?? "?"}</td>
                <td className="px-4 py-3">{row.mishnah.number}</td>
                <td className="px-4 py-3 font-medium">{row.mishnah.title}</td>
                <td className="px-4 py-3">
                  {row.mishnah.youtubeVideoId
                    ? <span className="text-green-600 font-medium">✓ Set</span>
                    : <span className="text-red-400">— Missing</span>}
                </td>
                <td className="px-4 py-3 font-variant-numeric tabular-nums text-sm">
                  {row.mishnah.pdfStartPage != null
                    ? <span className="text-green-600 font-medium">p. {row.mishnah.pdfStartPage}</span>
                    : <span className="text-red-400">— Missing</span>}
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => startEdit(row)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(row.mishnah.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No mishnayos yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
