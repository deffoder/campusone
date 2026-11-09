import os
import shutil
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_qr_token
from app.models.entities import (
    User, Student, Enrollment, Class, AttendanceRecord, AttendanceSession,
    CorrectionRequest, EvidenceFile, QRToken, AttendanceStatus, CorrectionStatus,
    Subject, UserRole
)
from app.schemas.all_schemas import (
    StudentSummaryStats, SubjectAttendanceStat, AttendanceRecordResponse,
    CorrectionRequestResponse, QRTokenResponse
)
from app.api.deps import require_student, get_current_user
from app.utils.qr import generate_qr_base64
from app.utils.audit import record_audit_log

router = APIRouter(prefix="/students", tags=["students"])

@router.get("/me/dashboard", response_model=StudentSummaryStats)
def get_student_dashboard(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Get student's enrolled classes
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    class_ids = [e.class_id for e in enrollments]

    # Calculate subject-level attendance
    subject_stats = []
    total_inst_classes = 0
    total_attended_classes = 0
    total_absent_classes = 0

    for eid in class_ids:
        cls = db.query(Class).filter(Class.id == eid).first()
        if not cls or not cls.subject:
            continue
        
        # All attendance records for this student in this class
        records = (
            db.query(AttendanceRecord)
            .join(AttendanceSession)
            .filter(
                AttendanceSession.class_id == cls.id,
                AttendanceRecord.student_id == student.id
            )
            .all()
        )
        total_cls = len(records)
        attended_cls = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED])
        absent_cls = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        
        total_inst_classes += total_cls
        total_attended_classes += attended_cls
        total_absent_classes += absent_cls

        pct = (attended_cls / total_cls * 100) if total_cls > 0 else 100.0
        color = "#10B981" if pct >= 75 else "#EF4444" if pct < 65 else "#F59E0B"

        subject_stats.append(
            SubjectAttendanceStat(
                subject_id=cls.subject.id,
                subject_name=cls.subject.name,
                subject_code=cls.subject.code,
                total_classes=total_cls,
                attended_classes=attended_cls,
                percentage=round(pct, 1),
                status_color=color
            )
        )

    overall_pct = (total_attended_classes / total_inst_classes * 100) if total_inst_classes > 0 else 100.0
    
    # Classes needed to reach 75%
    # (attended + x) / (total + x) >= 0.75 => x >= (0.75*total - attended) / 0.25
    needed = 0
    if total_inst_classes > 0 and overall_pct < 75.0:
        needed = max(0, int((0.75 * total_inst_classes - total_attended_classes) / 0.25 + 0.99))

    alert = "Safe" if overall_pct >= 75 else "Warning: Below 75% Attendance Requirement"

    return StudentSummaryStats(
        total_classes=total_inst_classes,
        attended_classes=total_attended_classes,
        absent_classes=total_absent_classes,
        overall_percentage=round(overall_pct, 1),
        subjects=subject_stats,
        status_alert=alert,
        classes_needed_for_75=needed
    )

@router.get("/me/attendance", response_model=List[AttendanceRecordResponse])
def get_student_attendance_history(
    subject_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    query = (
        db.query(AttendanceRecord)
        .join(AttendanceSession)
        .join(Class)
        .join(Subject)
        .filter(AttendanceRecord.student_id == student.id)
    )

    if subject_id:
        query = query.filter(Class.subject_id == subject_id)
    if status_filter:
        query = query.filter(AttendanceRecord.status == status_filter)

    records = query.order_by(AttendanceSession.date.desc(), AttendanceSession.start_time.desc()).all()

    result = []
    for r in records:
        corr = db.query(CorrectionRequest).filter(CorrectionRequest.attendance_record_id == r.id).first()
        result.append(
            AttendanceRecordResponse(
                id=r.id,
                session_id=r.session_id,
                student_id=student.id,
                student_name=student.name,
                reg_number=student.reg_number,
                status=r.status,
                marked_at=r.marked_at,
                session_date=r.session.date,
                subject_name=r.session.class_obj.subject.name,
                subject_code=r.session.class_obj.subject.code,
                class_section=r.session.class_obj.section,
                has_correction=corr is not None,
                correction_status=corr.status.value if corr else None
            )
        )
    return result

@router.get("/me/qr-token")
def get_student_qr_token(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Invalidate older unused tokens or check active token
    now = datetime.now(timezone.utc)
    active_token_record = (
        db.query(QRToken)
        .filter(
            QRToken.student_id == student.id,
            QRToken.is_used == False,
            QRToken.expires_at > now
        )
        .order_by(QRToken.id.desc())
        .first()
    )

    if active_token_record:
        token_str = active_token_record.token
        expires_at = active_token_record.expires_at
    else:
        expires_delta = timedelta(seconds=settings.QR_TOKEN_EXPIRE_SECONDS)
        expires_at = now + expires_delta
        token_str = create_qr_token(student_id=student.id, student_reg=student.reg_number, expires_delta=expires_delta)
        
        token_rec = QRToken(
            student_id=student.id,
            token=token_str,
            expires_at=expires_at,
            is_used=False
        )
        db.add(token_rec)
        db.commit()

    qr_base64 = generate_qr_base64(token_str)

    return {
        "token": token_str,
        "expires_at": expires_at.isoformat(),
        "student_name": student.name,
        "reg_number": student.reg_number,
        "qr_base64": qr_base64,
        "validity_seconds": settings.QR_TOKEN_EXPIRE_SECONDS
    }

@router.post("/me/correction-request")
def submit_correction_request(
    attendance_record_id: int = Form(...),
    requested_status: str = Form("present"),
    reason: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == attendance_record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    if record.student_id != student.id:
        raise HTTPException(status_code=403, detail="Record belongs to another student")

    # Check if duplicate request exists
    existing = db.query(CorrectionRequest).filter(CorrectionRequest.attendance_record_id == record.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Correction request already filed for this session")

    # Create correction request
    corr_req = CorrectionRequest(
        attendance_record_id=record.id,
        student_id=student.id,
        requested_status=AttendanceStatus(requested_status.lower()),
        reason=reason,
        status=CorrectionStatus.PENDING_FACULTY
    )
    db.add(corr_req)
    db.commit()
    db.refresh(corr_req)

    # Handle file upload if provided
    if file and file.filename:
        upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
        os.makedirs(upload_dir, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        dest_path = os.path.join(upload_dir, unique_filename)
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        evidence = EvidenceFile(
            correction_request_id=corr_req.id,
            filename=file.filename,
            filepath=f"/{settings.UPLOAD_DIR}/{unique_filename}"
        )
        db.add(evidence)
        db.commit()

    # Log into audit chain
    record_audit_log(
        db=db,
        table_name="correction_requests",
        record_id=corr_req.id,
        action="CREATE_CORRECTION_REQUEST",
        actor_id=current_user.id,
        old_values={"original_status": record.status.value},
        new_values={"requested_status": requested_status, "reason": reason}
    )

    return {"message": "Correction request submitted successfully", "request_id": corr_req.id}

@router.get("/me/correction-requests")
def get_student_correction_requests(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    requests = (
        db.query(CorrectionRequest)
        .filter(CorrectionRequest.student_id == student.id)
        .order_by(CorrectionRequest.created_at.desc())
        .all()
    )

    result = []
    for cr in requests:
        rec = cr.attendance_record
        files = [{"id": f.id, "filename": f.filename, "filepath": f.filepath, "uploaded_at": f.uploaded_at.isoformat()} for f in cr.evidence_files]
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
            "student_id": student.id,
            "student_name": student.name,
            "reg_number": student.reg_number,
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
