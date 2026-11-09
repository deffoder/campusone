import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import {
  LayoutDashboard,
  CalendarCheck2,
  QrCode,
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  School,
  History,
  CheckCircle2,
  ChevronRight,
  Layers,
} from "lucide-react";

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation configurations based on role
  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === "student") {
      return [
        { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
        { label: "Subject Attendance", path: "/student/subjects", icon: BookOpen },
        { label: "Attendance History", path: "/student/history", icon: CalendarCheck2 },
        { label: "Correction Requests", path: "/student/corrections", icon: FileText },
        { label: "My QR Token", path: "/student/qr", icon: QrCode },
      ];
    }

    if (user.role === "faculty") {
      return [
        { label: "Overview", path: "/faculty/dashboard", icon: LayoutDashboard },
        { label: "My Classes", path: "/faculty/classes", icon: BookOpen },
        { label: "Take Attendance", path: "/faculty/attendance", icon: CalendarCheck2 },
        { label: "Session History", path: "/faculty/history", icon: History },
        { label: "Correction Requests", path: "/faculty/corrections", icon: FileText },
      ];
    }

    // Admin & HOD
    const overviewLabel = user.role === "hod" ? "Department Overview" : "Overview";
    const links = [
      { label: overviewLabel, path: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Students", path: "/admin/students", icon: Users },
      { label: "Faculty", path: "/admin/faculty", icon: GraduationCap },
      { label: "Academic Structure", path: "/admin/academic", icon: Layers },
      { label: "Audit Ledger (SHA-256)", path: "/admin/audit", icon: ShieldCheck },
      { label: "Analytics & Reports", path: "/admin/analytics", icon: BarChart3 },
    ];

    if (user.role === "hod" || user.role === "admin") {
      links.splice(4, 0, {
        label: "HOD Escalations",
        path: "/admin/escalations",
        icon: CheckCircle2,
      });
    }

    return links;
  };

  const navLinks = getNavLinks();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-700 rounded-full">Admin</span>;
      case "hod":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 text-purple-700 rounded-full">HOD</span>;
      case "faculty":
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full">Faculty</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-green-100 text-green-700 rounded-full">Student</span>;
    }
  };

  return (
    <div className="min-h-screen bg-campus-light flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-campus-border flex-shrink-0 fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-campus-border">
          <div className="w-10 h-10 rounded-xl bg-campus-blue flex items-center justify-center text-white shadow-md shadow-campus-blue/20">
            <School className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-campus-navy tracking-tight">CampusOne</span>
            <span className="block text-[10px] text-campus-muted uppercase font-semibold tracking-wider">Smart ERP</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-campus-light/70 rounded-2xl border border-campus-border/70 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-campus-blue to-campus-dark text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-campus-navy truncate">{user?.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {user && getRoleBadge(user.role)}
              <span className="text-[10px] text-campus-muted truncate">
                {user?.reg_number || user?.employee_id || user?.department_name || ""}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-campus-blue text-white shadow-sm shadow-campus-blue/30"
                    : "text-campus-muted hover:text-campus-navy hover:bg-campus-light"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-campus-muted"}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-campus-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-campus-muted hover:text-campus-danger hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-16 bg-white border-b border-campus-border px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-campus-blue flex items-center justify-center text-white">
            <School className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-campus-navy">CampusOne</span>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-campus-muted hover:text-campus-navy rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-campus-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-campus-blue flex items-center justify-center text-white">
                  <School className="w-4 h-4" />
                </div>
                <span className="font-bold text-campus-navy">CampusOne</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-campus-muted hover:text-campus-navy"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 border-b border-campus-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-campus-blue text-white font-bold flex items-center justify-center text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-campus-navy truncate">{user?.name}</p>
                <p className="text-[10px] text-campus-muted capitalize">{user?.role}</p>
              </div>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? "bg-campus-blue text-white" : "text-campus-muted hover:bg-campus-light"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-campus-border">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-campus-danger hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Top bar for desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-campus-border px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-campus-navy">
              {navLinks.find((l) => l.path === location.pathname)?.label || "CampusOne ERP"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="h-8 w-px bg-campus-border"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-campus-blue/10 text-campus-blue font-bold flex items-center justify-center text-xs">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-campus-navy leading-tight">{user?.name}</p>
                <p className="text-[10px] text-campus-muted uppercase">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
