from fastapi import APIRouter, Depends
from app.database import get_db
from app.auth import get_current_user
from datetime import date

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/summary")
def get_dashboard_summary(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    with get_db() as conn:
        total_participants = conn.execute("SELECT COUNT(*) as count FROM participants WHERE status = 'active'").fetchone()["count"]
        active_workers = conn.execute("SELECT COUNT(*) as count FROM workers WHERE status = 'active'").fetchone()["count"]
        today_services = conn.execute("SELECT COUNT(*) as count FROM schedules WHERE scheduled_date = ?", (today,)).fetchone()["count"]
        pending_incidents = conn.execute("SELECT COUNT(*) as count FROM incidents WHERE status IN ('reported', 'under_investigation')").fetchone()["count"]
        pending_claims = conn.execute("SELECT COUNT(*) as count FROM claims WHERE status = 'pending'").fetchone()["count"]
        open_complaints = conn.execute("SELECT COUNT(*) as count FROM complaints WHERE status = 'open'").fetchone()["count"]
        total_budget = conn.execute("SELECT COALESCE(SUM(core_supports_budget + capacity_building_budget), 0) as total FROM participants WHERE status = 'active'").fetchone()["total"]
        total_used = conn.execute("SELECT COALESCE(SUM(core_supports_used + capacity_building_used), 0) as total FROM participants WHERE status = 'active'").fetchone()["total"]

        recent_incidents = conn.execute(
            """SELECT i.*, p.first_name || ' ' || p.last_name as participant_name
               FROM incidents i
               LEFT JOIN participants p ON i.participant_id = p.id
               ORDER BY i.created_at DESC LIMIT 5"""
        ).fetchall()

        recent_claims = conn.execute(
            """SELECT c.*, p.first_name || ' ' || p.last_name as participant_name
               FROM claims c
               JOIN participants p ON c.participant_id = p.id
               ORDER BY c.created_at DESC LIMIT 5"""
        ).fetchall()

        # Monthly service counts for chart
        monthly_services = conn.execute(
            """SELECT strftime('%Y-%m', scheduled_date) as month, COUNT(*) as count
               FROM schedules
               GROUP BY strftime('%Y-%m', scheduled_date)
               ORDER BY month DESC LIMIT 6"""
        ).fetchall()

        return {
            "total_participants": total_participants,
            "active_workers": active_workers,
            "today_services": today_services,
            "pending_incidents": pending_incidents,
            "pending_claims": pending_claims,
            "open_complaints": open_complaints,
            "total_budget": total_budget,
            "total_used": total_used,
            "budget_utilization": round((total_used / total_budget * 100) if total_budget > 0 else 0, 1),
            "recent_incidents": [dict(r) for r in recent_incidents],
            "recent_claims": [dict(r) for r in recent_claims],
            "monthly_services": [dict(r) for r in monthly_services],
        }


@router.get("/reports/compliance")
def get_compliance_report(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        workers_total = conn.execute("SELECT COUNT(*) as count FROM workers WHERE status = 'active'").fetchone()["count"]
        workers_with_wwcc = conn.execute("SELECT COUNT(*) as count FROM workers WHERE wwcc_number IS NOT NULL AND status = 'active'").fetchone()["count"]
        workers_with_police = conn.execute("SELECT COUNT(*) as count FROM workers WHERE police_check_date IS NOT NULL AND status = 'active'").fetchone()["count"]
        workers_with_first_aid = conn.execute("SELECT COUNT(*) as count FROM workers WHERE first_aid_expiry IS NOT NULL AND status = 'active'").fetchone()["count"]
        workers_with_ndis = conn.execute("SELECT COUNT(*) as count FROM workers WHERE ndis_screening_number IS NOT NULL AND status = 'active'").fetchone()["count"]

        incidents_by_type = conn.execute(
            "SELECT incident_type, COUNT(*) as count FROM incidents GROUP BY incident_type"
        ).fetchall()

        incidents_by_severity = conn.execute(
            "SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity"
        ).fetchall()

        complaints_by_category = conn.execute(
            "SELECT category, COUNT(*) as count FROM complaints GROUP BY category"
        ).fetchall()

        complaints_by_status = conn.execute(
            "SELECT status, COUNT(*) as count FROM complaints GROUP BY status"
        ).fetchall()

        return {
            "worker_compliance": {
                "total_workers": workers_total,
                "wwcc": workers_with_wwcc,
                "police_check": workers_with_police,
                "first_aid": workers_with_first_aid,
                "ndis_screening": workers_with_ndis,
                "compliance_rate": round((min(workers_with_wwcc, workers_with_police, workers_with_ndis) / workers_total * 100) if workers_total > 0 else 0, 1)
            },
            "incidents": {
                "by_type": [dict(r) for r in incidents_by_type],
                "by_severity": [dict(r) for r in incidents_by_severity],
            },
            "complaints": {
                "by_category": [dict(r) for r in complaints_by_category],
                "by_status": [dict(r) for r in complaints_by_status],
            }
        }


@router.get("/reports/services")
def get_service_report(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        total_services = conn.execute("SELECT COUNT(*) as count FROM service_records").fetchone()["count"]
        completed_services = conn.execute("SELECT COUNT(*) as count FROM service_records WHERE status = 'completed'").fetchone()["count"]
        total_hours = conn.execute("SELECT COALESCE(SUM(total_hours), 0) as total FROM service_records WHERE status = 'completed'").fetchone()["total"]

        services_by_type = conn.execute(
            "SELECT service_type, COUNT(*) as count FROM service_records GROUP BY service_type"
        ).fetchall()

        top_workers = conn.execute(
            """SELECT w.first_name || ' ' || w.last_name as worker_name, COUNT(*) as service_count,
               COALESCE(SUM(sr.total_hours), 0) as total_hours
               FROM service_records sr
               JOIN workers w ON sr.worker_id = w.id
               WHERE sr.status = 'completed'
               GROUP BY sr.worker_id
               ORDER BY service_count DESC LIMIT 10"""
        ).fetchall()

        return {
            "total_services": total_services,
            "completed_services": completed_services,
            "total_hours": round(total_hours, 1),
            "completion_rate": round((completed_services / total_services * 100) if total_services > 0 else 0, 1),
            "services_by_type": [dict(r) for r in services_by_type],
            "top_workers": [dict(r) for r in top_workers],
        }
