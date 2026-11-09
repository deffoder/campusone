import sys
sys.path.insert(0, '.')
from app.core.database import engine, SessionLocal
from sqlalchemy import text
from app.models.entities import User, UserRole

with engine.connect() as conn:
    tables = [r[0] for r in conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"))]
    print(f"Table count: {len(tables)}")
    for t in tables:
        count = conn.execute(text(f"SELECT count(*) FROM {t};")).scalar()
        print(f"  - {t}: {count} rows")

print("\nTesting persistence with insert/read/cleanup:")
db = SessionLocal()
test_email = 'temp_persist_test@campusone.edu'
try:
    test_user = User(
        email=test_email,
        password_hash='temp_hash_value',
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    created_id = test_user.id
    print(f"Persistence insert OK: Created user ID {created_id}")

    retrieved = db.query(User).filter(User.id == created_id).first()
    print(f"Persistence read OK: Found user {retrieved.email}")

    db.delete(retrieved)
    db.commit()
    print("Persistence cleanup OK: Removed test user")
except Exception as e:
    db.rollback()
    print(f"Persistence test failed: {e}")
    sys.exit(1)
finally:
    db.close()
