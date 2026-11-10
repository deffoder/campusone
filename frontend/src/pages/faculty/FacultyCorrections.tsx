import React, { useState, useEffect } from "react";
import { facultyApi, CorrectionRequestItem } from "../../api";
import { BACKEND_SERVER_URL } from "../../api/client";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  MessageSquare,
  X,
  FileCheck,
} from "lucide-react";

export const FacultyCorrections: React.FC = () => {
  const [requests, setRequests] = useState<CorrectionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<CorrectionRequestItem | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | "escalated">("approved");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchCorrections = async () => {
    try {
      const data = await facultyApi.getCorrections();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const handleOpenDecisionModal = (req: CorrectionRequestItem, d: "approved" | "rejected" | "escalated") => {
    setSelectedReq(req);
    setDecision(d);
    setComments("");
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await facultyApi.decideCorrection(selectedReq.id, decision, comments);
      setFeedback(`Correction request marked as ${decision}.`);
      setSelectedReq(null);
      fetchCorrections();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-campus-navy">Student Attendance Correction Appeals</h2>
        <p className="text-xs text-campus-muted mt-0.5">
          Review student appeals, inspect documentary proof, and approve, reject, or escalate to HOD
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-campus-border shadow-sm">
          <FileText className="w-12 h-12 text-campus-muted/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-campus-navy">No Appeals Awaiting Review</h3>
          <p className="text-xs text-campus-muted mt-1">
            All student correction requests for your courses have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-campus-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-campus-navy">{req.student_name}</span>
                    <span className="text-xs font-bold text-campus-blue px-2 py-0.5 rounded-md bg-blue-50">
                      {req.reg_number}
                    </span>
                  </div>
                  <p className="text-xs text-campus-muted mt-1">
                    Course: <span className="font-semibold text-campus-navy">{req.subject_name}</span> (
                    {req.subject_code}) • Session: {req.session_date}
                  </p>
                </div>

                <div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border capitalize ${
                      req.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : req.status === "rejected"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : req.status === "pending_hod"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {req.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider">
                    Requested Change
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-bold uppercase">
                      {req.original_status}
                    </span>
                    <span className="text-campus-muted">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold uppercase">
                      {req.requested_status}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider block mt-3">
                    Student Reason
                  </span>
                  <p className="mt-1 text-campus-navy bg-campus-light/60 p-3 rounded-xl border border-campus-border/60 leading-relaxed">
                    "{req.reason}"
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider">
                    Documentary Evidence
                  </span>
                  <div className="mt-1">
                    {req.evidence_files.length === 0 ? (
                      <p className="text-campus-muted italic">No file attached by student.</p>
                    ) : (
                      req.evidence_files.map((file) => (
                        <a
                          key={file.id}
                          href={`${BACKEND_SERVER_URL}${file.filepath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3.5 py-2 bg-campus-light hover:bg-blue-50 border border-campus-border rounded-xl text-campus-blue font-semibold transition"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span className="truncate max-w-xs">{file.filename}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-campus-muted" />
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Pending Requests */}
              {req.status === "pending_faculty" && (
                <div className="pt-4 border-t border-campus-border flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenDecisionModal(req, "rejected")}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleOpenDecisionModal(req, "escalated")}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Escalate to HOD</span>
                  </button>
                  <button
                    onClick={() => handleOpenDecisionModal(req, "approved")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Update</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-campus-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border">
              <h3 className="text-sm font-bold text-campus-navy capitalize">
                Confirm Decision: {decision}
              </h3>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-campus-muted hover:text-campus-navy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-campus-light border border-campus-border/60 text-xs">
              <p className="font-semibold text-campus-navy">
                {selectedReq.student_name} ({selectedReq.reg_number})
              </p>
              <p className="text-campus-muted text-[11px] mt-0.5">
                {selectedReq.subject_name} • {selectedReq.session_date}
              </p>
            </div>

            <form onSubmit={handleSubmitDecision} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campus-navy mb-1">
                  Reviewer Comments (Optional / Preserved in Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Reason for approval, rejection rationale, or note to HOD..."
                  className="w-full p-3 bg-campus-light/50 border border-campus-border rounded-xl text-xs text-campus-navy focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-xs font-semibold text-campus-muted hover:text-campus-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 ${
                    decision === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : decision === "rejected"
                      ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                      : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                  }`}
                >
                  {submitting ? "Processing..." : `Confirm ${decision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
