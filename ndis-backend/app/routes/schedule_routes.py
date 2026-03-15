from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from datetime import date

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


class ScheduleCreate(BaseModel):
    participant_id: int
    worker_id: int
    service_type: str
    scheduled_date: str
    start_time: str
    end_time: str
    notes: Optional[str] = None


class ScheduleUpdate(BaseModel):
    worker_id: Optional[int] = None
    service_type: Optional[str] = None
    scheduled_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
def list_schedules(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    worker_id: Optional[int] = Query(None),
    participant_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = """SELECT s.*, p.first_name || ' ' || p.last_name as participant_name,
                   w.first_name || ' ' || w.last_name as worker_name
                   FROM schedules s
                   JOIN participants p ON s.participant_id = p.id
                   JOIN workers w ON s.worker_id = w.id
                   WHERE 1=1"""
        params: list = []
        if date_from:
            query += " AND s.scheduled_date >= ?"
            params.append(date_from)
        if date_to:
            query += " AND s.scheduled_date <= ?"
            params.append(date_to)
        if worker_id:
            query += " AND s.worker_id = ?"
            params.append(worker_id)
        if participant_id:
            query += " AND s.participant_id = ?"
            params.append(participant_id)
        if status:
            query += " AND s.status = ?"
            params.append(status)
        query += " ORDER BY s.scheduled_date, s.start_time"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("")
def create_schedule(data: ScheduleCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        p = conn.execute("SELECT id FROM participants WHERE id = ?", (data.participant_id,)).fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Participant not found")
        w = conn.execute("SELECT id FROM workers WHERE id = ?", (data.worker_id,)).fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Worker not found")
        cursor = conn.execute(
            """INSERT INTO schedules (participant_id, worker_id, service_type, scheduled_date, start_time, end_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (data.participant_id, data.worker_id, data.service_type, data.scheduled_date, data.start_time, data.end_time, data.notes)
        )
        schedule = conn.execute(
            """SELECT s.*, p.first_name || ' ' || p.last_name as participant_name,
               w.first_name || ' ' || w.last_name as worker_name
               FROM schedules s
               JOIN participants p ON s.participant_id = p.id
               JOIN workers w ON s.worker_id = w.id
               WHERE s.id = ?""",
            (cursor.lastrowid,)
        ).fetchone()
        return dict(schedule)


@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, data: ScheduleUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Schedule not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [schedule_id]
        conn.execute(f"UPDATE schedules SET {set_clause} WHERE id = ?", values)
        updated = conn.execute(
            """SELECT s.*, p.first_name || ' ' || p.last_name as participant_name,
               w.first_name || ' ' || w.last_name as worker_name
               FROM schedules s
               JOIN participants p ON s.participant_id = p.id
               JOIN workers w ON s.worker_id = w.id
               WHERE s.id = ?""",
            (schedule_id,)
        ).fetchone()
        return dict(updated)


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Schedule not found")
        conn.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
        return {"message": "Schedule deleted"}


@router.get("/today")
def get_today_schedules(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    with get_db() as conn:
        rows = conn.execute(
            """SELECT s.*, p.first_name || ' ' || p.last_name as participant_name,
               w.first_name || ' ' || w.last_name as worker_name
               FROM schedules s
               JOIN participants p ON s.participant_id = p.id
               JOIN workers w ON s.worker_id = w.id
               WHERE s.scheduled_date = ?
               ORDER BY s.start_time""",
            (today,)
        ).fetchall()
        return [dict(r) for r in rows]
