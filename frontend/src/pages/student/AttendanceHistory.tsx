import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { studentApi, AttendanceRecordItem } from "../../api";
import {
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Upload,
  X,
  FileCheck,
} from "lucide-react";

export const AttendanceHistory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subjectParam = searchParams.get("subject");

  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Correction Modal State
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordItem | null>(null);
  const [requestedStatus, setRequestedStatus] = useState("present");
  const [reason, setReason] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getAttendance(
        subjectParam ? Number(subjectParam) : undefined,
        statusFilter || undefined
      );
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [subjectParam, statusFilter]);

  const handleOpenCorrection = (rec: AttendanceRecordItem) => {
    setSelectedRecord(rec);
    setRequestedStatus("present");
    setReason("");
    setEvidenceFile(null);
    setFeedback(null);
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!reason.trim()) {
      setFeedback({ type: "error", text: "Please provide a valid explanation for this request." });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("attendance_record_id", selectedRecord.id.toString());
      formData.append("requested_status", requestedStatus);
      formData.append("reason", reason);
      if (evidenceFile) {
        formData.append("file", evidenceFile);
      }

      await studentApi.submitCorrectionRequest(formData);
      setFeedback({
        type: "success",
        text: "Attendance correction request filed. Awaiting faculty/HOD review.",
      });
      setTimeout(() => {
        setSelectedRecord(null);
        fetchRecords();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.detail || "Failed to submit correction request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.subject_name.toLowerCase().includes(q) ||
      r.subject_code.toLowerCase().includes(q) ||
      r.session_date.includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700">
            <XCircle className="w-3.5 h-3.5" /> Absent
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700">
            <Clock className="w-3.5 h-3.5" /> Late
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700">
            Excused
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-campus-navy">Session Attendance History</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Complete timeline of all recorded attendance sessions and correction status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search subject or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-2 text-xs bg-white border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-campus-border rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-blue/20 text-campus-navy"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
      </div>

      {/* History Table Card */}
      <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-campus-muted">
            No attendance records match your current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-6">Session Date</th>
                  <th className="py-3.5 px-6">Course</th>
                  <th className="py-3.5 px-6">Section</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Marked Time</th>
                  <th className="py-3.5 px-6 text-right">Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-campus-light/40 transition">
                    <td className="py-3.5 px-6 font-semibold text-campus-navy flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-campus-blue" />
                      {new Date(r.session_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-campus-navy block">{r.subject_name}</span>
                      <span className="text-[10px] text-campus-muted">{r.subject_code}</span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-campus-navy">Sec {r.class_section}</td>
                    <td className="py-3.5 px-6">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-6 text-campus-muted">
                      {new Date(r.marked_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {r.has_correction ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-campus-blue rounded-md capitalize">
                          {r.correction_status?.replace("_", " ") || "In Review"}
                        </span>
                      ) : r.status !== "present" ? (
                        <button
                          onClick={() => handleOpenCorrection(r)}
                          className="px-3 py-1 bg-campus-blue hover:bg-campus-dark text-white text-[11px] font-semibold rounded-lg shadow-sm transition"
                        >
                          Request Fix
                        </button>
                      ) : (
                        <span className="text-[11px] text-campus-muted/60">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correction Request Dialog Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-campus-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-campus-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-campus-blue/10 text-campus-blue flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-campus-navy">Attendance Correction Request</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-campus-muted hover:text-campus-navy p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-campus-light rounded-xl border border-campus-border/60 text-xs">
              <p className="font-semibold text-campus-navy">{selectedRecord.subject_name}</p>
              <p className="text-campus-muted text-[11px] mt-0.5">
                Session Date: {selectedRecord.session_date} | Current Status:{" "}
                <span className="font-bold uppercase text-campus-danger">{selectedRecord.status}</span>
              </p>
            </div>

            {feedback && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCorrection} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campus-navy mb-1">
                  Requested Status
                </label>
                <select
                  value={requestedStatus}
                  onChange={(e) => setRequestedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-campus-light/50 border border-campus-border rounded-xl text-xs text-campus-navy focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                >
                  <option value="present">Present (In Attendance)</option>
                  <option value="excused">Excused (Medical / University Event)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campus-navy mb-1">
                  Reason / Explanation
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide complete explanation (e.g., medical emergency, inter-college symposium representation, scanner glitch)..."
                  className="w-full p-3 bg-campus-light/50 border border-campus-border rounded-xl text-xs text-campus-navy placeholder:text-campus-muted/60 focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campus-navy mb-1">
                  Documentary Evidence (Optional / Recommended)
                </label>
                <div className="relative border-2 border-dashed border-campus-border hover:border-campus-blue/50 rounded-xl p-4 text-center cursor-pointer transition bg-campus-light/30">
                  <input
                    type="file"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    {evidenceFile ? (
                      <>
                        <FileCheck className="w-6 h-6 text-emerald-600" />
                        <span className="text-xs font-bold text-campus-navy">{evidenceFile.name}</span>
                        <span className="text-[10px] text-campus-muted">
                          {(evidenceFile.size / 1024).toFixed(1)} KB (Click to change)
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-campus-muted" />
                        <span className="text-xs font-medium text-campus-navy">
                          Upload certificate or proof (PDF, JPG, PNG)
                        </span>
                        <span className="text-[10px] text-campus-muted">Max file size 10MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-xs font-semibold text-campus-muted hover:text-campus-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/25 transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
