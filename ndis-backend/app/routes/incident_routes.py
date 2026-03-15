from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


class IncidentCreate(BaseModel):
    participant_id: Optional[int] = None
    reported_by_worker_id: Optional[int] = None
    incident_date: str
    incident_type: str
    severity: str = "low"
    description: str
    location: Optional[str] = None
    immediate_action: Optional[str] = None


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    investigation_notes: Optional[str] = None
    corrective_action: Optional[str] = None
    reviewed_by: Optional[str] = None


@router.get("")
def list_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = """SELECT i.*, p.first_name || ' ' || p.last_name as participant_name
                   FROM incidents i
                   LEFT JOIN participants p ON i.participant_id = p.id
                   WHERE 1=1"""
        params: list = []
        if status:
            query += " AND i.status = ?"
            params.append(status)
        if severity:
            query += " AND i.severity = ?"
            params.append(severity)
        query += " ORDER BY i.created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("")
def create_incident(data: IncidentCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO incidents (participant_id, reported_by_worker_id, incident_date, incident_type,
            severity, description, location, immediate_action)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (data.participant_id, data.reported_by_worker_id, data.incident_date, data.incident_type,
             data.severity, data.description, data.location, data.immediate_action)
        )
        incident = conn.execute(
            """SELECT i.*, p.first_name || ' ' || p.last_name as participant_name
               FROM incidents i
               LEFT JOIN participants p ON i.participant_id = p.id
               WHERE i.id = ?""",
            (cursor.lastrowid,)
        ).fetchone()
        return dict(incident)


@router.get("/{incident_id}")
def get_incident(incident_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        incident = conn.execute(
            """SELECT i.*, p.first_name || ' ' || p.last_name as participant_name
               FROM incidents i
               LEFT JOIN participants p ON i.participant_id = p.id
               WHERE i.id = ?""",
            (incident_id,)
        ).fetchone()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        return dict(incident)


@router.put("/{incident_id}")
def update_incident(incident_id: int, data: IncidentUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Incident not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)
        if "status" in updates and updates["status"] == "reviewed":
            updates["review_date"] = "datetime('now')"
        set_parts = []
        values = []
        for k, v in updates.items():
            if v == "datetime('now')":
                set_parts.append(f"{k} = datetime('now')")
            else:
                set_parts.append(f"{k} = ?")
                values.append(v)
        set_clause = ", ".join(set_parts)
        values.append(incident_id)
        conn.execute(f"UPDATE incidents SET {set_clause} WHERE id = ?", values)
        updated = conn.execute(
            """SELECT i.*, p.first_name || ' ' || p.last_name as participant_name
               FROM incidents i
               LEFT JOIN participants p ON i.participant_id = p.id
               WHERE i.id = ?""",
            (incident_id,)
        ).fetchone()
        return dict(updated)
