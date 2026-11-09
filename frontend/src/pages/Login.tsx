import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { School, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Sparkles } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, getDefaultRoute } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(getDefaultRoute(user.role), { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Authentication failed. Check your credentials.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-campus-light flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-campus-border overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Side: Brand & Feature Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-campus-blue via-campus-dark to-campus-navy p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle geometric circles */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-campus-blue/20 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <School className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight">CampusOne</span>
                <span className="block text-[11px] text-blue-200 uppercase tracking-widest font-semibold">
                  Smart ERP Platform
                </span>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Next-Gen Attendance & ERP</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                Trustworthy attendance with cryptographic verification.
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                CampusOne delivers real-time time-bound QR code attendance, streamlined faculty roster tools, and an immutable SHA-256 chained audit ledger.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SHA-256 Tamper-Evident Ledger</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>10-Second Dynamic QR Rotation</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Demo Quick Access */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-campus-navy tracking-tight">Sign In</h2>
                <p className="text-xs text-campus-muted mt-1">
                  Access your institutional dashboard and records
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold bg-campus-light text-campus-blue border border-campus-border rounded-full">
                v1.0.0
              </span>
            </div>

            {error && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-campus-navy mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-campus-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student1@campusone.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-campus-light/50 border border-campus-border rounded-xl text-xs text-campus-navy placeholder:text-campus-muted/70 focus:outline-none focus:ring-2 focus:ring-campus-blue/20 focus:border-campus-blue transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campus-navy mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-campus-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-campus-light/50 border border-campus-border rounded-xl text-xs text-campus-navy placeholder:text-campus-muted/70 focus:outline-none focus:ring-2 focus:ring-campus-blue/20 focus:border-campus-blue transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-campus-muted hover:text-campus-navy"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-campus-blue hover:bg-campus-dark text-white text-xs font-bold rounded-xl shadow-md shadow-campus-blue/25 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Enter CampusOne Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-campus-border">
            <p className="text-[11px] font-bold text-campus-muted uppercase tracking-wider mb-2.5">
              Quick 1-Click Demo Accounts:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("student1@campusone.edu", "Student@123")}
                className="p-2.5 bg-campus-light hover:bg-blue-50 border border-campus-border hover:border-campus-blue/40 rounded-xl text-left transition group"
              >
                <span className="block text-[11px] font-bold text-campus-navy group-hover:text-campus-blue">
                  Student
                </span>
                <span className="block text-[10px] text-campus-muted truncate">student1</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("faculty1@campusone.edu", "Faculty@123")}
                className="p-2.5 bg-campus-light hover:bg-blue-50 border border-campus-border hover:border-campus-blue/40 rounded-xl text-left transition group"
              >
                <span className="block text-[11px] font-bold text-campus-navy group-hover:text-campus-blue">
                  Faculty
                </span>
                <span className="block text-[10px] text-campus-muted truncate">faculty1</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("hod.cs@campusone.edu", "HOD@123")}
                className="p-2.5 bg-campus-light hover:bg-blue-50 border border-campus-border hover:border-campus-blue/40 rounded-xl text-left transition group"
              >
                <span className="block text-[11px] font-bold text-campus-navy group-hover:text-campus-blue">
                  HOD (CSE)
                </span>
                <span className="block text-[10px] text-campus-muted truncate">hod.cs</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("admin@campusone.edu", "Admin@123")}
                className="p-2.5 bg-campus-light hover:bg-blue-50 border border-campus-border hover:border-campus-blue/40 rounded-xl text-left transition group"
              >
                <span className="block text-[11px] font-bold text-campus-navy group-hover:text-campus-blue">
                  Admin
                </span>
                <span className="block text-[10px] text-campus-muted truncate">admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
