from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.entities import (
    User, Faculty, Class, Enrollment, Student, Timetable, CorrectionRequest,
    AttendanceRecord, AttendanceSession, Approval, ApprovalDecision, CorrectionStatus,
    AttendanceStatus, Notification
)
from backend.app.schemas.all_schemas import (
    ClassResponse, TimetableItem, CorrectionDecisionRequest
)
from backend.app.api.deps import require_faculty
from backend.app.utils.audit import record_audit_log

router = APIRouter(prefix="/faculty", tags=["faculty"])

@router.get("/me/classes", response_model=List[ClassResponse])
def get_faculty_classes(
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    faculty = current_user.faculty_profile
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    classes = db.query(Class).filter(Class.faculty_id == faculty.id).all()
    results = []
    for c in classes:
        enrolled_count = db.query(Enrollment).filter(Enrollment.class_id == c.id).count()
        tts = [
            TimetableItem(
                id=t.id,
                day_of_week=t.day_of_week,
                start_time=t.start_time,
                end_time=t.end_time,
                room=t.room
            )
            for t in c.timetables
        ]
        results.append(
            ClassResponse(
                id=c.id,
                subject_id=c.subject_id,
                faculty_id=c.faculty_id,
                section=c.section,
                semester=c.semester,
                academic_year=c.academic_year,
                subject_name=c.subject.name if c.subject else "N/A",
                subject_code=c.subject.code if c.subject else "N/A",
                faculty_name=faculty.name,
                department_name=faculty.department.name if faculty.department else "N/A",
                enrolled_count=enrolled_count,
                timetables=tts
            )
        )
    return results

@router.get("/me/classes/{class_id}/students")
def get_enrolled_students(
    class_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    enrollments = db.query(Enrollment).filter(Enrollment.class_id == class_id).all()
    students_data = []
    for e in enrollments:
        st = e.student
        students_data.append({
            "id": st.id,
            "user_id": st.user_id,
            "name": st.name,
            "reg_number": st.reg_number,
            "semester": st.semester,
            "section": st.section,
            "email": st.user.email if st.user else None
        })
    return {
        "class_id": cls.id,
        "subject_name": cls.subject.name,
        "subject_code": cls.subject.code,
        "section": cls.section,
        "total_enrolled": len(students_data),
        "students": students_data
    }

@router.get("/me/today-schedule")
def get_today_schedule(
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    faculty = current_user.faculty_profile
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    today_name = datetime.now().strftime("%A")  # e.g., Monday
    classes = db.query(Class).filter(Class.faculty_id == faculty.id).all()
    class_ids = [c.id for c in classes]

    schedules = (
        db.query(Timetable)
        .filter(Timetable.class_id.in_(class_ids), Timetable.day_of_week == today_name)
        .order_by(Timetable.start_time.asc())
        .all()
    )

    items = []
    for s in schedules:
        c = s.class_obj
        enrolled_count = db.query(Enrollment).filter(Enrollment.class_id == c.id).count()
        # Check if session exists for today
        today_date = datetime.now(timezone.utc).date()
        existing_session = (
            db.query(AttendanceSession)
            .filter(AttendanceSession.class_id == c.id, AttendanceSession.date == today_date)
            .first()
        )

        items.append({
            "timetable_id": s.id,
            "class_id": c.id,
            "subject_name": c.subject.name,
            "subject_code": c.subject.code,
            "section": c.section,
            "start_time": s.start_time.strftime("%H:%M"),
            "end_time": s.end_time.strftime("%H:%M"),
            "room": s.room,
            "enrolled_count": enrolled_count,
            "has_session_today": existing_session is not None,
            "session_id": existing_session.id if existing_session else None,
            "is_finalized": existing_session.is_finalized if existing_session else False
        })
    return {"day": today_name, "classes": items}

@router.get("/me/corrections")
def get_faculty_corrections(
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    faculty = current_user.faculty_profile
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    # Find classes taught by this faculty
    faculty_class_ids = [c.id for c in faculty.classes]

    requests = (
        db.query(CorrectionRequest)
        .join(AttendanceRecord)
        .join(AttendanceSession)
        .filter(AttendanceSession.class_id.in_(faculty_class_ids))
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

@router.post("/me/corrections/{request_id}/decision")
def decide_correction_request(
    request_id: int,
    payload: CorrectionDecisionRequest,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    cr = db.query(CorrectionRequest).filter(CorrectionRequest.id == request_id).first()
    if not cr:
        raise HTTPException(status_code=404, detail="Correction request not found")

    if cr.status not in [CorrectionStatus.PENDING_FACULTY, CorrectionStatus.PENDING_HOD]:
        raise HTTPException(status_code=400, detail="Request has already been finalized")

    # Record approval
    approval = Approval(
        correction_request_id=cr.id,
        approver_id=current_user.id,
        decision=payload.decision,
        comments=payload.comments,
        decided_at=datetime.now(timezone.utc),
        level="faculty"
    )
    db.add(approval)

    record = cr.attendance_record
    old_status = record.status.value

    if payload.decision == ApprovalDecision.APPROVED:
        cr.status = CorrectionStatus.APPROVED
        record.status = cr.requested_status
        record_audit_log(
            db=db,
            table_name="attendance_records",
            record_id=record.id,
            action="CORRECTION_APPROVED_BY_FACULTY",
            actor_id=current_user.id,
            old_values={"status": old_status},
            new_values={"status": record.status.value, "comments": payload.comments}
        )
    elif payload.decision == ApprovalDecision.REJECTED:
        cr.status = CorrectionStatus.REJECTED
        record_audit_log(
            db=db,
            table_name="correction_requests",
            record_id=cr.id,
            action="CORRECTION_REJECTED_BY_FACULTY",
            actor_id=current_user.id,
            old_values={"status": CorrectionStatus.PENDING_FACULTY.value},
            new_values={"status": cr.status.value, "comments": payload.comments}
        )
    elif payload.decision == ApprovalDecision.ESCALATED:
        cr.status = CorrectionStatus.PENDING_HOD
        approval.level = "escalated_to_hod"
        record_audit_log(
            db=db,
            table_name="correction_requests",
            record_id=cr.id,
            action="CORRECTION_ESCALATED_TO_HOD",
            actor_id=current_user.id,
            old_values={"status": CorrectionStatus.PENDING_FACULTY.value},
            new_values={"status": cr.status.value, "comments": payload.comments}
        )

    # Notify student
    student_user_id = cr.student.user_id
    notif = Notification(
        user_id=student_user_id,
        title="Attendance Correction Update",
        message=f"Your request for {record.session.class_obj.subject.name} on {record.session.date} was marked as {payload.decision.value}."
    )
    db.add(notif)
    db.commit()

    return {"message": f"Correction request marked as {payload.decision.value}", "status": cr.status.value}
