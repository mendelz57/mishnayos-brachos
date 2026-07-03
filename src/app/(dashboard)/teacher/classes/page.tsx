"use client";
import { useEffect, useState } from "react";

type Class = { id: number; name: string; classCode: string };

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeacherClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/teacher/classes");
    setClasses(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!name) return;
    setLoading(true);
    await fetch("/api/teacher/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, classCode: generateCode() }),
    });
    setName("");
    await load();
    setLoading(false);
  }

  async function remove(id: number) {
    if (!confirm("Delete this class?")) return;
    await fetch("/api/teacher/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Classes</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Create New Class</h2>
        <div className="flex gap-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Class name (e.g. Grade 4 Boys)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={create} disabled={loading || !name}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50">
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{cls.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Class code:{" "}
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {cls.classCode}
                </span>
              </p>
            </div>
            <button onClick={() => remove(cls.id)} className="text-red-500 hover:underline text-sm">Delete</button>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="text-center text-gray-400 py-8">No classes yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}
