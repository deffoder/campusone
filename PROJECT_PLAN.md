# CampusOne - Project Execution Plan

## 1. Project Overview
CampusOne is a next-generation Smart ERP Enhancement System engineered for higher education institutions, featuring an enterprise-grade attendance tracking and secure attendance correction workflow with cryptographic SHA-256 audit chaining.

## 2. Technical Stack
- **Frontend**: React 18 / 19, TypeScript, Vite, Tailwind CSS v3, React Router v6, Axios, Recharts, Lucide React, html5-qrcode, QR code generation.
- **Backend**: FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, Alembic, PostgreSQL 18 (`campusone_db`), Python-Jose (JWT), Passlib (Bcrypt), Aiofiles, Pillow.
- **Security & Integrity**: JWT-based stateless RBAC, SHA-256 tamper-evident hash chaining for attendance correction audits, time-bound QR tokens, strict role permission enforcement.

## 3. Phases & Roadmap

### Phase 0: Repository Setup & Architecture
- Git repository initialization.
- Gitignore and documentation: `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `DEVELOPMENT_LOG.md`.
- Commit: `phase-0: inspect repository and establish project architecture`.

### Phase 1: Foundation
- Vite + React + TypeScript frontend scaffold with Tailwind CSS v3 theme matching CampusOne design system.
- FastAPI backend scaffold with virtual environment, database session engine, security utils.
- SQLAlchemy models covering all 16 core entities:
  - Users, Departments, Students, Faculty, Subjects, Classes, Enrollments, Timetable, AttendanceSessions, AttendanceRecords, CorrectionRequests, EvidenceFiles, Approvals, AuditLogs, Notifications, QRTokens.
- Alembic database migration scripts.
- Database seeding with realistic academic hierarchy (HODs, Faculty, Students, Departments, Courses, Sessions, Attendance history).
- Commit: `phase-1: establish CampusOne application foundation`.

### Phase 2: Auth + Responsive Navigation
- JWT authentication endpoints (`/api/auth/login`, `/api/auth/me`).
- Frontend AuthContext, persistent token handling, Axios interceptors.
- Modern login page with CampusOne branding (Blue `#2563EB` and White `#FFFFFF` palette).
- Role-based routing guard (Student, Faculty, Admin/HOD).
- Fully responsive navigation layout: desktop sidebar and mobile header/drawer.
- Commit: `phase-2: implement responsive UI and role-based authentication`.

### Phase 3: Student Dashboard
- High-level attendance summary (overall percentage, classes attended vs conducted, required classes for 75% threshold).
- Subject-wise breakdown with Recharts pie and bar visualizations.
- Attendance history calendar / timeline with filter by subject/status.
- Secure correction request creation dialog with reason and evidence file upload.
- Student-specific QR token generation (time-limited 30-minute rotating token for in-class scanning).
- Real-time notification drawer.
- Commit: `phase-3: implement student dashboard and attendance features`.

### Phase 4: Faculty Dashboard
- Simplified faculty interface: streamlined, distraction-free workflow.
- Today's classes overview with quick action buttons.
- "My Classes" management and student enrollment rosters.
- Take Attendance suite:
  - Mobile QR code scanning powered by `html5-qrcode` (facing rear camera).
  - Manual Attendance toggle interface (bulk present/absent with instantaneous save).
- Attendance session history with edit/finalize locks.
- Correction request review interface (pending requests, student evidence preview, 1-click approve/reject with notes).
- Commit: `phase-4: implement faculty dashboard and QR/manual attendance`.

### Phase 5: Administration & Management
- Unified Admin & HOD dashboard: institution metrics, low attendance alerts, department-level aggregations.
- Management modules for:
  - Students (CRUD, department/section filter, enrollment).
  - Faculty (CRUD, department assignments).
  - Departments & Subjects (codes, credits, semester allocation).
  - Classes & Timetable scheduling.
- Faculty subject/class assignment engine.
- Multi-tier correction approvals (HOD escalation for long-absent or disputed corrections).
- Commit: `phase-5: implement administration and approval management`.

### Phase 6: Secure Attendance Correction & Audit Integrity
- End-to-end multi-tier approval lifecycle: Student request → Faculty review → HOD escalation → Finalized state.
- SHA-256 blockchain-style hash chaining:
  - `current_hash = SHA256(prev_hash + table_name + record_id + action + actor_id + timestamp + payload)`
- Cryptographic verification endpoint and UI viewer allowing admins to audit chain integrity.
- Tamper-evident immutable audit log viewer with search and verification badges.
- Commit: `phase-6: implement secure attendance correction and audit integrity`.

### Phase 7: Analytics & Real-Time Notifications
- Comprehensive Recharts analytics:
  - Monthly attendance trend lines.
  - Department comparison bar charts.
  - High-risk / low-attendance student identification table.
- In-app notification center (badge counters, mark as read, event triggers for request submissions, approvals, rejections).
- Exportable CSV reports.
- Commit: `phase-7: implement analytics and notifications`.

### Phase 8: Testing & Verification
- Frontend production build verification (`npm run build`).
- Backend automated test suite and schema verification.
- Cross-role end-to-end workflow validation.
- Responsive design validation across mobile, tablet, and desktop viewports.
- Commit: `phase-8: complete application testing and bug fixes`.

### Phase 9: Production Preparation & Documentation
- Production readiness configuration (CORS, secret rotation instructions, static file serving).
- `SETUP_REQUIRED.md`, `DEPLOYMENT_GUIDE.md`, and master `README.md`.
- Commit: `phase-9: prepare CampusOne for production deployment`.
