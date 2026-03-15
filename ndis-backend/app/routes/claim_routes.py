from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/claims", tags=["claims"])


class ClaimCreate(BaseModel):
    participant_id: int
    service_record_id: Optional[int] = None
    support_category: str
    item_number: Optional[str] = None
    description: str
    quantity: float = 1
    unit_price: float = 0


class ClaimUpdate(BaseModel):
    status: Optional[str] = None
    support_category: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None


@router.get("")
def list_claims(
    status: Optional[str] = Query(None),
    participant_id: Optional[int] = Query(None),
    user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        query = """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
                   FROM claims c
                   JOIN participants p ON c.participant_id = p.id
                   WHERE 1=1"""
        params: list = []
        if status:
            query += " AND c.status = ?"
            params.append(status)
        if participant_id:
            query += " AND c.participant_id = ?"
            params.append(participant_id)
        query += " ORDER BY c.created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


@router.post("")
def create_claim(data: ClaimCreate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        p = conn.execute("SELECT id FROM participants WHERE id = ?", (data.participant_id,)).fetchone()
        if not p:
            raise HTTPException(status_code=404, detail="Participant not found")
        total_amount = data.quantity * data.unit_price
        claim_ref = f"CLM-{uuid.uuid4().hex[:8].upper()}"
        cursor = conn.execute(
            """INSERT INTO claims (participant_id, service_record_id, claim_reference, support_category,
            item_number, description, quantity, unit_price, total_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (data.participant_id, data.service_record_id, claim_ref, data.support_category,
             data.item_number, data.description, data.quantity, data.unit_price, total_amount)
        )
        claim = conn.execute(
            """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
               FROM claims c
               JOIN participants p ON c.participant_id = p.id
               WHERE c.id = ?""",
            (cursor.lastrowid,)
        ).fetchone()
        return dict(claim)


@router.put("/{claim_id}")
def update_claim(claim_id: int, data: ClaimUpdate, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Claim not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)
        if "quantity" in updates or "unit_price" in updates:
            qty = updates.get("quantity", existing["quantity"])
            price = updates.get("unit_price", existing["unit_price"])
            updates["total_amount"] = qty * price
        if "status" in updates:
            if updates["status"] == "submitted":
                updates["submitted_date"] = "datetime('now')"
            elif updates["status"] == "paid":
                updates["paid_date"] = "datetime('now')"
        set_parts = []
        values = []
        for k, v in updates.items():
            if v in ("datetime('now')",):
                set_parts.append(f"{k} = datetime('now')")
            else:
                set_parts.append(f"{k} = ?")
                values.append(v)
        set_clause = ", ".join(set_parts)
        values.append(claim_id)
        conn.execute(f"UPDATE claims SET {set_clause} WHERE id = ?", values)
        updated = conn.execute(
            """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
               FROM claims c
               JOIN participants p ON c.participant_id = p.id
               WHERE c.id = ?""",
            (claim_id,)
        ).fetchone()
        return dict(updated)


@router.get("/summary")
def get_claims_summary(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM claims").fetchone()
        pending = conn.execute("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM claims WHERE status = 'pending'").fetchone()
        submitted = conn.execute("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM claims WHERE status = 'submitted'").fetchone()
        paid = conn.execute("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM claims WHERE status = 'paid'").fetchone()
        return {
            "total": {"count": total["count"], "amount": total["total"]},
            "pending": {"count": pending["count"], "amount": pending["total"]},
            "submitted": {"count": submitted["count"], "amount": submitted["total"]},
            "paid": {"count": paid["count"], "amount": paid["total"]},
        }
