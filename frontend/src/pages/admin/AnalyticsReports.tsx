import React, { useState, useEffect } from "react";
import { analyticsApi } from "../../api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { BarChart3, Download, TrendingUp, AlertTriangle } from "lucide-react";

export const AnalyticsReports: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsApi.getOverview();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Department", "Department Name", "Total Records", "Present Count", "Turnout %"],
      ...data.department_stats.map((d: any) => [
        d.department,
        `"${d.department_name}"`,
        d.total_records,
        d.present_records,
        `${d.attendance_rate}%`,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campusone_attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <h2 className="text-xl font-bold text-campus-navy">Institutional Attendance Analytics</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Cross-departmental comparisons, longitudinal turnout trends, and exportable data
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/20 flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* Row 1: Weekly Trend Line Chart & Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Line */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-campus-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-campus-blue" />
              <span>Weekly Institutional Attendance Trend (%)</span>
            </h3>
            <p className="text-xs text-campus-muted mt-0.5">Aggregated student turnout over recent weeks</p>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.weekly_trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis domain={[60, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
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
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563EB" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Distribution */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-campus-navy">Status Distribution</h3>
            <p className="text-xs text-campus-muted mt-0.5">Overall marked attendance ratio</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.attendance_distribution}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data?.attendance_distribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-campus-border grid grid-cols-2 gap-2 text-xs">
            {data?.attendance_distribution?.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-campus-muted font-medium">
                  {item.name}: <strong className="text-campus-navy">{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Department-Wise Comparison Bar Chart */}
      <div className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm">
        <h3 className="text-sm font-bold text-campus-navy">Department Attendance Comparison</h3>
        <p className="text-xs text-campus-muted mt-0.5">
          Average student attendance percentage by academic department
        </p>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.department_stats} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="department" stroke="#64748B" fontSize={11} tickLine={false} />
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
              <Bar dataKey="attendance_rate" fill="#1E40AF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
