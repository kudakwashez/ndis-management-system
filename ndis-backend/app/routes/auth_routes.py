from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "support_worker"


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        pw_hash = hash_password(req.password)
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
            (req.email, pw_hash, req.full_name, req.role)
        )
        user_id = cursor.lastrowid
        token = create_access_token({"sub": user_id, "role": req.role})
        return {"access_token": token, "token_type": "bearer", "user": {"id": user_id, "email": req.email, "full_name": req.full_name, "role": req.role}}


@router.post("/login")
def login(req: LoginRequest):
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
        if not user or not verify_password(req.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user = dict(user)
        token = create_access_token({"sub": user["id"], "role": user["role"]})
        return {"access_token": token, "token_type": "bearer", "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}}


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}
