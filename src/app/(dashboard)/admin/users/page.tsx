"use client";
import { useEffect, useState } from "react";

type User = { id: number; name: string; email: string; role: string; createdAt: string };

const ROLE_COLORS: Record<string, string> = {
  student: "bg-green-100 text-green-700",
  teacher: "bg-blue-100 text-blue-700",
  parent: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  }, []);

  const filtered = filter ? users.filter((u) => u.role === filter) : users;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex gap-2 mb-6">
        {["", "student", "teacher", "parent", "admin"].map((r) => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition capitalize ${
              filter === r ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}>
            {r || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[u.role] || ""}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
