import React, { useState, useEffect } from "react";
import { studentApi, CorrectionRequestItem } from "../../api";
import { API_BASE_URL, BACKEND_SERVER_URL } from "../../api/client";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Calendar,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

export const CorrectionRequests: React.FC = () => {
  const [requests, setRequests] = useState<CorrectionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await studentApi.getCorrectionRequests();
        setRequests(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "pending_hod":
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Escalated to HOD
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending Faculty Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-campus-navy">My Attendance Correction Requests</h2>
        <p className="text-xs text-campus-muted mt-0.5">
          Track multi-tier verification status, attached evidence, and faculty decisions
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-campus-border shadow-sm">
          <FileText className="w-12 h-12 text-campus-muted/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-campus-navy">No Correction Requests Filed</h3>
          <p className="text-xs text-campus-muted mt-1 max-w-sm mx-auto">
            If you were marked absent erroneously, navigate to Attendance History and click "Request Fix".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-campus-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-campus-light border border-campus-border flex items-center justify-center text-campus-blue">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-campus-navy">
                      {req.subject_name} ({req.subject_code})
                    </h3>
                    <p className="text-xs text-campus-muted mt-0.5">
                      Session Date: <span className="font-semibold text-campus-navy">{req.session_date}</span> |
                      Submitted on: {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">{getStatusBadge(req.status)}</div>
              </div>

              <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider">
                    Status Transition
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-semibold uppercase">
                      {req.original_status}
                    </span>
                    <span className="text-campus-muted">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold uppercase">
                      {req.requested_status}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider block mt-3">
                    Student Reason
                  </span>
                  <p className="mt-1 text-campus-navy leading-relaxed bg-campus-light/60 p-2.5 rounded-xl border border-campus-border/60">
                    "{req.reason}"
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider">
                    Evidence Attached
                  </span>
                  <div className="mt-1 space-y-1.5">
                    {req.evidence_files.length === 0 ? (
                      <p className="text-campus-muted italic">No documentary file attached.</p>
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
                          <ExternalLink className="w-3 h-3 text-campus-muted" />
                        </a>
                      ))
                    )}
                  </div>

                  {/* Approvals Feedback */}
                  {req.approvals.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-campus-muted tracking-wider block">
                        Reviewer Remarks
                      </span>
                      {req.approvals.map((app) => (
                        <div
                          key={app.id}
                          className="mt-1 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-campus-blue mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-campus-navy text-[11px]">
                              {app.approver_name} ({app.level}):{" "}
                              <span className="capitalize text-campus-blue font-bold">{app.decision}</span>
                            </p>
                            {app.comments && (
                              <p className="text-campus-muted text-[11px] mt-0.5">"{app.comments}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
