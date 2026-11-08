import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, students, faculty, attendance, admin, analytics, notifications

# Ensure upload directory exists
upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
os.makedirs(upload_dir, exist_ok=True)

# Create tables if not existing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded evidence files directory
app.mount(f"/{settings.UPLOAD_DIR}", StaticFiles(directory=upload_dir), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(faculty.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "database": "PostgreSQL 18"
    }

@app.get("/")
def root():
    return {
        "message": "CampusOne Smart ERP API is operational",
        "docs": "/docs",
        "health": "/health"
    }
