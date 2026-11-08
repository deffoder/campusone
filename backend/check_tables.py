import sys
sys.path.insert(0, '.')
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"))
    tables = [r[0] for r in result]
    print(f"Tables ({len(tables)}):", tables)
    
    for table in tables:
        cnt = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        print(f"  {table}: {cnt} rows")
