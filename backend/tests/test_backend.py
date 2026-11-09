import sys
import os
import unittest
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_qr_token, decode_token
)
from app.models.entities import User, Student, Faculty, AttendanceRecord, CorrectionRequest
from app.utils.audit import calculate_audit_hash, verify_audit_chain, record_audit_log

class TestCampusOneBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_password_hashing(self):
        password = "AdminSecure@2024"
        hashed = get_password_hash(password)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_02_jwt_tokens(self):
        token = create_access_token(subject=1, role="admin")
        payload = decode_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload.get("sub"), "1")
        self.assertEqual(payload.get("role"), "admin")
        self.assertEqual(payload.get("type"), "access_token")

    def test_03_qr_attendance_tokens(self):
        qr_tok = create_qr_token(student_id=42, student_reg="RA241100301001")
        decoded = decode_token(qr_tok)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.get("sub"), "42")
        self.assertEqual(decoded.get("reg_number"), "RA241100301001")
        self.assertEqual(decoded.get("type"), "qr_attendance_token")

    def test_04_sha256_hash_chaining(self):
        # Genesis hash test
        prev = "0" * 64
        now = datetime.now(timezone.utc)
        h1 = calculate_audit_hash(prev, "attendance_records", 1, "CREATE", 1, now, None, '{"status": "present"}')
        self.assertEqual(len(h1), 64)
        
        # Second chained hash
        h2 = calculate_audit_hash(h1, "attendance_records", 1, "UPDATE", 2, now, '{"status": "present"}', '{"status": "excused"}')
        self.assertEqual(len(h2), 64)
        self.assertNotEqual(h1, h2)

    def test_05_audit_ledger_integrity(self):
        result = verify_audit_chain(self.db)
        self.assertTrue(result["is_valid"], f"Audit chain broken: {result.get('message')}")
        self.assertGreater(result["total_records"], 0, "Audit ledger should contain seed records")

    def test_06_demo_accounts_exist(self):
        emails = [
            "admin@campusone.edu",
            "hod.cs@campusone.edu",
            "faculty1@campusone.edu",
            "student1@campusone.edu"
        ]
        for email in emails:
            user = self.db.query(User).filter(User.email == email).first()
            self.assertIsNotNone(user, f"Demo account {email} not found")
            self.assertTrue(user.is_active)

if __name__ == "__main__":
    unittest.main()
