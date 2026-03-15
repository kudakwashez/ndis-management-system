from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/workers", tags=["workers"])


class WorkerCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    role: str = "support_worker"
    wwcc_number: Optional[str] = None
    wwcc_expiry: Optional[str] = None
    police_check_date: Optional[str] = None
    first_aid_expiry: Optional[str] = None
    ndis_screening_number: Optional[str] = None
    ndis_screening_expiry: Optional[str] = None


class WorkerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    wwcc_number: Optional[str] = None
    wwcc_expiry: Optional[str] = None
    police_check_date: Optional[str] = None
    first_aid_expiry: Optional[str] = None
    ndis_screening_number: Optional[str] = None
    ndis_screening_expiry: Optional[str] = None


@router.get("")
def list_workers(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = "SELECT * FROM workers WHERE 1=1"
        params: list = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if search:
            query += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("")
def create_worker(data: WorkerCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM workers WHERE email = ?", (data.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Worker email already exists")
        cursor = conn.execute(
            """INSERT INTO workers (first_name, last_name, email, phone, role, wwcc_number, wwcc_expiry,
            police_check_date, first_aid_expiry, ndis_screening_number, ndis_screening_expiry)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (data.first_name, data.last_name, data.email, data.phone, data.role,
             data.wwcc_number, data.wwcc_expiry, data.police_check_date, data.first_aid_expiry,
             data.ndis_screening_number, data.ndis_screening_expiry)
        )
        worker = conn.execute("SELECT * FROM workers WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(worker)


@router.get("/{worker_id}")
def get_worker(worker_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        w = conn.execute("SELECT * FROM workers WHERE id = ?", (worker_id,)).fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Worker not found")
        return dict(w)


@router.put("/{worker_id}")
def update_worker(worker_id: int, data: WorkerUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM workers WHERE id = ?", (worker_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Worker not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [worker_id]
        conn.execute(f"UPDATE workers SET {set_clause}, updated_at = datetime('now') WHERE id = ?", values)
        updated = conn.execute("SELECT * FROM workers WHERE id = ?", (worker_id,)).fetchone()
        return dict(updated)


@router.get("/{worker_id}/certifications")
def get_worker_certifications(worker_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        w = conn.execute("SELECT * FROM workers WHERE id = ?", (worker_id,)).fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Worker not found")
        w = dict(w)
        certs = []
        if w["wwcc_number"]:
            certs.append({"type": "Working With Children Check", "number": w["wwcc_number"], "expiry": w["wwcc_expiry"], "status": "valid" if w["wwcc_expiry"] and w["wwcc_expiry"] >= "2026-01-01" else "expired"})
        if w["police_check_date"]:
            certs.append({"type": "Police Check", "date": w["police_check_date"], "status": "completed"})
        if w["first_aid_expiry"]:
            certs.append({"type": "First Aid Certificate", "expiry": w["first_aid_expiry"], "status": "valid" if w["first_aid_expiry"] and w["first_aid_expiry"] >= "2026-01-01" else "expired"})
        if w["ndis_screening_number"]:
            certs.append({"type": "NDIS Worker Screening", "number": w["ndis_screening_number"], "expiry": w["ndis_screening_expiry"], "status": "valid" if w["ndis_screening_expiry"] and w["ndis_screening_expiry"] >= "2026-01-01" else "expired"})
        return {"worker_id": worker_id, "worker_name": f"{w['first_name']} {w['last_name']}", "certifications": certs}
