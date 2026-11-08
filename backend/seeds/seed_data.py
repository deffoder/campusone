import sys
import os
from datetime import datetime, timezone, date, time, timedelta

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.security import get_password_hash
from backend.app.models.entities import (
    User, UserRole, Department, Student, Faculty, Subject,
    Class, Enrollment, Timetable, AttendanceSession, AttendanceRecord,
    AttendanceStatus, CorrectionRequest, CorrectionStatus, EvidenceFile,
    Approval, ApprovalDecision, Notification, SessionMethod
)
from backend.app.utils.audit import record_audit_log

def seed():
    print("Beginning CampusOne database seeding...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        admin_check = db.query(User).filter(User.email == "admin@campusone.edu").first()
        if admin_check:
            print("Database already contains demo data. Cleaning up for clean reseed...")
            # We can re-use or continue
            db.close()
            # Clean recreate tables
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()

        print("1. Creating Users & Roles...")
        # 1. Admin
        admin_user = User(
            email="admin@campusone.edu",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)

        # 2. HOD
        hod_user = User(
            email="hod.cs@campusone.edu",
            password_hash=get_password_hash("HOD@123"),
            role=UserRole.HOD,
            is_active=True
        )
        db.add(hod_user)

        # 3. Faculty 1
        faculty1_user = User(
            email="faculty1@campusone.edu",
            password_hash=get_password_hash("Faculty@123"),
            role=UserRole.FACULTY,
            is_active=True
        )
        db.add(faculty1_user)

        # Faculty 2
        faculty2_user = User(
            email="faculty2@campusone.edu",
            password_hash=get_password_hash("Faculty@123"),
            role=UserRole.FACULTY,
            is_active=True
        )
        db.add(faculty2_user)

        # 4. Student 1
        student1_user = User(
            email="student1@campusone.edu",
            password_hash=get_password_hash("Student@123"),
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student1_user)

        # Student 2, 3, 4, 5
        student2_user = User(
            email="student2@campusone.edu",
            password_hash=get_password_hash("Student@123"),
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student2_user)

        student3_user = User(
            email="student3@campusone.edu",
            password_hash=get_password_hash("Student@123"),
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student3_user)

        student4_user = User(
            email="student4@campusone.edu",
            password_hash=get_password_hash("Student@123"),
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student4_user)

        student5_user = User(
            email="student5@campusone.edu",
            password_hash=get_password_hash("Student@123"),
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student5_user)

        db.commit()

        print("2. Creating Departments...")
        dept_cse = Department(name="Computer Science & Engineering", code="CSE", hod_id=hod_user.id)
        dept_ece = Department(name="Electronics & Communication", code="ECE", hod_id=None)
        dept_it = Department(name="Information Technology", code="IT", hod_id=None)
        db.add_all([dept_cse, dept_ece, dept_it])
        db.commit()

        print("3. Creating Faculty & Student Profiles...")
        # Faculty profiles
        hod_profile = Faculty(
            user_id=hod_user.id,
            name="Dr. Alan Turing",
            department_id=dept_cse.id,
            employee_id="FAC-HOD-001"
        )
        fac1_profile = Faculty(
            user_id=faculty1_user.id,
            name="Prof. Ada Lovelace",
            department_id=dept_cse.id,
            employee_id="FAC-CS-101"
        )
        fac2_profile = Faculty(
            user_id=faculty2_user.id,
            name="Prof. Grace Hopper",
            department_id=dept_cse.id,
            employee_id="FAC-CS-102"
        )
        db.add_all([hod_profile, fac1_profile, fac2_profile])

        # Student profiles
        st1_profile = Student(
            user_id=student1_user.id,
            reg_number="RA241100301001",
            name="John Doe",
            department_id=dept_cse.id,
            semester=4,
            section="A"
        )
        st2_profile = Student(
            user_id=student2_user.id,
            reg_number="RA241100301002",
            name="Jane Smith",
            department_id=dept_cse.id,
            semester=4,
            section="A"
        )
        st3_profile = Student(
            user_id=student3_user.id,
            reg_number="RA241100301003",
            name="Alice Johnson",
            department_id=dept_cse.id,
            semester=4,
            section="A"
        )
        st4_profile = Student(
            user_id=student4_user.id,
            reg_number="RA241100301004",
            name="Bob Williams",
            department_id=dept_cse.id,
            semester=4,
            section="A"
        )
        st5_profile = Student(
            user_id=student5_user.id,
            reg_number="RA241100301005",
            name="Charlie Brown",
            department_id=dept_cse.id,
            semester=4,
            section="A"
        )
        db.add_all([st1_profile, st2_profile, st3_profile, st4_profile, st5_profile])
        db.commit()

        print("4. Creating Subjects...")
        sub_dsa = Subject(name="Data Structures & Algorithms", code="CS301", department_id=dept_cse.id, semester=4, credits=4)
        sub_os = Subject(name="Operating Systems", code="CS302", department_id=dept_cse.id, semester=4, credits=4)
        sub_dbms = Subject(name="Database Management Systems", code="CS303", department_id=dept_cse.id, semester=4, credits=3)
        sub_cn = Subject(name="Computer Networks", code="CS304", department_id=dept_cse.id, semester=4, credits=3)
        db.add_all([sub_dsa, sub_os, sub_dbms, sub_cn])
        db.commit()

        print("5. Creating Classes & Assigning Faculty...")
        class_dsa = Class(subject_id=sub_dsa.id, faculty_id=fac1_profile.id, section="A", semester=4, academic_year="2026-2027")
        class_os = Class(subject_id=sub_os.id, faculty_id=fac1_profile.id, section="A", semester=4, academic_year="2026-2027")
        class_dbms = Class(subject_id=sub_dbms.id, faculty_id=fac2_profile.id, section="A", semester=4, academic_year="2026-2027")
        class_cn = Class(subject_id=sub_cn.id, faculty_id=hod_profile.id, section="A", semester=4, academic_year="2026-2027")
        db.add_all([class_dsa, class_os, class_dbms, class_cn])
        db.commit()

        print("6. Creating Timetable Entries...")
        # Timetables for each day of the week
        tt_entries = [
            Timetable(class_id=class_dsa.id, day_of_week="Monday", start_time=time(9, 0), end_time=time(10, 0), room="Lab 301"),
            Timetable(class_id=class_os.id, day_of_week="Monday", start_time=time(10, 15), end_time=time(11, 15), room="Hall 204"),
            Timetable(class_id=class_dbms.id, day_of_week="Monday", start_time=time(11, 30), end_time=time(12, 30), room="Lab 102"),
            Timetable(class_id=class_dsa.id, day_of_week="Wednesday", start_time=time(9, 0), end_time=time(10, 0), room="Lab 301"),
            Timetable(class_id=class_os.id, day_of_week="Wednesday", start_time=time(10, 15), end_time=time(11, 15), room="Hall 204"),
            Timetable(class_id=class_cn.id, day_of_week="Friday", start_time=time(14, 0), end_time=time(15, 0), room="Seminar Hall"),
            Timetable(class_id=class_dsa.id, day_of_week=datetime.now().strftime("%A"), start_time=time(9, 0), end_time=time(10, 0), room="Lab 301"),
            Timetable(class_id=class_os.id, day_of_week=datetime.now().strftime("%A"), start_time=time(11, 0), end_time=time(12, 0), room="Hall 204")
        ]
        db.add_all(tt_entries)
        db.commit()

        print("7. Enrolling Students in Classes...")
        students_all = [st1_profile, st2_profile, st3_profile, st4_profile, st5_profile]
        classes_all = [class_dsa, class_os, class_dbms, class_cn]
        
        for c in classes_all:
            for s in students_all:
                db.add(Enrollment(class_id=c.id, student_id=s.id))
        db.commit()

        print("8. Creating Historical Attendance Sessions & Records...")
        today = date.today()
        # Seed 10 past days of attendance
        for i in range(10, 0, -1):
            past_date = today - timedelta(days=i)
            # Skip Sundays
            if past_date.weekday() == 6:
                continue

            for cls_item in [class_dsa, class_os, class_dbms]:
                sess = AttendanceSession(
                    class_id=cls_item.id,
                    faculty_id=cls_item.faculty_id,
                    date=past_date,
                    start_time=time(9, 30),
                    end_time=time(10, 30),
                    method=SessionMethod.MANUAL if i % 2 == 0 else SessionMethod.QR,
                    is_finalized=True
                )
                db.add(sess)
                db.flush()

                # Mark students
                for s in students_all:
                    # student1 has ~80% attendance, student5 has low attendance (<60%)
                    if s.id == st5_profile.id and i % 2 == 1:
                        status = AttendanceStatus.ABSENT
                    elif s.id == st1_profile.id and i == 3:
                        status = AttendanceStatus.ABSENT  # Absent 3 days ago for correction demo!
                    elif (s.id + i) % 7 == 0:
                        status = AttendanceStatus.ABSENT
                    else:
                        status = AttendanceStatus.PRESENT

                    rec = AttendanceRecord(
                        session_id=sess.id,
                        student_id=s.id,
                        status=status,
                        marked_at=datetime.combine(past_date, time(9, 35)).replace(tzinfo=timezone.utc),
                        marked_by=cls_item.faculty.user_id
                    )
                    db.add(rec)
                    db.flush()

                    # Audit log for historical record
                    record_audit_log(
                        db=db,
                        table_name="attendance_records",
                        record_id=rec.id,
                        action="INITIAL_SEED",
                        actor_id=admin_user.id,
                        old_values=None,
                        new_values={"student_id": s.id, "status": status.value}
                    )
        db.commit()

        print("9. Creating Demo Correction Request with Evidence...")
        # Find student1's absent record from 3 days ago
        absent_rec = (
            db.query(AttendanceRecord)
            .join(AttendanceSession)
            .filter(
                AttendanceRecord.student_id == st1_profile.id,
                AttendanceRecord.status == AttendanceStatus.ABSENT
            )
            .first()
        )

        if absent_rec:
            corr = CorrectionRequest(
                attendance_record_id=absent_rec.id,
                student_id=st1_profile.id,
                requested_status=AttendanceStatus.PRESENT,
                reason="Medical appointment at University Clinic. Doctor's certificate attached.",
                status=CorrectionStatus.PENDING_FACULTY
            )
            db.add(corr)
            db.flush()

            # Dummy evidence file
            upload_dir = os.path.join(os.getcwd(), "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            demo_evidence_path = os.path.join(upload_dir, "medical_certificate_sample.pdf")
            if not os.path.exists(demo_evidence_path):
                with open(demo_evidence_path, "w") as f:
                    f.write("%PDF-1.4 CampusOne Sample Medical Evidence Certificate")

            evidence = EvidenceFile(
                correction_request_id=corr.id,
                filename="medical_certificate_sample.pdf",
                filepath="/uploads/medical_certificate_sample.pdf"
            )
            db.add(evidence)
            db.flush()

            record_audit_log(
                db=db,
                table_name="correction_requests",
                record_id=corr.id,
                action="CREATE_CORRECTION_REQUEST",
                actor_id=student1_user.id,
                old_values={"original_status": AttendanceStatus.ABSENT.value},
                new_values={"requested_status": AttendanceStatus.PRESENT.value, "reason": corr.reason}
            )

        print("10. Creating In-App Notifications...")
        db.add_all([
            Notification(
                user_id=student1_user.id,
                title="Welcome to CampusOne",
                message="Welcome to the next-generation Smart ERP. Track your attendance and access real-time QR check-in.",
                is_read=False
            ),
            Notification(
                user_id=faculty1_user.id,
                title="New Correction Request",
                message="John Doe submitted an attendance correction request for CS301.",
                is_read=False
            ),
            Notification(
                user_id=hod_user.id,
                title="HOD Portal Ready",
                message="Your department dashboard and approval escalations are operational.",
                is_read=False
            ),
            Notification(
                user_id=admin_user.id,
                title="System Initialized",
                message="CampusOne ERP system initialized with cryptographic audit chaining.",
                is_read=True
            )
        ])
        db.commit()

        print("SUCCESS: Database seeding completed successfully with full academic hierarchy!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
