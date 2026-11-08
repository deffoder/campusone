# CampusOne - Production Deployment & Hardening Guide

## 1. Overview
CampusOne is designed for high availability and tamper resistance in university environments. This guide outlines standard procedures for deploying CampusOne in production environments.

---

## 2. Infrastructure Architecture
```
[Client Web Browser / Mobile Phone]
                 |
        (HTTPS Port 443)
                 v
   [Nginx / Reverse Proxy Load Balancer]
        |                        |
        v (/api, /uploads)        v (/*)
[Gunicorn/Uvicorn Workers]   [Vite SPA Static Build (dist/)]
(FastAPI, 4+ workers)
        |
        v (Port 5432)
[PostgreSQL 18 Master Cluster]
```

---

## 3. Production Environment Hardening

### 3.1 Environment Variables (.env)
Never commit secrets or production credentials into git repositories.
Create `/path/to/backend/.env`:
```env
POSTGRES_SERVER=db.internal.campus.edu
POSTGRES_USER=campusone_prod_user
POSTGRES_PASSWORD=<STRONG_GENERATED_64_CHAR_PASSWORD>
POSTGRES_DB=campusone_db
POSTGRES_PORT=5432

SECRET_KEY=<CRYPTOGRAPHICALLY_SECURE_RANDOM_SECRET_KEY>
ACCESS_TOKEN_EXPIRE_MINUTES=720
QR_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=uploads
```

### 3.2 Systemd Service for FastAPI (Linux)
```ini
[Unit]
Description=CampusOne FastAPI Application Server
After=network.target postgresql.service

[Service]
User=campusone
WorkingDirectory=/opt/campusone
ExecStart=/opt/campusone/backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3.3 Windows Service Alternative (NSSM)
On Windows Server environments:
```powershell
nssm install CampusOneAPI "C:\Users\cvumj\OneDrive\Desktop\CampusOne\backend\venv\Scripts\python.exe" "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --workers 4"
nssm start CampusOneAPI
```

---

## 4. Cryptographic Ledger Backup & Integrity Safeguards
1. **Immutable Audit Trail**: The `audit_logs` table forms a linked list where `current_hash = SHA256(prev_hash + ...)`.
2. **Preventing Direct DB Alterations**: Revoke `UPDATE` and `DELETE` privileges on `audit_logs` for application database users:
   ```sql
   REVOKE UPDATE, DELETE ON TABLE audit_logs FROM campusone_user;
   ```
3. **Scheduled Ledger Integrity Audits**:
   Execute automated cron or task scheduler jobs invoking the verification script:
   ```powershell
   .\backend\venv\Scripts\python.exe -c "from backend.app.core.database import SessionLocal; from backend.app.utils.audit import verify_audit_chain; res = verify_audit_chain(SessionLocal()); assert res['is_valid'], 'Tamper Alert!'"
   ```
