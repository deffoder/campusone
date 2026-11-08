import React, { useState, useEffect } from "react";
import { adminApi, ClassItem } from "../../api";
import {
  Layers,
  Building2,
  BookOpen,
  Calendar,
  Plus,
  Users,
  X,
  CheckCircle2,
} from "lucide-react";

export const AcademicStructure: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"departments" | "subjects" | "classes">("departments");
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [deptModal, setDeptModal] = useState(false);
  const [subjModal, setSubjModal] = useState(false);
  const [classModal, setClassModal] = useState(false);

  // Dept Form
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Subj Form
  const [subjName, setSubjName] = useState("");
  const [subjCode, setSubjCode] = useState("");
  const [subjDeptId, setSubjDeptId] = useState<number | "">("");
  const [subjSem, setSubjSem] = useState(1);
  const [subjCredits, setSubjCredits] = useState(3);

  // Class Form
  const [classSubjId, setClassSubjId] = useState<number | "">("");
  const [classFacId, setClassFacId] = useState<number | "">("");
  const [classSection, setClassSection] = useState("A");

  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [dList, sList, cList, fList] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getSubjects(),
        adminApi.getClasses(),
        adminApi.getFaculty(),
      ]);
      setDepartments(dList);
      setSubjects(sList);
      setClasses(cList);
      setFaculty(fList);

      if (dList.length > 0 && !subjDeptId) setSubjDeptId(dList[0].id);
      if (sList.length > 0 && !classSubjId) setClassSubjId(sList[0].id);
      if (fList.length > 0 && !classFacId) setClassFacId(fList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createDepartment({ name: deptName, code: deptCode });
      setFeedback(`Department ${deptCode} created.`);
      setDeptModal(false);
      setDeptName("");
      setDeptCode("");
      fetchAll();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create department");
    }
  };

  const handleCreateSubj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjDeptId) return;
    try {
      await adminApi.createSubject({
        name: subjName,
        code: subjCode,
        department_id: Number(subjDeptId),
        semester: Number(subjSem),
        credits: Number(subjCredits),
      });
      setFeedback(`Subject ${subjCode} created.`);
      setSubjModal(false);
      setSubjName("");
      setSubjCode("");
      fetchAll();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create subject");
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classSubjId || !classFacId) return;
    try {
      await adminApi.createClass({
        subject_id: Number(classSubjId),
        faculty_id: Number(classFacId),
        section: classSection,
        semester: 4,
        academic_year: "2026-2027",
      });
      setFeedback("Class section created and assigned to faculty!");
      setClassModal(false);
      fetchAll();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create class");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-campus-navy">Academic Structure</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Configure institutional departments, curriculum courses, and assigned class sections
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "departments" && (
            <button
              onClick={() => setDeptModal(true)}
              className="px-4 py-2 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          )}
          {activeTab === "subjects" && (
            <button
              onClick={() => setSubjModal(true)}
              className="px-4 py-2 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          )}
          {activeTab === "classes" && (
            <button
              onClick={() => setClassModal(true)}
              className="px-4 py-2 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-campus-border pb-2">
        <button
          onClick={() => setActiveTab("departments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "departments"
              ? "bg-campus-blue text-white shadow-sm"
              : "bg-white text-campus-muted hover:text-campus-navy border border-campus-border"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "subjects"
              ? "bg-campus-blue text-white shadow-sm"
              : "bg-white text-campus-muted hover:text-campus-navy border border-campus-border"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "classes"
              ? "bg-campus-blue text-white shadow-sm"
              : "bg-white text-campus-muted hover:text-campus-navy border border-campus-border"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Classes ({classes.length})</span>
        </button>
      </div>

      {/* Tab 1: Departments Table */}
      {activeTab === "departments" && (
        <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-6">Code</th>
                <th className="py-3 px-6">Department Name</th>
                <th className="py-3 px-6">Students Count</th>
                <th className="py-3 px-6">Faculty Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campus-border/60">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-campus-light/30 transition">
                  <td className="py-3.5 px-6 font-bold text-campus-blue">{d.code}</td>
                  <td className="py-3.5 px-6 font-semibold text-campus-navy">{d.name}</td>
                  <td className="py-3.5 px-6 text-campus-muted">{d.students_count} Scholars</td>
                  <td className="py-3.5 px-6 text-campus-muted">{d.faculty_count} Members</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Subjects Table */}
      {activeTab === "subjects" && (
        <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-6">Subject Code</th>
                <th className="py-3 px-6">Subject Title</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Semester</th>
                <th className="py-3 px-6">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campus-border/60">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-campus-light/30 transition">
                  <td className="py-3.5 px-6 font-bold text-campus-blue">{s.code}</td>
                  <td className="py-3.5 px-6 font-semibold text-campus-navy">{s.name}</td>
                  <td className="py-3.5 px-6 text-campus-muted">{s.department_name}</td>
                  <td className="py-3.5 px-6 text-campus-muted">Semester {s.semester}</td>
                  <td className="py-3.5 px-6 text-campus-muted">{s.credits} Credits</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Classes Table */}
      {activeTab === "classes" && (
        <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-6">Subject</th>
                <th className="py-3 px-6">Section</th>
                <th className="py-3 px-6">Assigned Instructor</th>
                <th className="py-3 px-6">Enrolled Students</th>
                <th className="py-3 px-6">Academic Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campus-border/60">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-campus-light/30 transition">
                  <td className="py-3.5 px-6">
                    <span className="font-bold text-campus-navy block">{c.subject_name}</span>
                    <span className="text-[10px] text-campus-muted">{c.subject_code}</span>
                  </td>
                  <td className="py-3.5 px-6 font-bold text-campus-blue">Section {c.section}</td>
                  <td className="py-3.5 px-6 font-semibold text-campus-navy">{c.faculty_name}</td>
                  <td className="py-3.5 px-6 text-campus-muted">{c.enrolled_count} Students</td>
                  <td className="py-3.5 px-6 text-campus-muted">{c.academic_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dept Modal */}
      {deptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-campus-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border">
              <h3 className="text-sm font-bold text-campus-navy">Create Department</h3>
              <button onClick={() => setDeptModal(false)} className="text-campus-muted hover:text-campus-navy">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDept} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Mechanical Engineering"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. MECH"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20 uppercase"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeptModal(false)}
                  className="px-4 py-2 font-semibold text-campus-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-campus-blue text-white font-bold rounded-xl shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {subjModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-campus-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border">
              <h3 className="text-sm font-bold text-campus-navy">Create Subject Course</h3>
              <button onClick={() => setSubjModal(false)} className="text-campus-muted hover:text-campus-navy">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubj} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                  placeholder="e.g. CS401"
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Department</label>
                <select
                  value={subjDeptId}
                  onChange={(e) => setSubjDeptId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl"
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
                    value={subjSem}
                    onChange={(e) => setSubjSem(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-campus-navy mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={subjCredits}
                    onChange={(e) => setSubjCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubjModal(false)}
                  className="px-4 py-2 font-semibold text-campus-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-campus-blue text-white font-bold rounded-xl shadow-md"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {classModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-campus-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border">
              <h3 className="text-sm font-bold text-campus-navy">Create Class & Section</h3>
              <button onClick={() => setClassModal(false)} className="text-campus-muted hover:text-campus-navy">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Subject</label>
                <select
                  value={classSubjId}
                  onChange={(e) => setClassSubjId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Instructor Faculty</label>
                <select
                  value={classFacId}
                  onChange={(e) => setClassFacId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.employee_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-campus-navy mb-1">Section</label>
                <input
                  type="text"
                  required
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClassModal(false)}
                  className="px-4 py-2 font-semibold text-campus-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-campus-blue text-white font-bold rounded-xl shadow-md"
                >
                  Assign Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
