"use client";
import { useEffect, useState } from "react";

type Chapter = { id: number; number: number; title: string; description: string | null };

export default function ChaptersAdmin() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [form, setForm] = useState({ number: "", title: "", description: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/chapters");
    setChapters(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setEditing(null);
    setForm({ number: "", title: "", description: "" });
  }

  function startEdit(c: Chapter) {
    setEditing(c);
    setForm({ number: String(c.number), title: c.title, description: c.description || "" });
  }

  async function save() {
    setLoading(true);
    const body = { ...form, number: parseInt(form.number), ...(editing ? { id: editing.id } : {}) };
    await fetch("/api/admin/chapters", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setForm({ number: "", title: "", description: "" });
    setEditing(null);
    await load();
    setLoading(false);
  }

  async function remove(id: number) {
    if (!confirm("Delete this chapter?")) return;
    await fetch("/api/admin/chapters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chapters (Perakim)</h1>
        <button onClick={startAdd} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          + Add Chapter
        </button>
      </div>

      {(editing !== undefined || form.number) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">{editing ? "Edit Chapter" : "New Chapter"}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perek Number</label>
              <input
                type="number"
                min={1}
                max={9}
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Perek Aleph"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={loading || !form.title || !form.number} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setForm({ number: "", title: "", description: "" })} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Perek</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-blue-700">{c.number}</td>
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3 text-gray-500">{c.description || "—"}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(c.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {chapters.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No chapters yet. Add the 9 perakim above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
