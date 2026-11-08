import api from "./client";

export interface UserProfile {
  access_token: string;
  token_type: string;
  role: "admin" | "hod" | "faculty" | "student";
  user_id: number;
  name: string;
  email: string;
  profile_id?: number;
  department_name?: string;
  reg_number?: string;
  employee_id?: string;
}

export interface AttendanceRecordItem {
  id: number;
  session_id: number;
  student_id: number;
  student_name: string;
  reg_number: string;
  status: "present" | "absent" | "late" | "excused";
  marked_at: string;
  session_date: string;
  subject_name: string;
  subject_code: string;
  class_section: string;
  has_correction: boolean;
  correction_status?: string | null;
}

export interface SubjectStat {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  status_color: string;
}

export interface StudentDashboardStats {
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  overall_percentage: number;
  subjects: SubjectStat[];
  status_alert: string;
  classes_needed_for_75: number;
}

export interface EvidenceFileItem {
  id: number;
  filename: string;
  filepath: string;
  uploaded_at: string;
}

export interface ApprovalItem {
  id: number;
  approver_name: string;
  decision: "approved" | "rejected" | "escalated";
  comments?: string;
  decided_at: string;
  level: string;
}

export interface CorrectionRequestItem {
  id: number;
  attendance_record_id: number;
  student_id: number;
  student_name: string;
  reg_number: string;
  subject_name: string;
  subject_code: string;
  session_date: string;
  original_status: string;
  requested_status: string;
  reason: string;
  status: "pending_faculty" | "pending_hod" | "approved" | "rejected";
  created_at: string;
  evidence_files: EvidenceFileItem[];
  approvals: ApprovalItem[];
}

export interface ClassItem {
  id: number;
  subject_id: number;
  faculty_id: number;
  section: string;
  semester: number;
  academic_year: string;
  subject_name?: string;
  subject_code?: string;
  faculty_name?: string;
  department_name?: string;
  enrolled_count?: number;
  timetables?: Array<{
    id?: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string;
  }>;
}

export interface AttendanceSessionItem {
  id: number;
  class_id: number;
  subject_name: string;
  subject_code: string;
  faculty_name: string;
  date: string;
  start_time: string;
  end_time?: string;
  method: "qr" | "manual";
  is_finalized: boolean;
  total_marked: number;
  present_count: number;
  absent_count: number;
}

export interface AuditLogItem {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  actor_id?: number;
  actor_email?: string;
  actor_name?: string;
  old_values?: string;
  new_values?: string;
  timestamp: string;
  prev_hash: string;
  current_hash: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// --- Auth APIs ---
export const authApi = {
  login: async (email: string, password: string): Promise<UserProfile> => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  getMe: async (): Promise<UserProfile> => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};

// --- Student APIs ---
export const studentApi = {
  getDashboard: async (): Promise<StudentDashboardStats> => {
    const res = await api.get("/students/me/dashboard");
    return res.data;
  },
  getAttendance: async (subjectId?: number, status?: string): Promise<AttendanceRecordItem[]> => {
    const res = await api.get("/students/me/attendance", {
      params: { subject_id: subjectId, status_filter: status },
    });
    return res.data;
  },
  getQRToken: async () => {
    const res = await api.get("/students/me/qr-token");
    return res.data;
  },
  submitCorrectionRequest: async (formData: FormData) => {
    const res = await api.post("/students/me/correction-request", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  getCorrectionRequests: async (): Promise<CorrectionRequestItem[]> => {
    const res = await api.get("/students/me/correction-requests");
    return res.data;
  },
};

// --- Faculty APIs ---
export const facultyApi = {
  getClasses: async (): Promise<ClassItem[]> => {
    const res = await api.get("/faculty/me/classes");
    return res.data;
  },
  getClassStudents: async (classId: number) => {
    const res = await api.get(`/faculty/me/classes/${classId}/students`);
    return res.data;
  },
  getTodaySchedule: async () => {
    const res = await api.get("/faculty/me/today-schedule");
    return res.data;
  },
  getCorrections: async (): Promise<CorrectionRequestItem[]> => {
    const res = await api.get("/faculty/me/corrections");
    return res.data;
  },
  decideCorrection: async (
    requestId: number,
    decision: "approved" | "rejected" | "escalated",
    comments?: string
  ) => {
    const res = await api.post(`/faculty/me/corrections/${requestId}/decision`, {
      decision,
      comments,
    });
    return res.data;
  },
};

// --- Attendance APIs ---
export const attendanceApi = {
  markManual: async (payload: {
    class_id: number;
    date: string;
    method?: string;
    records: Array<{ student_id: number; status: string }>;
  }) => {
    const res = await api.post("/attendance/mark", payload);
    return res.data;
  },
  scanQR: async (class_id: number, qr_token: string) => {
    const res = await api.post("/attendance/scan-qr", { class_id, qr_token });
    return res.data;
  },
  getSessions: async (classId?: number): Promise<AttendanceSessionItem[]> => {
    const res = await api.get("/attendance/sessions", { params: { class_id: classId } });
    return res.data;
  },
  getSessionDetails: async (sessionId: number) => {
    const res = await api.get(`/attendance/sessions/${sessionId}`);
    return res.data;
  },
  finalizeSession: async (sessionId: number) => {
    const res = await api.put(`/attendance/sessions/${sessionId}/finalize`);
    return res.data;
  },
};

// --- Admin & HOD APIs ---
export const adminApi = {
  getDashboardStats: async () => {
    const res = await api.get("/admin/dashboard-stats");
    return res.data;
  },
  getDepartments: async () => {
    const res = await api.get("/admin/departments");
    return res.data;
  },
  createDepartment: async (data: { name: string; code: string; hod_id?: number }) => {
    const res = await api.post("/admin/departments", data);
    return res.data;
  },
  getStudents: async (departmentId?: number) => {
    const res = await api.get("/admin/students", { params: { department_id: departmentId } });
    return res.data;
  },
  createStudent: async (data: any) => {
    const res = await api.post("/admin/students", data);
    return res.data;
  },
  getFaculty: async (departmentId?: number) => {
    const res = await api.get("/admin/faculty", { params: { department_id: departmentId } });
    return res.data;
  },
  createFaculty: async (data: any) => {
    const res = await api.post("/admin/faculty", data);
    return res.data;
  },
  getSubjects: async (departmentId?: number) => {
    const res = await api.get("/admin/subjects", { params: { department_id: departmentId } });
    return res.data;
  },
  createSubject: async (data: any) => {
    const res = await api.post("/admin/subjects", data);
    return res.data;
  },
  getClasses: async () => {
    const res = await api.get("/admin/classes");
    return res.data;
  },
  createClass: async (data: any) => {
    const res = await api.post("/admin/classes", data);
    return res.data;
  },
  enrollStudent: async (classId: number, studentId: number) => {
    const res = await api.post(`/admin/classes/${classId}/enroll?student_id=${studentId}`);
    return res.data;
  },
  getAuditLogs: async (limit: number = 100): Promise<AuditLogItem[]> => {
    const res = await api.get("/admin/audit/logs", { params: { limit } });
    return res.data;
  },
  verifyAuditIntegrity: async () => {
    const res = await api.get("/admin/audit/verify");
    return res.data;
  },
  getEscalations: async (): Promise<CorrectionRequestItem[]> => {
    const res = await api.get("/admin/escalations");
    return res.data;
  },
  decideEscalation: async (
    requestId: number,
    decision: "approved" | "rejected",
    comments?: string
  ) => {
    const res = await api.post(
      `/admin/escalations/${requestId}/decision?decision=${decision}${
        comments ? `&comments=${encodeURIComponent(comments)}` : ""
      }`
    );
    return res.data;
  },
};

// --- Analytics APIs ---
export const analyticsApi = {
  getOverview: async () => {
    const res = await api.get("/analytics/overview");
    return res.data;
  },
};

// --- Notification APIs ---
export const notificationApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await api.get("/notifications");
    return res.data;
  },
  markRead: async (notifId: number) => {
    const res = await api.put(`/notifications/${notifId}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put("/notifications/mark-all-read");
    return res.data;
  },
};
