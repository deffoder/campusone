from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.entities import (
    User, UserRole, Department, Student, Faculty, Subject, Class,
    Enrollment, Timetable, AttendanceSession, AttendanceRecord,
    CorrectionRequest, CorrectionStatus, Approval, ApprovalDecision,
    AuditLog, Notification, AttendanceStatus
)
from app.schemas.all_schemas import (
    DepartmentResponse, DepartmentCreate, SubjectResponse, SubjectCreate,
    ClassResponse, ClassCreate, StudentResponse, FacultyResponse,
    AuditLogResponse, AuditVerificationResponse, UserCreate
)
from app.api.deps import require_hod_or_admin, require_admin, get_current_user
from app.utils.audit import record_audit_log, verify_audit_chain

router = APIRouter(prefix="/admin", tags=["admin"])

# --- System Overview / Dashboard ---
@router.get("/dashboard-stats")
def get_admin_dashboard_stats(
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    total_departments = db.query(Department).count()
    total_classes = db.query(Class).count()
    total_sessions = db.query(AttendanceSession).count()
    total_records = db.query(AttendanceRecord).count()
    
    # Correction requests stats
    pending_corrections = db.query(CorrectionRequest).filter(
        CorrectionRequest.status.in_([CorrectionStatus.PENDING_FACULTY, CorrectionStatus.PENDING_HOD])
    ).count()

    # Overall attendance rate across institution
    present_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED])
    ).count()
    overall_rate = (present_records / total_records * 100) if total_records > 0 else 0.0

    # Low attendance students (< 75%)
    students = db.query(Student).all()
    critical_students = 0
    for s in students:
        rec_count = len(s.attendance_records)
        if rec_count > 0:
            att = sum(1 for r in s.attendance_records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED])
            if (att / rec_count) < 0.75:
                critical_students += 1

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_departments": total_departments,
        "total_classes": total_classes,
        "total_sessions": total_sessions,
        "pending_corrections": pending_corrections,
        "overall_attendance_rate": round(overall_rate, 1),
        "critical_students_count": critical_students
    }

# --- Department Management ---
@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    depts = db.query(Department).all()
    results = []
    for d in depts:
        results.append(
            DepartmentResponse(
                id=d.id,
                name=d.name,
                code=d.code,
                hod_id=d.hod_id,
                hod_name=d.hod.email if d.hod else None,
                students_count=len(d.students),
                faculty_count=len(d.faculty_members)
            )
        )
    return results

@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    payload: DepartmentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(
        (Department.name == payload.name) | (Department.code == payload.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")

    dept = Department(name=payload.name, code=payload.code.upper(), hod_id=payload.hod_id)
    db.add(dept)
    db.commit()
    db.refresh(dept)

    record_audit_log(
        db=db,
        table_name="departments",
        record_id=dept.id,
        action="CREATE_DEPARTMENT",
        actor_id=current_user.id,
        new_values={"name": dept.name, "code": dept.code}
    )

    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        hod_id=dept.hod_id,
        hod_name=dept.hod.email if dept.hod else None,
        students_count=0,
        faculty_count=0
    )

# --- Student Management ---
@router.get("/students", response_model=List[StudentResponse])
def get_students(
    department_id: Optional[int] = None,
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    students = query.all()
    return [
        StudentResponse(
            id=s.id,
            user_id=s.user_id,
            reg_number=s.reg_number,
            name=s.name,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            semester=s.semester,
            section=s.section,
            email=s.user.email if s.user else None
        )
        for s in students
    ]

@router.post("/students")
def create_student(
    payload: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not payload.reg_number or not payload.department_id:
        raise HTTPException(status_code=400, detail="Registration number and department are required")

    existing_reg = db.query(Student).filter(Student.reg_number == payload.reg_number).first()
    if existing_reg:
        raise HTTPException(status_code=400, detail="Registration number already registered")

    user = User(
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    student = Student(
        user_id=user.id,
        reg_number=payload.reg_number.upper(),
        name=payload.name,
        department_id=payload.department_id,
        semester=payload.semester or 1,
        section=payload.section or "A"
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    record_audit_log(
        db=db,
        table_name="students",
        record_id=student.id,
        action="CREATE_STUDENT",
        actor_id=current_user.id,
        new_values={"reg_number": student.reg_number, "name": student.name}
    )

    return {"message": "Student created successfully", "student_id": student.id}

# --- Faculty Management ---
@router.get("/faculty", response_model=List[FacultyResponse])
def get_all_faculty(
    department_id: Optional[int] = None,
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Faculty)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    fac_list = query.all()
    return [
        FacultyResponse(
            id=f.id,
            user_id=f.user_id,
            employee_id=f.employee_id,
            name=f.name,
            department_id=f.department_id,
            department_name=f.department.name if f.department else None,
            email=f.user.email if f.user else None
        )
        for f in fac_list
    ]

@router.post("/faculty")
def create_faculty(
    payload: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not payload.employee_id or not payload.department_id:
        raise HTTPException(status_code=400, detail="Employee ID and Department ID are required")

    existing_emp = db.query(Faculty).filter(Faculty.employee_id == payload.employee_id).first()
    if existing_emp:
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    user = User(
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=payload.role if payload.role in [UserRole.FACULTY, UserRole.HOD] else UserRole.FACULTY,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    faculty = Faculty(
        user_id=user.id,
        employee_id=payload.employee_id.upper(),
        name=payload.name,
        department_id=payload.department_id
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)

    record_audit_log(
        db=db,
        table_name="faculty",
        record_id=faculty.id,
        action="CREATE_FACULTY",
        actor_id=current_user.id,
        new_values={"employee_id": faculty.employee_id, "name": faculty.name}
    )

    return {"message": "Faculty member created successfully", "faculty_id": faculty.id}

# --- Subject Management ---
@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(
    department_id: Optional[int] = None,
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    subjects = query.all()
    return [
        SubjectResponse(
            id=s.id,
            name=s.name,
            code=s.code,
            department_id=s.department_id,
            semester=s.semester,
            credits=s.credits,
            department_name=s.department.name if s.department else None
        )
        for s in subjects
    ]

@router.post("/subjects", response_model=SubjectResponse)
def create_subject(
    payload: SubjectCreate,
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Subject).filter(Subject.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")

    sub = Subject(
        name=payload.name,
        code=payload.code.upper(),
        department_id=payload.department_id,
        semester=payload.semester,
        credits=payload.credits
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    record_audit_log(
        db=db,
        table_name="subjects",
        record_id=sub.id,
        action="CREATE_SUBJECT",
        actor_id=current_user.id,
        new_values={"code": sub.code, "name": sub.name}
    )

    return SubjectResponse(
        id=sub.id,
        name=sub.name,
        code=sub.code,
        department_id=sub.department_id,
        semester=sub.semester,
        credits=sub.credits,
        department_name=sub.department.name if sub.department else None
    )

# --- Class & Assignment Management ---
@router.get("/classes", response_model=List[ClassResponse])
def get_classes(
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    classes = db.query(Class).all()
    results = []
    for c in classes:
        enrolled_count = db.query(Enrollment).filter(Enrollment.class_id == c.id).count()
        results.append(
            ClassResponse(
                id=c.id,
                subject_id=c.subject_id,
                faculty_id=c.faculty_id,
                section=c.section,
                semester=c.semester,
                academic_year=c.academic_year,
                subject_name=c.subject.name,
                subject_code=c.subject.code,
                faculty_name=c.faculty.name,
                department_name=c.subject.department.name if c.subject.department else None,
                enrolled_count=enrolled_count
            )
        )
    return results

@router.post("/classes")
def create_class(
    payload: ClassCreate,
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    cls = Class(
        subject_id=payload.subject_id,
        faculty_id=payload.faculty_id,
        section=payload.section,
        semester=payload.semester,
        academic_year=payload.academic_year
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)

    record_audit_log(
        db=db,
        table_name="classes",
        record_id=cls.id,
        action="CREATE_CLASS",
        actor_id=current_user.id,
        new_values={"subject_id": cls.subject_id, "faculty_id": cls.faculty_id, "section": cls.section}
    )

    return {"message": "Class created successfully", "class_id": cls.id}

@router.post("/classes/{class_id}/enroll")
def enroll_student(
    class_id: int,
    student_id: int,
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = db.query(Enrollment).filter(
        Enrollment.class_id == class_id, Enrollment.student_id == student_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this class")

    enr = Enrollment(class_id=class_id, student_id=student_id)
    db.add(enr)
    db.commit()

    return {"message": f"Student {student.name} enrolled in {cls.subject.name} - Section {cls.section}"}

# --- Audit Logs & Verification ---
@router.get("/audit/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(limit).all()
    results = []
    for l in logs:
        actor_name = l.actor.email if l.actor else "SYSTEM"
        if l.actor and l.actor.student_profile:
            actor_name = f"{l.actor.student_profile.name} (Student)"
        elif l.actor and l.actor.faculty_profile:
            actor_name = f"{l.actor.faculty_profile.name} (Faculty)"
            
        results.append(
            AuditLogResponse(
                id=l.id,
                table_name=l.table_name,
                record_id=l.record_id,
                action=l.action,
                actor_id=l.actor_id,
                actor_email=l.actor.email if l.actor else None,
                actor_name=actor_name,
                old_values=l.old_values,
                new_values=l.new_values,
                timestamp=l.timestamp,
                prev_hash=l.prev_hash,
                current_hash=l.current_hash
            )
        )
    return results

@router.get("/audit/verify", response_model=AuditVerificationResponse)
def verify_audit_trail_integrity(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return verify_audit_chain(db)

# --- HOD Correction Escalations ---
@router.get("/escalations")
def get_escalated_corrections(
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    requests = (
        db.query(CorrectionRequest)
        .filter(CorrectionRequest.status == CorrectionStatus.PENDING_HOD)
        .order_by(CorrectionRequest.created_at.desc())
        .all()
    )

    result = []
    for cr in requests:
        rec = cr.attendance_record
        st = cr.student
        files = [{"id": f.id, "filename": f.filename, "filepath": f.filepath} for f in cr.evidence_files]
        approvals = [
            {
                "id": a.id,
                "approver_name": a.approver.email,
                "decision": a.decision.value,
                "comments": a.comments,
                "decided_at": a.decided_at.isoformat(),
                "level": a.level
            }
            for a in cr.approvals
        ]

        result.append({
            "id": cr.id,
            "attendance_record_id": cr.attendance_record_id,
            "student_id": st.id,
            "student_name": st.name,
            "reg_number": st.reg_number,
            "subject_name": rec.session.class_obj.subject.name,
            "subject_code": rec.session.class_obj.subject.code,
            "session_date": rec.session.date.isoformat(),
            "original_status": rec.status.value,
            "requested_status": cr.requested_status.value,
            "reason": cr.reason,
            "status": cr.status.value,
            "created_at": cr.created_at.isoformat(),
            "evidence_files": files,
            "approvals": approvals
        })
    return result

@router.post("/escalations/{request_id}/decision")
def decide_escalated_correction(
    request_id: int,
    decision: ApprovalDecision,
    comments: Optional[str] = None,
    current_user: User = Depends(require_hod_or_admin),
    db: Session = Depends(get_db)
):
    cr = db.query(CorrectionRequest).filter(CorrectionRequest.id == request_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Correction request not found")

    approval = Approval(
        correction_request_id=cr.id,
        approver_id=current_user.id,
        decision=decision,
        comments=comments,
        decided_at=datetime.now(timezone.utc),
        level="hod"
    )
    db.add(approval)

    record = cr.attendance_record
    old_status = record.status.value

    if decision == ApprovalDecision.APPROVED:
        cr.status = CorrectionStatus.APPROVED
        record.status = cr.requested_status
        record_audit_log(
            db=db,
            table_name="attendance_records",
            record_id=record.id,
            action="CORRECTION_APPROVED_BY_HOD",
            actor_id=current_user.id,
            old_values={"status": old_status},
            new_values={"status": record.status.value, "comments": comments}
        )
    elif decision == ApprovalDecision.REJECTED:
        cr.status = CorrectionStatus.REJECTED
        record_audit_log(
            db=db,
            table_name="correction_requests",
            record_id=cr.id,
            action="CORRECTION_REJECTED_BY_HOD",
            actor_id=current_user.id,
            old_values={"status": CorrectionStatus.PENDING_HOD.value},
            new_values={"status": cr.status.value, "comments": comments}
        )

    # Notify student
    notif = Notification(
        user_id=cr.student.user_id,
        title="HOD Correction Review Decision",
        message=f"HOD has marked your attendance correction for {record.session.class_obj.subject.name} as {decision.value}."
    )
    db.add(notif)
    db.commit()

    return {"message": f"Escalated request resolved as {decision.value}", "status": cr.status.value}
