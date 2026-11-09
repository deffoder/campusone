import urllib.request
import json
import sys

BASE_URL = 'http://localhost:8000/api'

def api_call(path, method='GET', data=None, token=None):
    url = f'{BASE_URL}{path}'
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

print("=== STARTING FULL MODULE VERIFICATION ===")

# 1. Admin Module
code, admin_auth = api_call('/auth/login', 'POST', {'email': 'admin@campusone.edu', 'password': 'Admin@123'})
assert code == 200, f"Admin login failed: {admin_auth}"
admin_token = admin_auth['access_token']
print("1. Admin Login: OK (role: admin)")

code, admin_stats = api_call('/admin/dashboard-stats', 'GET', token=admin_token)
assert code == 200, f"Admin stats failed: {admin_stats}"
print(f"2. Admin Dashboard Stats: OK (Students: {admin_stats.get('total_students')}, Faculty: {admin_stats.get('total_faculty')})")

code, audit_verify = api_call('/admin/audit/verify', 'GET', token=admin_token)
assert code == 200 and audit_verify.get('is_valid') is True, f"Audit verification failed: {audit_verify}"
print(f"3. SHA-256 Audit Ledger Verification: OK ({audit_verify.get('message')})")

# 2. Faculty Module
code, fac_auth = api_call('/auth/login', 'POST', {'email': 'faculty1@campusone.edu', 'password': 'Faculty@123'})
assert code == 200, f"Faculty login failed: {fac_auth}"
fac_token = fac_auth['access_token']
print("4. Faculty Login: OK (role: faculty)")

code, classes = api_call('/faculty/me/classes', 'GET', token=fac_token)
assert code == 200 and len(classes) > 0, f"Faculty classes failed: {classes}"
print(f"5. Faculty Classes: OK ({len(classes)} classes assigned)")
class_id = classes[0]['id']

code, class_roster = api_call(f'/faculty/me/classes/{class_id}/students', 'GET', token=fac_token)
assert code == 200, f"Class students failed: {class_roster}"
students_list = class_roster.get('students', [])
print(f"6. Faculty Class Roster: OK ({len(students_list)} enrolled students in class {class_id})")

# 3. Student Module
code, stu_auth = api_call('/auth/login', 'POST', {'email': 'student1@campusone.edu', 'password': 'Student@123'})
assert code == 200, f"Student login failed: {stu_auth}"
stu_token = stu_auth['access_token']
print("7. Student Login: OK (role: student)")

code, stu_dash = api_call('/students/me/dashboard', 'GET', token=stu_token)
assert code == 200, f"Student dashboard failed: {stu_dash}"
print(f"8. Student Dashboard: OK (Attendance {stu_dash.get('overall_percentage')}%, Total classes: {stu_dash.get('total_classes')})")

code, qr_info = api_call('/students/me/qr-token', 'GET', token=stu_token)
assert code == 200, f"QR generation failed: {qr_info}"
qr_token = qr_info['token']
print("9. Student QR Identity Generation: OK (JWT-signed token generated)")

# 4. QR Scanning Attendance
code, scan_res = api_call('/attendance/scan-qr', 'POST', {'class_id': class_id, 'qr_token': qr_token}, token=fac_token)
assert code == 200, f"QR scan attendance failed: {scan_res}"
print(f"10. QR Scanning Attendance Verification: OK ({scan_res.get('message')})")

# 5. Manual Attendance Marking
manual_records = [{'student_id': s['id'], 'status': 'present'} for s in students_list[:2]]
code, manual_res = api_call('/attendance/mark', 'POST', {'class_id': class_id, 'date': '2026-11-09', 'method': 'manual', 'records': manual_records}, token=fac_token)
assert code == 200, f"Manual attendance failed: {manual_res}"
print(f"11. Manual Attendance Marking: OK (Session ID: {manual_res.get('session_id')}, Marked count: {manual_res.get('marked_count')})")

# 6. HOD Review & Escalations
code, hod_auth = api_call('/auth/login', 'POST', {'email': 'hod.cs@campusone.edu', 'password': 'HOD@123'})
assert code == 200, f"HOD login failed: {hod_auth}"
hod_token = hod_auth['access_token']
print("12. HOD Login: OK (role: hod)")

code, escalations = api_call('/admin/escalations', 'GET', token=hod_token)
assert code == 200, f"HOD escalations failed: {escalations}"
print(f"13. HOD Escalations Review: OK ({len(escalations)} pending requests accessible)")

# 7. Student Correction Request Tracking
code, requests_list = api_call('/students/me/correction-requests', 'GET', token=stu_token)
assert code == 200, f"Student correction requests failed: {requests_list}"
print(f"14. Student Correction Request History: OK ({len(requests_list)} existing requests)")

print("\nSUCCESS: ALL 14 CAMPUSONE SYSTEM MODULE TESTS PASSED AGAINST LIVE POSTGRESQL 18!")
