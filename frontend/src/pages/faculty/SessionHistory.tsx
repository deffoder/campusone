import React, { useState, useEffect } from "react";
import { attendanceApi, AttendanceSessionItem } from "../../api";
import {
  Calendar,
  Lock,
  Unlock,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  ShieldCheck,
} from "lucide-react";

export const SessionHistory: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await attendanceApi.getSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpenDetails = async (id: number) => {
    setSelectedSessionId(id);
    setModalLoading(true);
    try {
      const data = await attendanceApi.getSessionDetails(id);
      setSessionDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleFinalize = async (id: number) => {
    try {
      await attendanceApi.finalizeSession(id);
      setFeedback("Attendance session finalized and locked into immutable state.");
      fetchSessions();
      if (selectedSessionId === id && sessionDetails) {
        setSessionDetails({ ...sessionDetails, is_finalized: true });
      }
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to finalize session.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-campus-navy">Class Attendance Sessions</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Historical lecture records, student rosters, and finalization locks
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-campus-muted">
            No attendance sessions recorded yet. Start one from "Take Attendance".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Method</th>
                  <th className="py-3.5 px-6">Turnout</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-campus-light/30 transition">
                    <td className="py-3.5 px-6 font-semibold text-campus-navy flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-campus-blue" />
                      <span>{s.date}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-campus-navy block">{s.subject_name}</span>
                      <span className="text-[10px] text-campus-muted">{s.subject_code}</span>
                    </td>
                    <td className="py-3.5 px-6 uppercase text-[10px] font-bold text-campus-muted">
                      {s.method}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-emerald-600">{s.present_count} P</span> /{" "}
                      <span className="font-bold text-red-600">{s.absent_count} A</span>{" "}
                      <span className="text-campus-muted">({s.total_marked} Total)</span>
                    </td>
                    <td className="py-3.5 px-6">
                      {s.is_finalized ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-[11px]">
                          <Lock className="w-3 h-3 text-gray-500" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                          <Unlock className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetails(s.id)}
                        className="px-3 py-1 bg-campus-light hover:bg-blue-50 text-campus-blue text-[11px] font-semibold rounded-lg border border-campus-border transition"
                      >
                        Inspect
                      </button>
                      {!s.is_finalized && (
                        <button
                          onClick={() => handleFinalize(s.id)}
                          className="px-3 py-1 bg-campus-blue hover:bg-campus-dark text-white text-[11px] font-semibold rounded-lg shadow-sm transition"
                        >
                          Finalize
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-campus-border max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-campus-border">
              <div>
                <h3 className="text-base font-bold text-campus-navy">Session Roster Inspection</h3>
                <p className="text-xs text-campus-muted mt-0.5">
                  {sessionDetails?.subject_name} • {sessionDetails?.date} • Sec {sessionDetails?.section}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="text-campus-muted hover:text-campus-navy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {modalLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-2.5 px-4">Reg Number</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-campus-border/60">
                    {sessionDetails?.students?.map((st: any) => (
                      <tr key={st.student_id}>
                        <td className="py-2.5 px-4 font-bold text-campus-blue">{st.reg_number}</td>
                        <td className="py-2.5 px-4 font-semibold text-campus-navy">{st.name}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                              st.status === "present"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-campus-border flex items-center justify-between">
              <span className="text-xs text-campus-muted">
                {sessionDetails?.is_finalized ? "Locked Session" : "Editable Session"}
              </span>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="px-4 py-2 bg-campus-light hover:bg-gray-100 text-campus-navy text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
