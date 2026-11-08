from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date, time
from backend.app.models.entities import UserRole, AttendanceStatus, CorrectionStatus, ApprovalDecision, SessionMethod

# --- Auth & User Schemas ---
class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str
    profile_id: Optional[int] = None
    department_name: Optional[str] = None
    reg_number: Optional[str] = None
    employee_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    name: str
    department_id: Optional[int] = None
    reg_number: Optional[str] = None
    employee_id: Optional[str] = None
    semester: Optional[int] = 1
    section: Optional[str] = "A"

class UserResponse(UserBase):
    id: int
    created_at: datetime
    name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Department Schemas ---
class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentCreate(DepartmentBase):
    hod_id: Optional[int] = None

class DepartmentResponse(DepartmentBase):
    id: int
    hod_id: Optional[int] = None
    hod_name: Optional[str] = None
    students_count: Optional[int] = 0
    faculty_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    name: str
    code: str
    department_id: int
    semester: int = 1
    credits: int = 3

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Student & Faculty Profiles ---
class StudentResponse(BaseModel):
    id: int
    user_id: int
    reg_number: str
    name: str
    department_id: int
    department_name: Optional[str] = None
    semester: int
    section: str
    email: Optional[str] = None

    class Config:
        from_attributes = True

class FacultyResponse(BaseModel):
    id: int
    user_id: int
    employee_id: str
    name: str
    department_id: int
    department_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True

# --- Class & Timetable Schemas ---
class ClassBase(BaseModel):
    subject_id: int
    faculty_id: int
    section: str = "A"
    semester: int = 1
    academic_year: str = "2026-2027"

class ClassCreate(ClassBase):
    pass

class TimetableItem(BaseModel):
    id: Optional[int] = None
    day_of_week: str
    start_time: time
    end_time: time
    room: str = "Hall 101"

    class Config:
        from_attributes = True

class ClassResponse(ClassBase):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    faculty_name: Optional[str] = None
    department_name: Optional[str] = None
    enrolled_count: Optional[int] = 0
    timetables: List[TimetableItem] = []

    class Config:
        from_attributes = True

# --- Attendance Schemas ---
class MarkAttendanceItem(BaseModel):
    student_id: int
    status: AttendanceStatus

class MarkAttendanceRequest(BaseModel):
    class_id: int
    date: date
    method: SessionMethod = SessionMethod.MANUAL
    records: List[MarkAttendanceItem]

class QRScanRequest(BaseModel):
    class_id: int
    qr_token: str

class AttendanceRecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    student_name: str
    reg_number: str
    status: AttendanceStatus
    marked_at: datetime
    session_date: date
    subject_name: str
    subject_code: str
    class_section: str
    has_correction: bool = False
    correction_status: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceSessionResponse(BaseModel):
    id: int
    class_id: int
    subject_name: str
    subject_code: str
    faculty_name: str
    date: date
    start_time: time
    end_time: Optional[time] = None
    method: SessionMethod
    is_finalized: bool
    total_marked: int = 0
    present_count: int = 0
    absent_count: int = 0

    class Config:
        from_attributes = True

# --- Correction Request Schemas ---
class EvidenceFileResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ApprovalItemResponse(BaseModel):
    id: int
    approver_name: str
    decision: ApprovalDecision
    comments: Optional[str] = None
    decided_at: datetime
    level: str

    class Config:
        from_attributes = True

class CorrectionRequestCreate(BaseModel):
    attendance_record_id: int
    requested_status: AttendanceStatus = AttendanceStatus.PRESENT
    reason: str

class CorrectionDecisionRequest(BaseModel):
    decision: ApprovalDecision
    comments: Optional[str] = None

class CorrectionRequestResponse(BaseModel):
    id: int
    attendance_record_id: int
    student_id: int
    student_name: str
    reg_number: str
    subject_name: str
    subject_code: str
    session_date: date
    original_status: AttendanceStatus
    requested_status: AttendanceStatus
    reason: str
    status: CorrectionStatus
    created_at: datetime
    evidence_files: List[EvidenceFileResponse] = []
    approvals: List[ApprovalItemResponse] = []

    class Config:
        from_attributes = True

# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    table_name: str
    record_id: int
    action: str
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    actor_name: Optional[str] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    timestamp: datetime
    prev_hash: str
    current_hash: str

    class Config:
        from_attributes = True

class AuditVerificationResponse(BaseModel):
    total_records: int
    is_valid: bool
    broken_at_id: Optional[int] = None
    message: str

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Student Stats / Analytics ---
class SubjectAttendanceStat(BaseModel):
    subject_id: int
    subject_name: str
    subject_code: str
    total_classes: int
    attended_classes: int
    percentage: float
    status_color: str

class StudentSummaryStats(BaseModel):
    total_classes: int
    attended_classes: int
    absent_classes: int
    overall_percentage: float
    subjects: List[SubjectAttendanceStat]
    status_alert: str
    classes_needed_for_75: int

class QRTokenResponse(BaseModel):
    token: str
    expires_at: datetime
    student_name: str
    reg_number: str
