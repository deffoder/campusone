import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { facultyApi, ClassItem } from "../../api";
import { BookOpen, Users, CalendarCheck, Search, ChevronRight } from "lucide-react";

export const MyClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await facultyApi.getClasses();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    const fetchRoster = async () => {
      setRosterLoading(true);
      try {
        const data = await facultyApi.getClassStudents(selectedClassId);
        setClassDetails(data);
      } catch (err) {
        console.error(err);
      } finally {
        setRosterLoading(false);
      }
    };
    fetchRoster();
  }, [selectedClassId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredStudents = classDetails?.students?.filter((s: any) => {
    if (!searchStudent) return true;
    const q = searchStudent.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.reg_number.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-campus-navy">My Teaching Classes & Rosters</h2>
        <p className="text-xs text-campus-muted mt-0.5">
          Review course allocations and enrolled student directory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Classes List (Sidebar / Cards) */}
        <div className="lg:col-span-4 space-y-3">
          {classes.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-white border-campus-blue shadow-md ring-2 ring-campus-blue/10"
                    : "bg-white border-campus-border hover:border-campus-blue/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-campus-blue">
                      {cls.subject_code}
                    </span>
                    <span className="text-xs font-semibold text-campus-muted">Sec {cls.section}</span>
                  </div>
                  <h4 className="text-sm font-bold text-campus-navy mt-1">{cls.subject_name}</h4>
                  <p className="text-xs text-campus-muted mt-0.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cls.enrolled_count} Enrolled Students</span>
                  </p>
                </div>

                <ChevronRight
                  className={`w-5 h-5 ${isSelected ? "text-campus-blue" : "text-campus-muted/50"}`}
                />
              </div>
            );
          })}
        </div>

        {/* Student Roster Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-campus-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-campus-light/30">
            <div>
              <span className="text-[10px] uppercase font-bold text-campus-blue tracking-wider">
                Enrolled Class Roster
              </span>
              <h3 className="text-base font-bold text-campus-navy mt-0.5">
                {classDetails?.subject_name} ({classDetails?.subject_code}) - Sec {classDetails?.section}
              </h3>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-campus-muted absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter student..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                />
              </div>

              {selectedClassId && (
                <Link
                  to={`/faculty/attendance?classId=${selectedClassId}`}
                  className="px-3.5 py-1.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition whitespace-nowrap"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Start Attendance</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {rosterLoading ? (
              <div className="p-12 text-center flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-xs text-campus-muted">
                No students enrolled or found matching search.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-3 px-6">Reg Number</th>
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Semester</th>
                    <th className="py-3 px-6">Section</th>
                    <th className="py-3 px-6">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-campus-border/60">
                  {filteredStudents.map((st: any) => (
                    <tr key={st.id} className="hover:bg-campus-light/30 transition">
                      <td className="py-3.5 px-6 font-bold text-campus-blue">{st.reg_number}</td>
                      <td className="py-3.5 px-6 font-semibold text-campus-navy">{st.name}</td>
                      <td className="py-3.5 px-6 text-campus-muted">Semester {st.semester}</td>
                      <td className="py-3.5 px-6 text-campus-muted">Section {st.section}</td>
                      <td className="py-3.5 px-6 text-campus-muted">{st.email || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
