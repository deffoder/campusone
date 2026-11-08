from datetime import datetime, timezone, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import decode_token
from backend.app.models.entities import (
    User, AttendanceSession, AttendanceRecord, AttendanceStatus, SessionMethod,
    Class, Enrollment, Student, QRToken
)
from backend.app.schemas.all_schemas import (
    MarkAttendanceRequest, QRScanRequest, AttendanceSessionResponse, AttendanceRecordResponse
)
from backend.app.api.deps import require_faculty
from backend.app.utils.audit import record_audit_log

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/mark")
def mark_manual_attendance(
    payload: MarkAttendanceRequest,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    cls = db.query(Class).filter(Class.id == payload.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Find or create session for class & date
    session = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.class_id == payload.class_id,
            AttendanceSession.date == payload.date
        )
        .first()
    )

    if not session:
        session = AttendanceSession(
            class_id=payload.class_id,
            faculty_id=cls.faculty_id,
            date=payload.date,
            start_time=datetime.now(timezone.utc).time(),
            method=payload.method,
            is_finalized=False
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    elif session.is_finalized:
        raise HTTPException(status_code=400, detail="Attendance session has already been finalized and locked")

    updated_count = 0
    created_count = 0

    for item in payload.records:
        rec = (
            db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.student_id == item.student_id
            )
            .first()
        )

        now = datetime.now(timezone.utc)
        if rec:
            old_status = rec.status.value
            rec.status = item.status
            rec.marked_at = now
            rec.marked_by = current_user.id
            updated_count += 1
            record_audit_log(
                db=db,
                table_name="attendance_records",
                record_id=rec.id,
                action="MANUAL_UPDATE",
                actor_id=current_user.id,
                old_values={"status": old_status},
                new_values={"status": item.status.value}
            )
        else:
            rec = AttendanceRecord(
                session_id=session.id,
                student_id=item.student_id,
                status=item.status,
                marked_at=now,
                marked_by=current_user.id
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            created_count += 1
            record_audit_log(
                db=db,
                table_name="attendance_records",
                record_id=rec.id,
                action="MANUAL_CREATE",
                actor_id=current_user.id,
                old_values=None,
                new_values={"status": item.status.value}
            )

    db.commit()
    return {
        "message": "Attendance recorded successfully",
        "session_id": session.id,
        "created": created_count,
        "updated": updated_count
    }

@router.post("/scan-qr")
def scan_qr_attendance(
    payload: QRScanRequest,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    decoded = decode_token(payload.qr_token)
    if not decoded:
        raise HTTPException(status_code=400, detail="Invalid QR code or signature")

    if decoded.get("type") != "qr_attendance_token":
        raise HTTPException(status_code=400, detail="Invalid token type")

    student_id = int(decoded.get("sub"))
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Verify class exists
    cls = db.query(Class).filter(Class.id == payload.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify student is enrolled in this class
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == cls.id, Enrollment.student_id == student.id)
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=400,
            detail=f"Student {student.name} ({student.reg_number}) is NOT enrolled in this class"
        )

    # Find or create today's session
    today = datetime.now(timezone.utc).date()
    session = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.class_id == cls.id,
            AttendanceSession.date == today
        )
        .first()
    )

    if not session:
        session = AttendanceSession(
            class_id=cls.id,
            faculty_id=cls.faculty_id,
            date=today,
            start_time=datetime.now(timezone.utc).time(),
            method=SessionMethod.QR,
            is_finalized=False
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    elif session.is_finalized:
        raise HTTPException(status_code=400, detail="Session is locked and finalized")

    # Check if already marked
    existing_rec = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.student_id == student.id
        )
        .first()
    )

    now = datetime.now(timezone.utc)
    if existing_rec:
        if existing_rec.status == AttendanceStatus.PRESENT:
            return {
                "message": f"Student {student.name} was ALREADY scanned & marked Present",
                "already_marked": True,
                "student_name": student.name,
                "reg_number": student.reg_number,
                "status": "present",
                "marked_at": existing_rec.marked_at.isoformat()
            }
        else:
            old_st = existing_rec.status.value
            existing_rec.status = AttendanceStatus.PRESENT
            existing_rec.marked_at = now
            existing_rec.marked_by = current_user.id
            db.commit()
            record_audit_log(
                db=db,
                table_name="attendance_records",
                record_id=existing_rec.id,
                action="QR_SCAN_UPDATE",
                actor_id=current_user.id,
                old_values={"status": old_st},
                new_values={"status": "present"}
            )
            return {
                "message": f"Student {student.name} marked Present via QR Scan",
                "already_marked": False,
                "student_name": student.name,
                "reg_number": student.reg_number,
                "status": "present",
                "marked_at": now.isoformat()
            }

    # Create new record
    new_rec = AttendanceRecord(
        session_id=session.id,
        student_id=student.id,
        status=AttendanceStatus.PRESENT,
        marked_at=now,
        marked_by=current_user.id
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)

    record_audit_log(
        db=db,
        table_name="attendance_records",
        record_id=new_rec.id,
        action="QR_SCAN_CREATE",
        actor_id=current_user.id,
        old_values=None,
        new_values={"status": "present"}
    )

    return {
        "message": f"Student {student.name} successfully marked Present via QR Scan",
        "already_marked": False,
        "student_name": student.name,
        "reg_number": student.reg_number,
        "status": "present",
        "marked_at": now.isoformat()
    }

@router.get("/sessions", response_model=List[AttendanceSessionResponse])
def get_attendance_sessions(
    class_id: Optional[int] = None,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    query = db.query(AttendanceSession)
    if class_id:
        query = query.filter(AttendanceSession.class_id == class_id)
    elif current_user.role != "admin":
        if current_user.faculty_profile:
            query = query.filter(AttendanceSession.faculty_id == current_user.faculty_profile.id)

    sessions = query.order_by(AttendanceSession.date.desc(), AttendanceSession.start_time.desc()).all()
    results = []
    for s in sessions:
        total = len(s.records)
        present = sum(1 for r in s.records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED])
        absent = sum(1 for r in s.records if r.status == AttendanceStatus.ABSENT)
        results.append(
            AttendanceSessionResponse(
                id=s.id,
                class_id=s.class_id,
                subject_name=s.class_obj.subject.name,
                subject_code=s.class_obj.subject.code,
                faculty_name=s.faculty.name,
                date=s.date,
                start_time=s.start_time,
                end_time=s.end_time,
                method=s.method,
                is_finalized=s.is_finalized,
                total_marked=total,
                present_count=present,
                absent_count=absent
            )
        )
    return results

@router.get("/sessions/{session_id}")
def get_session_details(
    session_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")

    cls = session.class_obj
    enrollments = db.query(Enrollment).filter(Enrollment.class_id == cls.id).all()
    records_map = {r.student_id: r for r in session.records}

    students_roster = []
    for e in enrollments:
        st = e.student
        rec = records_map.get(st.id)
        students_roster.append({
            "student_id": st.id,
            "reg_number": st.reg_number,
            "name": st.name,
            "status": rec.status.value if rec else "unmarked",
            "marked_at": rec.marked_at.isoformat() if rec else None,
            "record_id": rec.id if rec else None
        })

    return {
        "session_id": session.id,
        "class_id": cls.id,
        "subject_name": cls.subject.name,
        "subject_code": cls.subject.code,
        "section": cls.section,
        "date": session.date.isoformat(),
        "start_time": session.start_time.strftime("%H:%M:%S"),
        "method": session.method.value,
        "is_finalized": session.is_finalized,
        "students": students_roster
    }

@router.put("/sessions/{session_id}/finalize")
def finalize_session(
    session_id: int,
    current_user: User = Depends(require_faculty),
    db: Session = Depends(get_db)
):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_finalized = True
    session.end_time = datetime.now(timezone.utc).time()
    db.commit()

    record_audit_log(
        db=db,
        table_name="attendance_sessions",
        record_id=session.id,
        action="FINALIZE_SESSION",
        actor_id=current_user.id,
        old_values={"is_finalized": False},
        new_values={"is_finalized": True}
    )

    return {"message": "Attendance session finalized and locked against modification"}
