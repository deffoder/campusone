import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { studentApi, StudentDashboardStats } from "../../api";
import { BookOpen, AlertCircle, CheckCircle2, Calendar } from "lucide-react";

export const SubjectAttendance: React.FC = () => {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentApi.getDashboard();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-campus-navy">Subject-Wise Attendance</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Monitor course-level eligibility against the mandatory 75% attendance criterion
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats?.subjects.map((sub) => {
          const isSafe = sub.percentage >= 75;
          const isWarning = sub.percentage < 75 && sub.percentage >= 65;

          return (
            <div
              key={sub.subject_id}
              className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-campus-light border border-campus-border flex items-center justify-center text-campus-blue font-black text-xs">
                      {sub.subject_code.slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-campus-blue">{sub.subject_code}</span>
                      <h3 className="text-sm font-bold text-campus-navy leading-snug">{sub.subject_name}</h3>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                      isSafe
                        ? "bg-emerald-50 text-emerald-700"
                        : isWarning
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {isSafe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {sub.percentage}%
                  </span>
                </div>

                {/* Progress Bar with 75% marker */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-campus-muted font-medium">Attendance Progress</span>
                    <span className="font-bold text-campus-navy">
                      {sub.attended_classes} / {sub.total_classes} classes
                    </span>
                  </div>

                  <div className="relative w-full h-3 bg-campus-light rounded-full overflow-hidden border border-campus-border/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSafe ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    ></div>
                  </div>

                  {/* 75% threshold guide line */}
                  <div className="mt-1 flex items-center justify-between text-[10px] text-campus-muted">
                    <span>0%</span>
                    <span className="text-campus-blue font-semibold">Min 75% Target</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-campus-border flex items-center justify-between">
                <span className="text-xs text-campus-muted font-medium">
                  {isSafe
                    ? "Eligibility criteria met"
                    : `${Math.ceil((0.75 * sub.total_classes - sub.attended_classes) / 0.25)} consecutive classes needed`}
                </span>

                <Link
                  to={`/student/history?subject=${sub.subject_id}`}
                  className="px-3 py-1.5 text-xs font-bold text-campus-blue hover:bg-campus-light rounded-lg flex items-center gap-1.5 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Session Log</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
