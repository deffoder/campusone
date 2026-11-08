from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, 
    Text, Date, Time, Float, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    HOD = "hod"
    FACULTY = "faculty"
    STUDENT = "student"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"

class CorrectionStatus(str, enum.Enum):
    PENDING_FACULTY = "pending_faculty"
    PENDING_HOD = "pending_hod"
    APPROVED = "approved"
    REJECTED = "rejected"

class ApprovalDecision(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"

class SessionMethod(str, enum.Enum):
    QR = "qr"
    MANUAL = "manual"

# 1. Users
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, foreign_keys="Faculty.user_id", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor", foreign_keys="AuditLog.actor_id")

# 2. Departments
class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    hod_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    hod = relationship("User", foreign_keys=[hod_id])
    students = relationship("Student", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department")
    subjects = relationship("Subject", back_populates="department")

# 3. Students
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    reg_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    semester = Column(Integer, nullable=False, default=1)
    section = Column(String(10), nullable=False, default="A")

    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    correction_requests = relationship("CorrectionRequest", back_populates="student")
    qr_tokens = relationship("QRToken", back_populates="student", cascade="all, delete-orphan")

# 4. Faculty
class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)

    user = relationship("User", back_populates="faculty_profile", foreign_keys=[user_id])
    department = relationship("Department", back_populates="faculty_members")
    classes = relationship("Class", back_populates="faculty")
    attendance_sessions = relationship("AttendanceSession", back_populates="faculty")

# 5. Subjects
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(30), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False, default=1)
    credits = Column(Integer, nullable=False, default=3)

    department = relationship("Department", back_populates="subjects")
    classes = relationship("Class", back_populates="subject")

# 6. Classes
class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="RESTRICT"), nullable=False)
    section = Column(String(10), nullable=False, default="A")
    semester = Column(Integer, nullable=False, default=1)
    academic_year = Column(String(20), nullable=False, default="2026-2027")

    subject = relationship("Subject", back_populates="classes")
    faculty = relationship("Faculty", back_populates="classes")
    enrollments = relationship("Enrollment", back_populates="class_obj", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="class_obj", cascade="all, delete-orphan")
    attendance_sessions = relationship("AttendanceSession", back_populates="class_obj", cascade="all, delete-orphan")

# 7. Enrollments
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)

    student = relationship("Student", back_populates="enrollments")
    class_obj = relationship("Class", back_populates="enrollments")

# 8. Timetable
class Timetable(Base):
    __tablename__ = "timetable"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(15), nullable=False)  # Monday, Tuesday, etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(50), nullable=False, default="Hall 101")

    class_obj = relationship("Class", back_populates="timetables")

# 9. AttendanceSessions
class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="RESTRICT"), nullable=False)
    date = Column(Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())
    start_time = Column(Time, nullable=False, default=lambda: datetime.now(timezone.utc).time())
    end_time = Column(Time, nullable=True)
    method = Column(SQLEnum(SessionMethod), nullable=False, default=SessionMethod.MANUAL)
    is_finalized = Column(Boolean, default=False, nullable=False)

    class_obj = relationship("Class", back_populates="attendance_sessions")
    faculty = relationship("Faculty", back_populates="attendance_sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

# 10. AttendanceRecords
class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(SQLEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.ABSENT)
    marked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    marked_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
    marker = relationship("User", foreign_keys=[marked_by])
    correction_request = relationship("CorrectionRequest", back_populates="attendance_record", uselist=False)

# 11. CorrectionRequests
class CorrectionRequest(Base):
    __tablename__ = "correction_requests"

    id = Column(Integer, primary_key=True, index=True)
    attendance_record_id = Column(Integer, ForeignKey("attendance_records.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    requested_status = Column(SQLEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT)
    reason = Column(Text, nullable=False)
    status = Column(SQLEnum(CorrectionStatus), nullable=False, default=CorrectionStatus.PENDING_FACULTY)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    attendance_record = relationship("AttendanceRecord", back_populates="correction_request")
    student = relationship("Student", back_populates="correction_requests")
    evidence_files = relationship("EvidenceFile", back_populates="correction_request", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="correction_request", cascade="all, delete-orphan")

# 12. EvidenceFiles
class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(Integer, primary_key=True, index=True)
    correction_request_id = Column(Integer, ForeignKey("correction_requests.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    correction_request = relationship("CorrectionRequest", back_populates="evidence_files")

# 13. Approvals
class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    correction_request_id = Column(Integer, ForeignKey("correction_requests.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    decision = Column(SQLEnum(ApprovalDecision), nullable=False)
    comments = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    level = Column(String(20), nullable=False, default="faculty")  # faculty or hod or admin

    correction_request = relationship("CorrectionRequest", back_populates="approvals")
    approver = relationship("User", foreign_keys=[approver_id])

# 14. AuditLogs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, APPROVE, REJECT
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    prev_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, unique=True, index=True)

    actor = relationship("User", back_populates="audit_logs", foreign_keys=[actor_id])

# 15. Notifications
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="notifications")

# 16. QRTokens
class QRToken(Base):
    __tablename__ = "qr_tokens"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("Student", back_populates="qr_tokens")
