import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi, analyticsApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  GraduationCap,
  Building2,
  CalendarCheck2,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashStats, analData] = await Promise.all([
          adminApi.getDashboardStats(),
          analyticsApi.getOverview(),
        ]);
        setStats(dashStats);
        setAnalytics(analData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-campus-navy via-campus-dark to-campus-blue rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs uppercase font-bold text-blue-200 tracking-wider">
            {user?.role === "hod" ? "Department Management" : "Campus Administration"}
          </span>
          <h2 className="text-2xl font-black mt-1">
            {user?.role === "hod" ? "Department Overview" : "Campus Overview"}
          </h2>
          <p className="text-xs text-blue-100/90 mt-1">
            Logged in as <span className="font-semibold text-white">{user?.name}</span> ({user?.role?.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/audit"
            className="px-4 py-2.5 bg-white text-campus-navy hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition"
          >
            <ShieldCheck className="w-4 h-4 text-campus-blue" />
            <span>Verify Audit Trail</span>
          </Link>
          <Link
            to="/admin/analytics"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-sm transition"
          >
            Analytics Reports
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-campus-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-campus-muted uppercase">Total Students</span>
            <h3 className="text-3xl font-black text-campus-navy mt-1">{stats?.total_students}</h3>
            <span className="text-[11px] font-medium text-campus-muted">Enrolled Scholars</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-campus-blue flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Faculty */}
        <div className="bg-white p-5 rounded-2xl border border-campus-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-campus-muted uppercase">Faculty Members</span>
            <h3 className="text-3xl font-black text-campus-navy mt-1">{stats?.total_faculty}</h3>
            <span className="text-[11px] font-medium text-campus-muted">Instructors & HODs</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Critical Low Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-campus-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-campus-muted uppercase">Below 75% Risk</span>
            <h3 className="text-3xl font-black text-campus-danger mt-1">{stats?.critical_students_count}</h3>
            <span className="text-[11px] font-medium text-campus-muted">Students under threshold</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-campus-danger flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Critical Attention Table & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* At-Risk Students List */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-campus-navy flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-campus-danger" />
                  <span>High-Risk Attendance Alerts (&lt; 75%)</span>
                </h3>
                <p className="text-xs text-campus-muted mt-0.5">
                  Students currently in danger of exam debarment
                </p>
              </div>
              <Link
                to="/admin/students"
                className="text-xs font-bold text-campus-blue hover:underline flex items-center gap-1"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {analytics?.critical_students?.length === 0 ? (
                <div className="p-8 text-center text-xs text-campus-muted italic">
                  No students currently below the 75% attendance threshold.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-2.5 px-4">Reg Number</th>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-4">Dept</th>
                      <th className="py-2.5 px-4">Rate</th>
                      <th className="py-2.5 px-4">Attended / Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-campus-border/60">
                    {analytics?.critical_students?.map((s: any) => (
                      <tr key={s.student_id} className="hover:bg-red-50/30 transition">
                        <td className="py-3 px-4 font-bold text-campus-blue">{s.reg_number}</td>
                        <td className="py-3 px-4 font-semibold text-campus-navy">{s.name}</td>
                        <td className="py-3 px-4 text-campus-muted">{s.department}</td>
                        <td className="py-3 px-4 font-black text-red-600">{s.attendance_rate}%</td>
                        <td className="py-3 px-4 text-campus-muted">
                          {s.attended_classes} / {s.total_classes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Quick Administration Modules */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm">
            <h3 className="text-sm font-bold text-campus-navy mb-3">Management Consoles</h3>
            <div className="space-y-2">
              <Link
                to="/admin/students"
                className="p-3 rounded-2xl bg-campus-light hover:bg-blue-50 border border-campus-border flex items-center justify-between text-xs font-bold text-campus-navy transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-campus-blue" />
                  <span>Student Registry</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-campus-muted group-hover:text-campus-blue" />
              </Link>

              <Link
                to="/admin/faculty"
                className="p-3 rounded-2xl bg-campus-light hover:bg-blue-50 border border-campus-border flex items-center justify-between text-xs font-bold text-campus-navy transition group"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Faculty & HOD Directory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-campus-muted group-hover:text-purple-600" />
              </Link>

              <Link
                to="/admin/academic"
                className="p-3 rounded-2xl bg-campus-light hover:bg-blue-50 border border-campus-border flex items-center justify-between text-xs font-bold text-campus-navy transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Departments & Courses</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-campus-muted group-hover:text-emerald-600" />
              </Link>

              <Link
                to="/admin/audit"
                className="p-3 rounded-2xl bg-campus-light hover:bg-blue-50 border border-campus-border flex items-center justify-between text-xs font-bold text-campus-navy transition group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-campus-blue" />
                  <span>Cryptographic Audit Ledger</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-campus-muted group-hover:text-campus-blue" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
