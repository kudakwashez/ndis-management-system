from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/api/services", tags=["services"])


class CheckInRequest(BaseModel):
    pass


class CheckOutRequest(BaseModel):
    signature_data: Optional[str] = None
    notes: Optional[str] = None


class CaseNoteCreate(BaseModel):
    note_text: str
    note_type: str = "progress"


@router.get("")
def list_services(
    status: Optional[str] = Query(None),
    worker_id: Optional[int] = Query(None),
    participant_id: Optional[int] = Query(None),
    user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = """SELECT sr.*, p.first_name || ' ' || p.last_name as participant_name,
                   w.first_name || ' ' || w.last_name as worker_name
                   FROM service_records sr
                   JOIN participants p ON sr.participant_id = p.id
                   JOIN workers w ON sr.worker_id = w.id
                   WHERE 1=1"""
        params: list = []
        if status:
            query += " AND sr.status = ?"
            params.append(status)
        if worker_id:
            query += " AND sr.worker_id = ?"
            params.append(worker_id)
        if participant_id:
            query += " AND sr.participant_id = ?"
            params.append(participant_id)
        query += " ORDER BY sr.created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("/{schedule_id}/checkin")
def check_in(schedule_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        schedule = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        schedule = dict(schedule)
        existing = conn.execute("SELECT id FROM service_records WHERE schedule_id = ? AND status != 'cancelled'", (schedule_id,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Service record already exists for this schedule")
        now = datetime.now(timezone.utc).isoformat()
        cursor = conn.execute(
            """INSERT INTO service_records (schedule_id, worker_id, participant_id, check_in_time, service_type, status)
            VALUES (?, ?, ?, ?, ?, 'in_progress')""",
            (schedule_id, schedule["worker_id"], schedule["participant_id"], now, schedule["service_type"])
        )
        conn.execute("UPDATE schedules SET status = 'in_progress' WHERE id = ?", (schedule_id,))
        record = conn.execute("SELECT * FROM service_records WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return dict(record)


@router.post("/{schedule_id}/checkout")
def check_out(schedule_id: int, data: CheckOutRequest, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        record = conn.execute(
            "SELECT * FROM service_records WHERE schedule_id = ? AND status = 'in_progress'",
            (schedule_id,)
        ).fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="No active service record for this schedule")
        record = dict(record)
        now = datetime.now(timezone.utc).isoformat()
        check_in = datetime.fromisoformat(record["check_in_time"])
        check_out_time = datetime.now(timezone.utc)
        total_hours = round((check_out_time - check_in).total_seconds() / 3600, 2)
        conn.execute(
            """UPDATE service_records SET check_out_time = ?, signature_data = ?, status = 'completed',
            total_hours = ? WHERE id = ?""",
            (now, data.signature_data, total_hours, record["id"])
        )
        conn.execute("UPDATE schedules SET status = 'completed' WHERE id = ?", (schedule_id,))
        if data.notes:
            conn.execute(
                """INSERT INTO case_notes (service_record_id, participant_id, worker_id, note_text, note_type)
                VALUES (?, ?, ?, ?, 'service')""",
                (record["id"], record["participant_id"], record["worker_id"], data.notes)
            )
        updated = conn.execute("SELECT * FROM service_records WHERE id = ?", (record["id"],)).fetchone()
        return dict(updated)


@router.get("/{service_id}/notes")
def get_case_notes(service_id: int, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        notes = conn.execute(
            """SELECT cn.*, w.first_name || ' ' || w.last_name as worker_name
               FROM case_notes cn
               JOIN workers w ON cn.worker_id = w.id
               WHERE cn.service_record_id = ?
               ORDER BY cn.created_at DESC""",
            (service_id,)
        ).fetchall()
        return [dict(n) for n in notes]


@router.post("/{service_id}/notes")
def create_case_note(service_id: int, data: CaseNoteCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        record = conn.execute("SELECT * FROM service_records WHERE id = ?", (service_id,)).fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="Service record not found")
        record = dict(record)
        cursor = conn.execute(
            """INSERT INTO case_notes (service_record_id, participant_id, worker_id, note_text, note_type)
            VALUES (?, ?, ?, ?, ?)""",
            (service_id, record["participant_id"], record["worker_id"], data.note_text, data.note_type)
        )
        note = conn.execute(
            """SELECT cn.*, w.first_name || ' ' || w.last_name as worker_name
               FROM case_notes cn
               JOIN workers w ON cn.worker_id = w.id
               WHERE cn.id = ?""",
            (cursor.lastrowid,)
        ).fetchone()
        return dict(note)
