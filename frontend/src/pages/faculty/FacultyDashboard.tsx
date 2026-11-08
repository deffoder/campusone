import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { facultyApi, ClassItem } from "../../api";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Clock,
  BookOpen,
  QrCode,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clsData, schedData] = await Promise.all([
          facultyApi.getClasses(),
          facultyApi.getTodaySchedule(),
        ]);
        setClasses(clsData);
        setTodaySchedule(schedData);
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
      {/* Welcome & Quick Action Banner */}
      <div className="bg-gradient-to-r from-campus-blue to-campus-dark rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-campus-blue/15">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Faculty Instruction Portal</span>
          </div>
          <h2 className="text-2xl font-black">Welcome, {user?.name}!</h2>
          <p className="text-xs text-blue-100/90 mt-1">
            Employee ID: <span className="font-semibold text-white">{user?.employee_id}</span> | Department:{" "}
            <span className="font-semibold text-white">{user?.department_name || "Computer Science"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/faculty/attendance"
            className="px-4 py-2.5 bg-white text-campus-blue hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Take Attendance Now</span>
          </Link>
          <Link
            to="/faculty/corrections"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-sm transition flex items-center gap-2"
          >
            <span>Review Requests</span>
          </Link>
        </div>
      </div>

      {/* Today's Schedule Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-campus-navy">
              Today's Lectures ({todaySchedule?.day || "Today"})
            </h3>
            <p className="text-xs text-campus-muted">
              Scheduled classes ready for attendance tracking
            </p>
          </div>
        </div>

        {todaySchedule?.classes?.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-campus-border text-center text-xs text-campus-muted">
            No scheduled lectures on the timetable for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySchedule?.classes?.map((item: any) => (
              <div
                key={item.timetable_id}
                className="bg-white rounded-2xl p-5 border border-campus-border shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-campus-blue font-bold text-[11px]">
                      {item.subject_code}
                    </span>
                    <span className="text-campus-muted font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.start_time} - {item.end_time}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-campus-navy">{item.subject_name}</h4>
                  <p className="text-xs text-campus-muted mt-1">
                    Section {item.section} • Room: {item.room}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-campus-border flex items-center justify-between">
                  <span className="text-xs font-medium text-campus-muted flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {item.enrolled_count} Students
                  </span>

                  <Link
                    to={`/faculty/attendance?classId=${item.class_id}`}
                    className="px-3 py-1.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition"
                  >
                    <span>Start Session</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Classes Roster Overview */}
      <div className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-campus-navy">My Teaching Assignments</h3>
            <p className="text-xs text-campus-muted">Classes assigned for academic term</p>
          </div>
          <Link
            to="/faculty/classes"
            className="text-xs font-bold text-campus-blue hover:underline flex items-center gap-1"
          >
            <span>View Rosters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-4 rounded-2xl bg-campus-light/60 border border-campus-border/70 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-campus-blue uppercase tracking-wider">
                  {cls.subject_code}
                </span>
                <h4 className="text-xs font-bold text-campus-navy mt-1 leading-snug">
                  {cls.subject_name}
                </h4>
                <p className="text-[11px] text-campus-muted mt-0.5">Section {cls.section}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-campus-border/50 flex items-center justify-between text-[11px]">
                <span className="text-campus-muted">{cls.enrolled_count} enrolled</span>
                <Link
                  to={`/faculty/attendance?classId=${cls.id}`}
                  className="font-bold text-campus-blue hover:underline"
                >
                  Take Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
