import React, { useState, useEffect } from "react";
import { adminApi } from "../../api";
import { Users, UserPlus, Search, X, CheckCircle2, AlertCircle } from "lucide-react";

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [deptId, setDeptId] = useState<number | "">("");
  const [semester, setSemester] = useState(1);
  const [section, setSection] = useState("A");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [stList, deptList] = await Promise.all([
        adminApi.getStudents(deptFilter ? Number(deptFilter) : undefined),
        adminApi.getDepartments(),
      ]);
      setStudents(stList);
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
  }, [deptFilter]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId) return;
    setSubmitting(true);
    try {
      await adminApi.createStudent({
        email,
        password,
        role: "student",
        name,
        reg_number: regNumber,
        department_id: Number(deptId),
        semester: Number(semester),
        section,
      });
      setFeedback(`Student ${name} successfully enrolled!`);
      setModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRegNumber("");
      fetchData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create student.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.reg_number.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-campus-navy">Student Registry</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Manage student enrollments, institutional profiles, and department assignments
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/20 flex items-center gap-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-campus-muted absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or reg number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3.5 py-2 text-xs bg-white border border-campus-border rounded-xl text-campus-navy focus:outline-none focus:ring-2 focus:ring-campus-blue/20 font-semibold"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} - {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-campus-muted">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-6">Reg Number</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Semester</th>
                  <th className="py-3 px-6">Section</th>
                  <th className="py-3 px-6">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-campus-light/30 transition">
                    <td className="py-3.5 px-6 font-bold text-campus-blue">{st.reg_number}</td>
                    <td className="py-3.5 px-6 font-semibold text-campus-navy">{st.name}</td>
                    <td className="py-3.5 px-6 text-campus-muted">{st.department_name}</td>
                    <td className="py-3.5 px-6 text-campus-muted">Sem {st.semester}</td>
                    <td className="py-3.5 px-6 text-campus-muted">Sec {st.section}</td>
                    <td className="py-3.5 px-6 text-campus-muted">{st.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-campus-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border">
              <h3 className="text-sm font-bold text-campus-navy">Register New Student</h3>
              <button onClick={() => setModalOpen(false)} className="text-campus-muted hover:text-campus-navy">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. RA241100301010"
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-campus-navy mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-campus-navy mb-1">Section</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Account Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. david.m@campusone.edu"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-campus-navy mb-1">Initial Password</label>
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
                  {submitting ? "Registering..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
