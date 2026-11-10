import React, { useState, useEffect } from "react";
import { adminApi, CorrectionRequestItem } from "../../api";
import { BACKEND_SERVER_URL } from "../../api/client";
import {
  CheckCircle2,
  XCircle,
  FileCheck,
  ExternalLink,
  ShieldAlert,
  Calendar,
  MessageSquare,
} from "lucide-react";

export const Escalations: React.FC = () => {
  const [requests, setRequests] = useState<CorrectionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchEscalations = async () => {
    try {
      const data = await adminApi.getEscalations();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleDecision = async (reqId: number, decision: "approved" | "rejected") => {
    const comment = prompt(`Provide HOD review remarks for ${decision.toUpperCase()} decision:`) || "";
    try {
      await adminApi.decideEscalation(reqId, decision, comment);
      setFeedback(`Escalated appeal successfully marked as ${decision.toUpperCase()}`);
      fetchEscalations();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit HOD decision.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-campus-navy">HOD Escalation Console</h2>
        <p className="text-xs text-campus-muted mt-0.5">
          Review disputed or multi-session attendance appeals escalated by faculty instructors
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
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
          <ShieldAlert className="w-12 h-12 text-campus-muted/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-campus-navy">No Pending HOD Escalations</h3>
          <p className="text-xs text-campus-muted mt-1">
            All escalated attendance requests have been processed.
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
                    {req.subject_code}) • Date: {req.session_date}
                  </p>
                </div>

                <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Escalated to HOD
                </span>
              </div>

              <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider">
                    Requested Modification
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
                      <p className="text-campus-muted italic">No file attached.</p>
                    ) : (
                      req.evidence_files.map((file) => (
                        <a
                          key={file.id}
                          href={`${BACKEND_SERVER_URL}${file.filepath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-campus-light hover:bg-blue-50 border border-campus-border rounded-xl text-campus-blue font-semibold transition"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span className="truncate max-w-xs">{file.filename}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-campus-muted" />
                        </a>
                      ))
                    )}
                  </div>

                  {req.approvals.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider block">
                        Prior Review Remarks
                      </span>
                      {req.approvals.map((app) => (
                        <div
                          key={app.id}
                          className="mt-1 p-2 rounded-xl bg-purple-50/50 border border-purple-100 flex items-start gap-2"
                        >
                          <MessageSquare className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-campus-navy text-[11px]">
                              {app.approver_name} ({app.level}):{" "}
                              <span className="capitalize text-purple-700 font-bold">{app.decision}</span>
                            </p>
                            {app.comments && (
                              <p className="text-campus-muted text-[10px]">"{app.comments}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-campus-border flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDecision(req.id, "rejected")}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Appeal</span>
                </button>
                <button
                  onClick={() => handleDecision(req.id, "approved")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Finalize</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
