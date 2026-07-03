import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { classes, classEnrollments, users, studentProgress, mishnayos } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "teacher") redirect("/");

  const teacherId = parseInt(session.user!.id!);
  const myClasses = await db.select().from(classes).where(eq(classes.teacherId, teacherId));

  const allMishnayos = await db.select().from(mishnayos).orderBy(mishnayos.order);

  const classData = await Promise.all(
    myClasses.map(async (cls) => {
      const enrollments = await db
        .select({ student: users })
        .from(classEnrollments)
        .leftJoin(users, eq(classEnrollments.studentId, users.id))
        .where(eq(classEnrollments.classId, cls.id));

      const studentStats = await Promise.all(
        enrollments.map(async ({ student }) => {
          if (!student) return null;
          const progress = await db
            .select()
            .from(studentProgress)
            .where(eq(studentProgress.studentId, student.id));
          const completed = progress.filter((p) => p.completed).length;
          return { student, completed, total: allMishnayos.length };
        })
      );

      return { cls, students: studentStats.filter(Boolean) };
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <Link href="/teacher/classes" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
          Manage Classes
        </Link>
      </div>

      {classData.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <p className="mb-4">You don&apos;t have any classes yet.</p>
          <Link href="/teacher/classes" className="text-blue-700 hover:underline font-medium">Create a class →</Link>
        </div>
      )}

      {classData.map(({ cls, students }) => (
        <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{cls.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Class code: <span className="font-mono font-bold text-blue-700">{cls.classCode}</span>
                {" "}— share this with students to join
              </p>
            </div>
            <span className="text-sm text-gray-500">{students.length} student{students.length !== 1 ? "s" : ""}</span>
          </div>

          {students.length === 0 ? (
            <div className="px-6 py-6 text-gray-400 text-sm">No students enrolled yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Progress</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => s && (
                  <tr key={s.student.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{s.student.name}</td>
                    <td className="px-6 py-3 text-gray-500">{s.student.email}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-32 overflow-hidden">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${s.total > 0 ? (s.completed / s.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-gray-600">{s.completed}/{s.total}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/teacher/student/${s.student.id}`} className="text-blue-600 hover:underline text-sm">
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
