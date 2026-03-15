from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["agreements"])


class AgreementCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: str
    end_date: str
    total_value: float = 0
    status: str = "draft"


class AgreementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_value: Optional[float] = None
    status: Optional[str] = None


@router.get("/participants/{participant_id}/agreements")
def list_agreements(participant_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM service_agreements WHERE participant_id = ? ORDER BY created_at DESC",
            (participant_id,)
        ).fetchall()
        return [dict(r) for r in rows]


@router.post("/participants/{participant_id}/agreements")
def create_agreement(participant_id: int, data: AgreementCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        p = conn.execute("SELECT id FROM participants WHERE id = ?", (participant_id,)).fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Participant not found")
        cursor = conn.execute(
            """INSERT INTO service_agreements (participant_id, title, description, start_date, end_date, total_value, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (participant_id, data.title, data.description, data.start_date, data.end_date, data.total_value, data.status)
        )
        agreement = conn.execute("SELECT * FROM service_agreements WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(agreement)


@router.put("/agreements/{agreement_id}")
def update_agreement(agreement_id: int, data: AgreementUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM service_agreements WHERE id = ?", (agreement_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Agreement not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [agreement_id]
        conn.execute(f"UPDATE service_agreements SET {set_clause} WHERE id = ?", values)
        updated = conn.execute("SELECT * FROM service_agreements WHERE id = ?", (agreement_id,)).fetchone()
        return dict(updated)
