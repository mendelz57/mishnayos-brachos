"use client";
import { useEffect, useState } from "react";

type Chapter = { id: number; number: number; title: string };
type MishnayosRow = { mishnah: { id: number; number: number; title: string; chapterId: number }; chapter: Chapter | null };
type Flashcard = { id: number; mishnayosId: number; front: string; back: string; order: number };

export default function FlashcardsAdmin() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mishnayosList, setMishnayosList] = useState<MishnayosRow[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [filterChapter, setFilterChapter] = useState("");
  const [filterMishnayos, setFilterMishnayos] = useState("");
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ mishnayosId: "", front: "", back: "", order: "0" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const [c, m] = await Promise.all([
      fetch("/api/admin/chapters").then((r) => r.json()),
      fetch("/api/admin/mishnayos").then((r) => r.json()),
    ]);
    setChapters(c);
    setMishnayosList(m);
  }

  async function loadCards(mishnayosId: string) {
    if (!mishnayosId) { setCards([]); return; }
    const data = await fetch(`/api/admin/flashcards?mishnayosId=${mishnayosId}`).then((r) => r.json());
    setCards(data);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadCards(filterMishnayos); }, [filterMishnayos]);

  const filteredMishnayos = filterChapter
    ? mishnayosList.filter((m) => String(m.mishnah.chapterId) === filterChapter)
    : mishnayosList;

  async function save() {
    setLoading(true);
    const body = {
      mishnayosId: parseInt(form.mishnayosId),
      front: form.front,
      back: form.back,
      order: parseInt(form.order),
      ...(editing ? { id: editing.id } : {}),
    };
    await fetch("/api/admin/flashcards", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditing(null);
    setForm({ mishnayosId: filterMishnayos, front: "", back: "", order: "0" });
    await loadCards(filterMishnayos);
    setLoading(false);
  }

  async function remove(id: number) {
    if (!confirm("Delete this flashcard?")) return;
    await fetch("/api/admin/flashcards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadCards(filterMishnayos);
  }

  function startEdit(card: Flashcard) {
    setEditing(card);
    setForm({ mishnayosId: String(card.mishnayosId), front: card.front, back: card.back, order: String(card.order) });
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm((f) => ({ ...f, mishnayosId: filterMishnayos, front: "", back: "" })); }}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          + Add Flashcard
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
          <h2 className="font-semibold text-gray-800 mb-4">{editing ? "Edit Flashcard" : "New Flashcard"}</h2>
          <div className="space-y-4 mb-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Front (Question)</label>
                <textarea value={form.front} rows={3}
                  onChange={(e) => setForm((f) => ({ ...f, front: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Back (Answer)</label>
                <textarea value={form.back} rows={3}
                  onChange={(e) => setForm((f) => ({ ...f, back: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input type="number" value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading || !form.front || !form.back || !form.mishnayosId}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="mb-3">
              <div className="text-xs text-gray-400 font-medium uppercase mb-1">Front</div>
              <div className="text-gray-900">{card.front}</div>
            </div>
            <div className="border-t border-dashed border-gray-200 pt-3">
              <div className="text-xs text-gray-400 font-medium uppercase mb-1">Back</div>
              <div className="text-gray-700">{card.back}</div>
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => startEdit(card)} className="text-blue-600 text-sm hover:underline">Edit</button>
              <button onClick={() => remove(card.id)} className="text-red-500 text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {filterMishnayos && cards.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-8">No flashcards yet for this mishnah.</p>
        )}
        {!filterMishnayos && (
          <p className="col-span-3 text-center text-gray-400 py-8">Select a mishnah above to view its flashcards.</p>
        )}
      </div>
    </div>
  );
}
