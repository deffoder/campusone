import React, { useState, useEffect } from "react";
import { adminApi } from "../../api";
import { GraduationCap, UserPlus, Search, X, CheckCircle2 } from "lucide-react";

export const FacultyManagement: React.FC = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deptId, setDeptId] = useState<number | "">("");
  const [role, setRole] = useState("faculty");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [facList, deptList] = await Promise.all([
        adminApi.getFaculty(),
        adminApi.getDepartments(),
      ]);
      setFaculty(facList);
      setDepartments(deptList);
      if (deptList.length > 0 && !deptId) {
        setDeptId(deptList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId) return;
    setSubmitting(true);
    try {
      await adminApi.createFaculty({
        email,
        password,
        role,
        name,
        employee_id: employeeId,
        department_id: Number(deptId),
      });
      setFeedback(`Faculty member ${name} created successfully!`);
      setModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setEmployeeId("");
      fetchData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create faculty member.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-campus-navy">Faculty & Staff Directory</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Instructors, course coordinators, and departmental leadership
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/20 flex items-center gap-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-6">Employee ID</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-campus-light/30 transition">
                    <td className="py-3.5 px-6 font-bold text-campus-blue">{f.employee_id}</td>
                    <td className="py-3.5 px-6 font-semibold text-campus-navy">{f.name}</td>
                    <td className="py-3.5 px-6 text-campus-muted">{f.department_name}</td>
                    <td className="py-3.5 px-6 text-campus-muted">{f.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Faculty Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-campus-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border">
              <h3 className="text-sm font-bold text-campus-navy">Add Faculty Profile</h3>
              <button onClick={() => setModalOpen(false)} className="text-campus-muted hover:text-campus-navy">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prof. Alan Turing"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. FAC-CS-105"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Department</label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Role Permission</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                >
                  <option value="faculty">Faculty Instructor</option>
                  <option value="hod">Head of Department (HOD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alan.t@campusone.edu"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-campus-muted hover:text-campus-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-campus-blue hover:bg-campus-dark text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
