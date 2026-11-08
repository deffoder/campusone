import React, { useState, useEffect } from "react";
import { adminApi, AuditLogItem } from "../../api";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Copy,
  Check,
  Hash,
  Database,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    total_records: number;
    is_valid: boolean;
    broken_at_id?: number | null;
    message: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const data = await adminApi.getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const result = await adminApi.verifyAuditIntegrity();
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationResult({
        total_records: logs.length,
        is_valid: false,
        message: err.response?.data?.detail || "Cryptographic verification failed.",
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    handleVerifyIntegrity();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Verification Bar */}
      <div className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-campus-blue text-xs font-bold mb-1.5">
            <Hash className="w-3.5 h-3.5" />
            <span>Cryptographic SHA-256 Ledger</span>
          </div>
          <h2 className="text-xl font-bold text-campus-navy">Tamper-Evident Audit Trail</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Every attendance event, scan, and correction is cryptographically hashed and chained to the previous block
          </p>
        </div>

        <button
          onClick={handleVerifyIntegrity}
          disabled={verifying}
          className="px-4 py-2.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/20 flex items-center gap-2 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
          <span>{verifying ? "Verifying Hash Chain..." : "Run Cryptographic Audit"}</span>
        </button>
      </div>

      {/* Verification Status Banner */}
      {verificationResult && (
        <div
          className={`p-5 rounded-3xl border flex items-center justify-between gap-4 animate-in fade-in shadow-sm ${
            verificationResult.is_valid
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : "bg-red-50/80 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                verificationResult.is_valid ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {verificationResult.is_valid ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {verificationResult.is_valid
                  ? "Audit Ledger Verified: 100% Intact"
                  : "Cryptographic Tampering Detected!"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">{verificationResult.message}</p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="text-[11px] font-mono font-bold block uppercase tracking-wider">
              Genesis Hash
            </span>
            <span className="text-[10px] font-mono opacity-70">
              00000000...00000000 (SHA-256)
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-campus-muted">
            No audit records currently available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Node ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">SHA-256 Hashes (Prev → Current)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-campus-light/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-campus-navy">#{log.id}</td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-blue-50 text-campus-blue uppercase">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-campus-navy">{log.table_name}</span>
                      <span className="text-campus-muted font-mono ml-1">[{log.record_id}]</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-campus-navy block">{log.actor_name}</span>
                      <span className="text-[10px] text-campus-muted">{log.actor_email || "System"}</span>
                    </td>

                    <td className="py-3 px-4 text-campus-muted whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1 font-mono text-[10px]">
                        {/* Prev Hash */}
                        <div className="flex items-center gap-1.5 text-campus-muted">
                          <span className="w-10 text-[9px] uppercase font-bold">Prev:</span>
                          <span className="bg-campus-light px-1.5 py-0.5 rounded border border-campus-border/60">
                            {log.prev_hash.slice(0, 16)}...{log.prev_hash.slice(-8)}
                          </span>
                        </div>

                        {/* Current Hash */}
                        <div className="flex items-center gap-1.5 text-campus-blue font-bold">
                          <span className="w-10 text-[9px] uppercase">Curr:</span>
                          <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {log.current_hash.slice(0, 16)}...{log.current_hash.slice(-8)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(log.current_hash)}
                            className="p-1 hover:text-campus-dark text-campus-muted"
                            title="Copy full SHA-256 hash"
                          >
                            {copiedHash === log.current_hash ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
