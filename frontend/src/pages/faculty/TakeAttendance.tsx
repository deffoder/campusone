import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { facultyApi, attendanceApi, ClassItem } from "../../api";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  ListChecks,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Save,
  Camera,
  StopCircle,
  Check,
  AlertCircle,
  Calendar,
} from "lucide-react";

export const TakeAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get("classId");
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    classIdParam ? Number(classIdParam) : null
  );
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [mode, setMode] = useState<"manual" | "qr">("manual");
  const [students, setStudents] = useState<Array<{ id: number; name: string; reg_number: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // QR Scanner State
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<Array<{ name: string; reg: string; time: string }>>([]);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "campusone-qr-reader";

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await facultyApi.getClasses();
        setClasses(data);
        if (!selectedClassId && data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch roster when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    const fetchStudents = async () => {
      try {
        const data = await facultyApi.getClassStudents(selectedClassId);
        setStudents(
          data.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            reg_number: s.reg_number,
            status: "present", // default to present
          }))
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  // Clean up scanner on unmount or mode switch
  useEffect(() => {
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleStatusChange = (studentId: number, status: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAll = (status: "present" | "absent") => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSaveManualAttendance = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    setNotification(null);
    try {
      await attendanceApi.markManual({
        class_id: selectedClassId,
        date: sessionDate,
        method: "manual",
        records: students.map((s) => ({
          student_id: s.id,
          status: s.status,
        })),
      });
      setNotification({
        type: "success",
        message: "Attendance successfully recorded and linked into SHA-256 audit ledger!",
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.response?.data?.detail || "Failed to save attendance.",
      });
    } finally {
      setSaving(false);
    }
  };

  // QR Scanner Handlers
  const startQRScanner = async () => {
    if (!selectedClassId) {
      setNotification({ type: "error", message: "Please select a class first." });
      return;
    }

    setScannerActive(true);
    setNotification(null);

    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await qrScannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Process QR code scanned
          try {
            const res = await attendanceApi.scanQR(selectedClassId, decodedText);
            setNotification({
              type: res.already_marked ? "info" : "success",
              message: res.message,
            });

            // Mark student present in local state
            setStudents((prev) =>
              prev.map((s) =>
                s.reg_number === res.reg_number ? { ...s, status: "present" } : s
              )
            );

            // Add to scanned log if not already there
            setScannedStudents((prev) => {
              if (prev.some((p) => p.reg === res.reg_number)) return prev;
              return [
                {
                  name: res.student_name,
                  reg: res.reg_number,
                  time: new Date().toLocaleTimeString(),
                },
                ...prev,
              ];
            });
          } catch (scanErr: any) {
            setNotification({
              type: "error",
              message: scanErr.response?.data?.detail || "Invalid QR attendance token.",
            });
          }
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.error(err);
      setScannerActive(false);
      setNotification({
        type: "error",
        message: "Could not start camera. Check browser permissions or use manual mode.",
      });
    }
  };

  const stopQRScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      await qrScannerRef.current.stop();
    }
    setScannerActive(false);
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Page Title & Class Selector Bar */}
      <div className="bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-campus-navy">Take Class Attendance</h2>
          <p className="text-xs text-campus-muted mt-0.5">
            Select lecture, session date, and attendance verification method
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] font-bold uppercase text-campus-muted mb-1">
              Select Class
            </label>
            <select
              value={selectedClassId || ""}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="px-3.5 py-2 text-xs bg-campus-light border border-campus-border rounded-xl font-semibold text-campus-navy focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.subject_code} - {cls.subject_name} (Sec {cls.section})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-campus-muted mb-1">
              Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="px-3.5 py-2 text-xs bg-campus-light border border-campus-border rounded-xl font-semibold text-campus-navy focus:outline-none focus:ring-2 focus:ring-campus-blue/20"
            />
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-campus-border pb-2">
        <button
          onClick={() => {
            if (scannerActive) stopQRScanner();
            setMode("manual");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
            mode === "manual"
              ? "bg-campus-blue text-white shadow-md shadow-campus-blue/20"
              : "bg-white text-campus-muted hover:text-campus-navy border border-campus-border"
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Manual Roster Mode</span>
        </button>

        <button
          onClick={() => setMode("qr")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
            mode === "qr"
              ? "bg-campus-blue text-white shadow-md shadow-campus-blue/20"
              : "bg-white text-campus-muted hover:text-campus-navy border border-campus-border"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Camera Scanner Mode</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-sm animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : notification.type === "info"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : notification.type === "info" ? (
              <Clock className="w-4 h-4 text-blue-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Mode 1: Manual Attendance */}
      {mode === "manual" && (
        <div className="bg-white rounded-3xl border border-campus-border shadow-sm overflow-hidden">
          {/* Action Bar */}
          <div className="p-4 sm:p-6 border-b border-campus-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-campus-light/30">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-campus-navy">
                {selectedClass?.subject_name} ({selectedClass?.subject_code})
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                  {presentCount} Present
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold">
                  {absentCount} Absent
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll("present")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll("absent")}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition"
              >
                All Absent
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveManualAttendance}
                className="px-4 py-1.5 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Attendance"}</span>
              </button>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-campus-light/60 border-b border-campus-border text-campus-muted uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-6">Reg Number</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6 text-center">Present</th>
                  <th className="py-3 px-6 text-center">Absent</th>
                  <th className="py-3 px-6 text-center">Late</th>
                  <th className="py-3 px-6 text-center">Excused</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-campus-light/30 transition">
                    <td className="py-3 px-6 font-bold text-campus-blue">{st.reg_number}</td>
                    <td className="py-3 px-6 font-semibold text-campus-navy">{st.name}</td>

                    {/* Status Toggles */}
                    <td className="py-3 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, "present")}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          st.status === "present"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </td>

                    <td className="py-3 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, "absent")}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          st.status === "absent"
                            ? "bg-red-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>

                    <td className="py-3 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, "late")}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          st.status === "late"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    </td>

                    <td className="py-3 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.id, "excused")}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          st.status === "excused"
                            ? "bg-blue-500 text-white shadow-sm"
                            : "bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 2: QR Scanner Mode */}
      {mode === "qr" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Camera View Area */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-campus-navy">QR Camera Scanner</h3>
                <p className="text-xs text-campus-muted">
                  Point rear camera at student's CampusOne QR pass
                </p>
              </div>

              {scannerActive ? (
                <button
                  onClick={stopQRScanner}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop Scanner</span>
                </button>
              ) : (
                <button
                  onClick={startQRScanner}
                  className="px-4 py-2 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-campus-blue/20 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Activate Camera</span>
                </button>
              )}
            </div>

            {/* Viewfinder div */}
            <div className="w-full max-w-md aspect-square bg-campus-light rounded-2xl border-2 border-dashed border-campus-border flex items-center justify-center overflow-hidden relative">
              <div id={scannerContainerId} className="w-full h-full"></div>
              {!scannerActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <QrCode className="w-12 h-12 text-campus-muted/40 mb-2" />
                  <p className="text-xs font-bold text-campus-navy">Camera Inactive</p>
                  <p className="text-[11px] text-campus-muted mt-1 max-w-xs">
                    Click "Activate Camera" to scan student QR codes on smartphones or webcams.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scanned Real-Time Log */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-campus-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-campus-border">
                <h3 className="text-sm font-bold text-campus-navy">
                  Verified Check-Ins ({scannedStudents.length})
                </h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Live Feed
                </span>
              </div>

              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {scannedStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-campus-muted italic">
                    Scanned students will appear here in real time.
                  </div>
                ) : (
                  scannedStudents.map((st, i) => (
                    <div
                      key={i}
                      className="p-3 bg-campus-light rounded-xl border border-campus-border/60 flex items-center justify-between text-xs animate-in fade-in"
                    >
                      <div>
                        <span className="font-bold text-campus-navy block">{st.name}</span>
                        <span className="text-[10px] text-campus-blue font-semibold">{st.reg}</span>
                      </div>
                      <span className="text-[10px] text-campus-muted flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {st.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-campus-border text-[11px] text-campus-muted flex items-center justify-between">
              <span>Automatic SHA-256 Audit Linkage</span>
              <span className="font-semibold text-campus-blue">
                {students.filter((s) => s.status === "present").length} Present in Roster
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
