import React, { useState, useEffect } from "react";
import { studentApi } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { QrCode, RefreshCw, ShieldCheck, Clock, UserCheck } from "lucide-react";

export const StudentQR: React.FC = () => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState<{
    token: string;
    expires_at: string;
    student_name: string;
    reg_number: string;
    qr_base64: string;
    validity_minutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQR = async () => {
    setRefreshing(true);
    try {
      const data = await studentApi.getQRToken();
      setQrData(data);
      const diff = Math.max(
        0,
        Math.floor((new Date(data.expires_at).getTime() - new Date().getTime()) / 1000)
      );
      setTimeLeft(diff);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQR();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchQR(); // automatically fetch freshly rotated 10s token
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-campus-navy">Digital Attendance Pass</h2>
        <p className="text-xs text-campus-muted mt-1">
          Present this dynamic QR code to your instructor to register present
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-campus-border shadow-xl text-center relative overflow-hidden">
        {/* Top subtle glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-campus-blue via-campus-dark to-campus-blue"></div>

        {/* Student Meta */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-campus-blue text-white font-black text-lg flex items-center justify-center shadow-md shadow-campus-blue/20 mb-2">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-base font-bold text-campus-navy">{user?.name}</h3>
          <span className="text-xs font-semibold text-campus-blue">{user?.reg_number}</span>
          <span className="text-[11px] text-campus-muted mt-0.5">{user?.department_name || "Engineering"}</span>
        </div>

        {/* QR Code Container */}
        <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-campus-border/80 shadow-inner">
          {loading ? (
            <div className="w-64 h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : qrData ? (
            <img
              src={qrData.qr_base64}
              alt="Student Attendance QR"
              className="w-64 h-64 object-contain rounded-xl"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-xs text-campus-muted">
              Unable to load QR token
            </div>
          )}
        </div>

        {/* Expiry Countdown Timer */}
        <div className="mt-6 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-campus-light border border-campus-border rounded-full text-xs font-bold text-campus-navy">
            <Clock className="w-4 h-4 text-campus-blue animate-pulse" />
            <span>Valid for: {timeLeft}s</span>
          </div>

          <p className="text-[11px] text-campus-muted mt-2">
            Tokens automatically rotate every 10 seconds to prevent unauthorized sharing.
          </p>

          <button
            onClick={fetchQR}
            disabled={refreshing}
            className="mt-4 px-4 py-2 text-xs font-semibold text-campus-blue hover:text-campus-dark hover:bg-campus-light rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh QR Token</span>
          </button>
        </div>

        {/* Security Feature Footer */}
        <div className="mt-8 pt-4 border-t border-campus-border flex items-center justify-center gap-6 text-[11px] text-campus-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>JWT Signed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-campus-blue" />
            <span>Enrolled Roster Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
