import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.main import app

client = TestClient(app)

class TestCampusOneEndpoints(unittest.TestCase):
    def test_01_health_check(self):
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("status"), "healthy")

    def test_02_login_student(self):
        res = client.post("/api/auth/login", json={
            "email": "student1@campusone.edu",
            "password": "Student@123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "student")
        self.assertEqual(data["reg_number"], "RA241100301001")

    def test_03_login_faculty(self):
        res = client.post("/api/auth/login", json={
            "email": "faculty1@campusone.edu",
            "password": "Faculty@123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "faculty")

    def test_04_login_admin(self):
        res = client.post("/api/auth/login", json={
            "email": "admin@campusone.edu",
            "password": "Admin@123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "admin")

    def test_05_student_dashboard_endpoints(self):
        # 1. Login student
        login_res = client.post("/api/auth/login", json={
            "email": "student1@campusone.edu",
            "password": "Student@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get dashboard stats
        dash_res = client.get("/api/students/me/dashboard", headers=headers)
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.json()
        self.assertIn("overall_percentage", dash_data)
        self.assertIn("subjects", dash_data)

        # 3. Get QR token
        qr_res = client.get("/api/students/me/qr-token", headers=headers)
        self.assertEqual(qr_res.status_code, 200)
        qr_data = qr_res.json()
        self.assertIn("token", qr_data)
        self.assertIn("qr_base64", qr_data)

    def test_06_faculty_attendance_endpoints(self):
        # 1. Login faculty
        login_res = client.post("/api/auth/login", json={
            "email": "faculty1@campusone.edu",
            "password": "Faculty@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get classes
        classes_res = client.get("/api/faculty/me/classes", headers=headers)
        self.assertEqual(classes_res.status_code, 200)
        classes = classes_res.json()
        self.assertGreater(len(classes), 0)
        class_id = classes[0]["id"]

        # 3. Get students enrolled
        roster_res = client.get(f"/api/faculty/me/classes/{class_id}/students", headers=headers)
        self.assertEqual(roster_res.status_code, 200)
        roster = roster_res.json()
        self.assertIn("students", roster)
        self.assertGreater(len(roster["students"]), 0)

    def test_07_admin_audit_verification(self):
        login_res = client.post("/api/auth/login", json={
            "email": "admin@campusone.edu",
            "password": "Admin@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        verify_res = client.get("/api/admin/audit/verify", headers=headers)
        self.assertEqual(verify_res.status_code, 200)
        result = verify_res.json()
        self.assertTrue(result["is_valid"], f"Audit failure: {result}")

if __name__ == "__main__":
    unittest.main()
