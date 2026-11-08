# CampusOne - Environment Setup & Execution Guide

## Prerequisites & Environment
- **Operating System**: Windows 11 (PowerShell)
- **Node.js**: v24.20.0+ (npm 11.19.0+)
- **Python**: 3.14.5+ (`py` command on Windows)
- **Database**: PostgreSQL 18 (`postgresql-x64-18` service)

---

## 1. PostgreSQL Database Configuration
CampusOne is configured to connect to PostgreSQL 18 running on localhost.

1. **Verify PostgreSQL Service**:
   ```powershell
   Get-Service postgresql-x64-18
   ```

2. **Database Credentials**:
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: `campusone_secure_2024`
   - Database: `campusone_db`

3. **Verify Database Connection**:
   ```powershell
   $env:PGPASSWORD = "campusone_secure_2024"
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d campusone_db -c "SELECT current_database();"
   ```

---

## 2. Backend Setup & Startup

1. **Activate Virtual Environment**:
   ```powershell
   cd c:\Users\cvumj\OneDrive\Desktop\CampusOne
   .\backend\venv\Scripts\activate
   ```

2. **Verify Database Tables & Seed Realistic Academic Data**:
   ```powershell
   .\backend\venv\Scripts\python.exe backend\seeds\seed_data.py
   ```

3. **Run Automated Test Suite**:
   ```powershell
   .\backend\venv\Scripts\python.exe backend\tests\test_backend.py
   .\backend\venv\Scripts\python.exe backend\tests\test_api_endpoints.py
   ```

4. **Launch the FastAPI API Server**:
   ```powershell
   .\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API Documentation available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 3. Frontend Setup & Startup

1. **Navigate to Frontend Directory**:
   ```powershell
   cd c:\Users\cvumj\OneDrive\Desktop\CampusOne\frontend
   ```

2. **Verify Production Build**:
   ```powershell
   npm run build
   ```

3. **Start Development Server**:
   ```powershell
   npm run dev
   ```
   Access the web application at: [http://localhost:5173](http://localhost:5173)

---

## 4. Pre-Configured Demo Accounts

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campusone.edu` | `Admin@123` | Institutional metrics, manage departments/courses, verify SHA-256 audit ledger |
| **HOD (CSE)** | `hod.cs@campusone.edu` | `HOD@123` | Department oversight, review and decide escalated student appeals |
| **Faculty** | `faculty1@campusone.edu` | `Faculty@123` | Conduct QR & manual attendance, manage classes, review correction requests |
| **Student** | `student1@campusone.edu` | `Student@123` | Track attendance stats, 30-min dynamic QR pass, submit correction requests with file proof |

*(Note: The login screen contains 1-click quick fill buttons for each demo account).*
