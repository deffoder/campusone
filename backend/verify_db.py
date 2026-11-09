import sys
sys.path.insert(0, '.')
from app.core.config import settings
from app.core.database import engine, SessionLocal
from sqlalchemy import text
from app.models.entities import User
from app.core.security import verify_password

print("=== DB Configuration Inspection ===")
print("Host:", settings.POSTGRES_SERVER)
print("Port:", settings.POSTGRES_PORT)
print("User:", settings.POSTGRES_USER)
print("Database:", settings.POSTGRES_DB)
url_safe = settings.get_database_url()
if ":" in url_safe and "@" in url_safe:
    pre, post = url_safe.split(":", 2)[0:2], url_safe.split("@", 1)[1]
    print("Database URL (redacted):", f"postgresql+psycopg2://{settings.POSTGRES_USER}:****@{post}")

print("\n=== Live PostgreSQL Connection Test ===")
try:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT current_database(), current_user, version()")).fetchone()
        print("Connected Database:", row[0])
        print("Connected User:", row[1])
        print("PostgreSQL Version:", row[2])
except Exception as e:
    print("Connection FAILED:", e)
    sys.exit(1)

print("\n=== Table and Migration Inspection ===")
with engine.connect() as conn:
    tables = [r[0] for r in conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"))]
    print(f"Total Public Tables: {len(tables)}")
    print("Tables:", tables)
    alembic_ver = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    print("Alembic Current Version:", alembic_ver)

print("\n=== Demo Accounts & Password Verification ===")
test_accounts = [
    ("admin@campusone.edu", "Admin@123"),
    ("hod.cs@campusone.edu", "HOD@123"),
    ("faculty1@campusone.edu", "Faculty@123"),
    ("student1@campusone.edu", "Student@123")
]

db = SessionLocal()
for email, raw_pwd in test_accounts:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"❌ User NOT found: {email}")
        continue
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    is_valid = verify_password(raw_pwd, user.password_hash)
    hash_len = len(user.password_hash) if user.password_hash else 0
    print(f"Account: {email} | Role: {role_str} | Active: {user.is_active} | Hash valid: {is_valid} | Hash length: {hash_len}")
db.close()
