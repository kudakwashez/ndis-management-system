from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/participants", tags=["participants"])


class ParticipantCreate(BaseModel):
    first_name: str
    last_name: str
    ndis_number: str
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    plan_start_date: Optional[str] = None
    plan_end_date: Optional[str] = None
    core_supports_budget: float = 0
    capacity_building_budget: float = 0
    notes: Optional[str] = None


class ParticipantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    plan_start_date: Optional[str] = None
    plan_end_date: Optional[str] = None
    core_supports_budget: Optional[float] = None
    capacity_building_budget: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_participants(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = "SELECT * FROM participants WHERE 1=1"
        params: list = []
        if status:
            query += " AND status = ?"
            params.append(status)
        if search:
            query += " AND (first_name LIKE ? OR last_name LIKE ? OR ndis_number LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("")
def create_participant(data: ParticipantCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM participants WHERE ndis_number = ?", (data.ndis_number,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="NDIS number already exists")
        cursor = conn.execute(
            """INSERT INTO participants (first_name, last_name, ndis_number, date_of_birth, phone, email, address,
            plan_start_date, plan_end_date, core_supports_budget, capacity_building_budget, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (data.first_name, data.last_name, data.ndis_number, data.date_of_birth, data.phone, data.email,
             data.address, data.plan_start_date, data.plan_end_date, data.core_supports_budget,
             data.capacity_building_budget, data.notes)
        )
        participant = conn.execute("SELECT * FROM participants WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(participant)


@router.get("/{participant_id}")
def get_participant(participant_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        p = conn.execute("SELECT * FROM participants WHERE id = ?", (participant_id,)).fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Participant not found")
        return dict(p)


@router.put("/{participant_id}")
def update_participant(participant_id: int, data: ParticipantUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM participants WHERE id = ?", (participant_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Participant not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [participant_id]
        conn.execute(f"UPDATE participants SET {set_clause}, updated_at = datetime('now') WHERE id = ?", values)
        updated = conn.execute("SELECT * FROM participants WHERE id = ?", (participant_id,)).fetchone()
        return dict(updated)


@router.delete("/{participant_id}")
def delete_participant(participant_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM participants WHERE id = ?", (participant_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Participant not found")
        conn.execute("DELETE FROM participants WHERE id = ?", (participant_id,))
        return {"message": "Participant deleted"}


@router.get("/{participant_id}/budget")
def get_participant_budget(participant_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        p = conn.execute("SELECT * FROM participants WHERE id = ?", (participant_id,)).fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Participant not found")
        p = dict(p)
        return {
            "participant_id": p["id"],
            "participant_name": f"{p['first_name']} {p['last_name']}",
            "plan_start_date": p["plan_start_date"],
            "plan_end_date": p["plan_end_date"],
            "core_supports": {
                "budget": p["core_supports_budget"],
                "used": p["core_supports_used"],
                "remaining": p["core_supports_budget"] - p["core_supports_used"],
                "percentage_used": round((p["core_supports_used"] / p["core_supports_budget"] * 100) if p["core_supports_budget"] > 0 else 0, 1)
            },
            "capacity_building": {
                "budget": p["capacity_building_budget"],
                "used": p["capacity_building_used"],
                "remaining": p["capacity_building_budget"] - p["capacity_building_used"],
                "percentage_used": round((p["capacity_building_used"] / p["capacity_building_budget"] * 100) if p["capacity_building_budget"] > 0 else 0, 1)
            },
            "total_budget": p["core_supports_budget"] + p["capacity_building_budget"],
            "total_used": p["core_supports_used"] + p["capacity_building_used"],
        }
