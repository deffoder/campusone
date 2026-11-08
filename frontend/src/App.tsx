import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

// Pages
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";

// Student Pages
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { SubjectAttendance } from "./pages/student/SubjectAttendance";
import { AttendanceHistory } from "./pages/student/AttendanceHistory";
import { CorrectionRequests } from "./pages/student/CorrectionRequests";
import { StudentQR } from "./pages/student/StudentQR";

// Faculty Pages
import { FacultyDashboard } from "./pages/faculty/FacultyDashboard";
import { MyClasses } from "./pages/faculty/MyClasses";
import { TakeAttendance } from "./pages/faculty/TakeAttendance";
import { SessionHistory } from "./pages/faculty/SessionHistory";
import { FacultyCorrections } from "./pages/faculty/FacultyCorrections";

// Admin & HOD Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { StudentManagement } from "./pages/admin/StudentManagement";
import { FacultyManagement } from "./pages/admin/FacultyManagement";
import { AcademicStructure } from "./pages/admin/AcademicStructure";
import { Escalations } from "./pages/admin/Escalations";
import { AuditLogs } from "./pages/admin/AuditLogs";
import { AnalyticsReports } from "./pages/admin/AnalyticsReports";

const RootRedirect: React.FC = () => {
  const { user, loading, getDefaultRoute } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-campus-light">
        <div className="w-8 h-8 border-3 border-campus-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return <Navigate to={user ? getDefaultRoute(user.role) : "/login"} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/subjects" element={<SubjectAttendance />} />
            <Route path="/student/history" element={<AttendanceHistory />} />
            <Route path="/student/corrections" element={<CorrectionRequests />} />
            <Route path="/student/qr" element={<StudentQR />} />
          </Route>

          {/* Faculty Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["faculty", "hod", "admin"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/classes" element={<MyClasses />} />
            <Route path="/faculty/attendance" element={<TakeAttendance />} />
            <Route path="/faculty/history" element={<SessionHistory />} />
            <Route path="/faculty/corrections" element={<FacultyCorrections />} />
          </Route>

          {/* Admin & HOD Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "hod"]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/faculty" element={<FacultyManagement />} />
            <Route path="/admin/academic" element={<AcademicStructure />} />
            <Route path="/admin/escalations" element={<Escalations />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
            <Route path="/admin/analytics" element={<AnalyticsReports />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
