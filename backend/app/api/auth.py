from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.entities import User, UserRole, Student, Faculty
from backend.app.schemas.all_schemas import TokenSchema, LoginRequest, UserResponse
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def _build_token_response(user: User, db: Session) -> TokenSchema:
    name = user.email
    profile_id = None
    dept_name = None
    reg_number = None
    employee_id = None
    
    if user.role == UserRole.STUDENT and user.student_profile:
        name = user.student_profile.name
        profile_id = user.student_profile.id
        reg_number = user.student_profile.reg_number
        if user.student_profile.department:
            dept_name = user.student_profile.department.name
    elif user.role in (UserRole.FACULTY, UserRole.HOD) and user.faculty_profile:
        name = user.faculty_profile.name
        profile_id = user.faculty_profile.id
        employee_id = user.faculty_profile.employee_id
        if user.faculty_profile.department:
            dept_name = user.faculty_profile.department.name
    elif user.role == UserRole.ADMIN:
        name = "Administrator"

    access_token = create_access_token(subject=user.id, role=user.role.value)
    
    return TokenSchema(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        user_id=user.id,
        name=name,
        email=user.email,
        profile_id=profile_id,
        department_name=dept_name,
        reg_number=reg_number,
        employee_id=employee_id
    )

@router.post("/login", response_model=TokenSchema)
def login_with_json(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")
    
    return _build_token_response(user, db)

@router.post("/token", response_model=TokenSchema)
def login_with_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    return _build_token_response(user, db)

@router.get("/me")
def read_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _build_token_response(current_user, db)
