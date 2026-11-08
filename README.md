# CampusOne - Smart ERP Enhancement System with Secure Attendance Correction

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1.svg?logo=postgresql)](https://www.postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Executive Summary
**CampusOne** is a higher-education Smart ERP enhancement platform designed to solve modern campus attendance vulnerabilities, attendance proxying, and unverified post-facto corrections.

Featuring **ephemeral 30-minute dynamic QR passes**, **browser-based camera scanning** powered by `html5-qrcode`, a **multi-tier correction approval pipeline (Student → Faculty → HOD)**, and a **cryptographic SHA-256 tamper-evident linked audit trail**, CampusOne guarantees 100% verifiable institutional attendance integrity.

---

## 🏛️ System Architecture

```
                       +------------------------------+
                       |   CampusOne Web Application  |
                       |  (React 19 + Vite + Tailwind)|
                       +------------------------------+
                                      |
                           (HTTP / REST + Bearer JWT)
                                      v
                       +------------------------------+
                       |    FastAPI Python Backend    |
                       |     - RBAC & JWT Auth        |
                       |     - Attendance Engine      |
                       |     - Multi-Tier Workflow    |
                       |     - SHA-256 Linked Ledger  |
                       +------------------------------+
                                      |
                         (SQLAlchemy 2.0 ORM + Alembic)
                                      v
                       +------------------------------+
                       |    PostgreSQL 18 Database    |
                       |  16 Relational Core Tables   |
                       |  Immutable Audit Hash Chain  |
                       +------------------------------+
```

---

## 🎨 Color System & Design Language
CampusOne adheres strictly to a clean, authoritative higher-education palette:
- **Primary**: `#2563EB` (Vibrant University Blue)
- **Secondary**: `#1E40AF` (Deep Navy Accent)
- **Background**: `#FFFFFF` (Pristine White)
- **Surface**: `#F5F8FF` (Cool Slate Tint)
- **Primary Text**: `#172554` (Dark Navy Charcoal)
- **Secondary Text**: `#64748B` (Cool Muted Slate)
- **Borders**: `#E2E8F0`

---

## 🔑 Key Modules & Capabilities

### 1. Student Portal
- **Dashboard Overview**: Overall attendance %, attended vs conducted sessions, deficit indicator (exact classes needed to reach 75% exam eligibility).
- **Subject-Wise Analysis**: Course-level progress bars and interactive Recharts visualizations.
- **Session History & Calendar**: Detailed chronological ledger of every lecture with marked status (Present, Absent, Late, Excused).
- **Attendance Correction Appeal**: Submit correction requests with written justification and attached documentary evidence (PDF, PNG, JPG).
- **Dynamic 30-Minute QR Pass**: Rotating cryptographic token generated for seamless in-class scanner check-in with countdown timer.

### 2. Faculty Portal
- **Streamlined Workflow**: Distraction-free interface focused on teaching and attendance.
- **Daily Schedule & My Classes**: Timetable view and enrolled student directories.
- **Take Attendance Suite**:
  - **Manual Roster Grid**: Instant Present / Absent toggles with "Mark All Present" shortcut.
  - **HTML5 Camera QR Scanner**: Scans student QR passes on mobile rear cameras or desktop webcams with duplicate detection.
- **Correction Review**: Review student appeals with attached documentary evidence; approve, reject, or escalate to HOD.
- **Session Locking**: Finalize sessions to prevent retroactive alterations.

### 3. HOD & Administration Portal
- **Institutional Oversight**: Global attendance rates, total student/faculty counts, real-time alerts for at-risk students (< 75%).
- **Academic Management**: Department creation, course/subject catalogs, class scheduling, and student enrollments.
- **HOD Escalation Desk**: Adjudicate high-level or disputed correction appeals escalated by faculty members.
- **Cryptographic Audit Ledger (SHA-256)**:
  - Every attendance creation, update, and correction approval is chained to the preceding entry using SHA-256 hashing.
  - Interactive "Run Cryptographic Audit" engine that validates ledger integrity and instantly flags manual SQL tampering.
- **Analytics & Reporting**: Interactive Recharts trendlines, department breakdown, and CSV report export.

---

## ⚡ Quick Start & Execution

### 1. Database
Ensure PostgreSQL 18 service (`postgresql-x64-18`) is running:
- Database: `campusone_db`
- Host: `localhost:5432`
- User: `postgres`
- Password: `campusone_secure_2024`

### 2. Run Backend
```powershell
cd c:\Users\cvumj\OneDrive\Desktop\CampusOne
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger UI available at: `http://localhost:8000/docs`

### 3. Run Frontend
```powershell
cd c:\Users\cvumj\OneDrive\Desktop\CampusOne\frontend
npm run dev
```
Application accessible at: `http://localhost:5173`

---

## 👥 Demo Logins

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@campusone.edu` | `Admin@123` |
| **HOD** | `hod.cs@campusone.edu` | `HOD@123` |
| **Faculty** | `faculty1@campusone.edu` | `Faculty@123` |
| **Student** | `student1@campusone.edu` | `Student@123` |

*(The login screen also provides 1-click fill buttons for instant testing).*

---

## 🛡️ Testing & Verification
All unit tests and end-to-end integration tests can be verified using:
```powershell
.\backend\venv\Scripts\python.exe backend\tests\test_backend.py
.\backend\venv\Scripts\python.exe backend\tests\test_api_endpoints.py
```
And frontend build verification:
```powershell
cd frontend; npm run build
```
