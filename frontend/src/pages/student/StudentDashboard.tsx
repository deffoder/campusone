import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { studentApi, StudentDashboardStats } from "../../api";
import { useAuth } from "../../context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  FileText,
  CalendarCheck,
  TrendingUp,
  BookOpen,
} from "lucide-react";

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await studentApi.getDashboard();
        setStats(data);
      } catch (err) {
        console.error("Failed to load student dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const chartData = [
    { name: "Attended", value: stats?.attended_classes || 0, color: "#10B981" },
    { name: "Absent", value: stats?.absent_classes || 0, color: "#EF4444" },
  ];

  const barData = stats?.subjects.map((s) => ({
    name: s.subject_code,
    percentage: s.percentage,
    full_name: s.subject_name,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-campus-blue to-campus-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-campus-blue/15">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
            Student Attendance Portal
          </span>
          <h2 className="text-2xl font-black mt-1">Hello, {user?.name}!</h2>
          <p className="text-xs text-blue-100/90 mt-1">
            Reg: <span className="font-semibold text-white">{user?.reg_number}</span> | Department:{" "}
            <span className="font-semibold text-white">{user?.department_name || "Engineering"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/student/qr"
            className="px-4 py-2.5 bg-white text-campus-blue hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Show QR Code</span>
          </Link>
          <Link
            to="/student/history"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-sm transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Attendance History</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <div className="bg-white p-5 rounded-2xl border border-campus-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-campus-muted uppercase">Overall Attendance</span>
            <h3
              className={`text-3xl font-black mt-1 ${
                (stats?.overall_percentage || 0) >= 75
                  ? "text-emerald-600"
                  : (stats?.overall_percentage || 0) >= 65
                  ? "text-amber-500"
                  : "text-red-600"
              }`}
            >
              {stats?.overall_percentage}%
            </h3>
            <span className="text-[11px] font-medium text-campus-muted">Target: 75% Institutional Threshold</span>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              (stats?.overall_percentage || 0) >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {(stats?.overall_percentage || 0) >= 75 ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* Classes Attended */}
        <div className="bg-white p-5 rounded-2xl border border-campus-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-campus-muted uppercase">Classes Attended</span>
            <h3 className="text-3xl font-black text-campus-navy mt-1">
              {stats?.attended_classes} <span className="text-sm font-medium text-campus-muted">/ {stats?.total_classes}</span>
            </h3>
            <span className="text-[11px] font-medium text-campus-muted">Conducted Lectures</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-campus-blue flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Absent */}
        <div className="bg-white p-5 rounded-2xl border border-campus-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-campus-muted uppercase">Absences</span>
            <h3 className="text-3xl font-black text-campus-danger mt-1">{stats?.absent_classes}</h3>
            <span className="text-[11px] font-medium text-campus-muted">Missed or unexcused</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-campus-danger flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Attendance Buffer / Needed */}
        <div className="bg-white p-5 rounded-2xl border border-campus-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-campus-muted uppercase">75% Requirement</span>
            <h3 className="text-3xl font-black text-campus-navy mt-1">
              {stats?.classes_needed_for_75 === 0 ? "Qualified" : `${stats?.classes_needed_for_75} More`}
            </h3>
            <span className="text-[11px] font-medium text-campus-muted">
              {stats?.classes_needed_for_75 === 0 ? "Eligible for final examinations" : "Consecutive classes needed"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Attendance Ratio */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-campus-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-campus-navy">Attendance Distribution</h3>
            <p className="text-xs text-campus-muted mt-0.5">Ratio of attended vs missed sessions</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-campus-navy">{stats?.overall_percentage}%</span>
              <span className="block text-[10px] text-campus-muted uppercase font-semibold">Attended</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-campus-border text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-campus-muted font-medium">Attended ({stats?.attended_classes})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-campus-muted font-medium">Absent ({stats?.absent_classes})</span>
            </div>
          </div>
        </div>

        {/* Subject-Wise Bar Comparison */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-campus-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-campus-navy">Subject Attendance Rates</h3>
              <p className="text-xs text-campus-muted mt-0.5">Percentages across enrolled courses</p>
            </div>
            <Link
              to="/student/subjects"
              className="text-xs font-semibold text-campus-blue hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <BookOpen className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#172554",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val}%`, "Attendance Rate"]}
                />
                <Bar dataKey="percentage" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-campus-border grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stats?.subjects.map((sub) => (
              <div key={sub.subject_id} className="p-2.5 rounded-xl bg-campus-light border border-campus-border/60">
                <span className="block text-[11px] font-bold text-campus-navy truncate">{sub.subject_code}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-black text-campus-blue">{sub.percentage}%</span>
                  <span className="text-[10px] text-campus-muted">
                    {sub.attended_classes}/{sub.total_classes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
