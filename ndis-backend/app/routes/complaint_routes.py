from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


class ComplaintCreate(BaseModel):
    participant_id: Optional[int] = None
    complainant_name: str
    complainant_contact: Optional[str] = None
    category: str
    description: str
    priority: str = "medium"
    assigned_to: Optional[str] = None


class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution: Optional[str] = None


@router.get("")
def list_complaints(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
                   FROM complaints c
                   LEFT JOIN participants p ON c.participant_id = p.id
                   WHERE 1=1"""
        params: list = []
        if status:
            query += " AND c.status = ?"
            params.append(status)
        if priority:
            query += " AND c.priority = ?"
            params.append(priority)
        query += " ORDER BY c.created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("")
def create_complaint(data: ComplaintCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO complaints (participant_id, complainant_name, complainant_contact, category,
            description, priority, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (data.participant_id, data.complainant_name, data.complainant_contact, data.category,
             data.description, data.priority, data.assigned_to)
        )
        complaint = conn.execute(
            """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
               FROM complaints c
               LEFT JOIN participants p ON c.participant_id = p.id
               WHERE c.id = ?""",
            (cursor.lastrowid,)
        ).fetchone()
        return dict(complaint)


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        complaint = conn.execute(
            """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
               FROM complaints c
               LEFT JOIN participants p ON c.participant_id = p.id
               WHERE c.id = ?""",
            (complaint_id,)
        ).fetchone()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        return dict(complaint)


@router.put("/{complaint_id}")
def update_complaint(complaint_id: int, data: ComplaintUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Complaint not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)
        if "status" in updates and updates["status"] == "resolved":
            updates["resolved_date"] = "now_placeholder"
        set_parts = []
        values = []
        for k, v in updates.items():
            if v == "now_placeholder":
                set_parts.append(f"{k} = datetime('now')")
            else:
                set_parts.append(f"{k} = ?")
                values.append(v)
        set_clause = ", ".join(set_parts)
        values.append(complaint_id)
        conn.execute(f"UPDATE complaints SET {set_clause} WHERE id = ?", values)
        updated = conn.execute(
            """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
               FROM complaints c
               LEFT JOIN participants p ON c.participant_id = p.id
               WHERE c.id = ?""",
            (complaint_id,)
        ).fetchone()
        return dict(updated)
