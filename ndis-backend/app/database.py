import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.environ.get("DATABASE_PATH", "/data/app.db")
_db_dir = os.path.dirname(DB_PATH)
if _db_dir and not os.path.exists(_db_dir):
    try:
        os.makedirs(_db_dir, exist_ok=True)
    except OSError:
        DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app.db")
        DB_PATH = os.path.abspath(DB_PATH)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'support_worker',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            ndis_number TEXT UNIQUE NOT NULL,
            date_of_birth TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            plan_start_date TEXT,
            plan_end_date TEXT,
            core_supports_budget REAL DEFAULT 0,
            capacity_building_budget REAL DEFAULT 0,
            core_supports_used REAL DEFAULT 0,
            capacity_building_used REAL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS service_agreements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            total_value REAL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (participant_id) REFERENCES participants(id)
        );

        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'support_worker',
            status TEXT NOT NULL DEFAULT 'active',
            wwcc_number TEXT,
            wwcc_expiry TEXT,
            police_check_date TEXT,
            first_aid_expiry TEXT,
            ndis_screening_number TEXT,
            ndis_screening_expiry TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_id INTEGER NOT NULL,
            worker_id INTEGER NOT NULL,
            service_type TEXT NOT NULL,
            scheduled_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'scheduled',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (participant_id) REFERENCES participants(id),
            FOREIGN KEY (worker_id) REFERENCES workers(id)
        );

        CREATE TABLE IF NOT EXISTS service_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_id INTEGER NOT NULL,
            worker_id INTEGER NOT NULL,
            participant_id INTEGER NOT NULL,
            check_in_time TEXT,
            check_out_time TEXT,
            service_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            signature_data TEXT,
            total_hours REAL DEFAULT 0,
            rate_per_hour REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (schedule_id) REFERENCES schedules(id),
            FOREIGN KEY (worker_id) REFERENCES workers(id),
            FOREIGN KEY (participant_id) REFERENCES participants(id)
        );

        CREATE TABLE IF NOT EXISTS case_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_record_id INTEGER NOT NULL,
            participant_id INTEGER NOT NULL,
            worker_id INTEGER NOT NULL,
            note_text TEXT NOT NULL,
            note_type TEXT NOT NULL DEFAULT 'progress',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (service_record_id) REFERENCES service_records(id),
            FOREIGN KEY (participant_id) REFERENCES participants(id),
            FOREIGN KEY (worker_id) REFERENCES workers(id)
        );

        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_id INTEGER NOT NULL,
            service_record_id INTEGER,
            claim_reference TEXT UNIQUE,
            support_category TEXT NOT NULL,
            item_number TEXT,
            description TEXT NOT NULL,
            quantity REAL NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL DEFAULT 0,
            total_amount REAL NOT NULL DEFAULT 0,
            claim_date TEXT NOT NULL DEFAULT (date('now')),
            status TEXT NOT NULL DEFAULT 'pending',
            submitted_date TEXT,
            paid_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_id INTEGER,
            reported_by_worker_id INTEGER,
            incident_date TEXT NOT NULL,
            incident_type TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'low',
            description TEXT NOT NULL,
            location TEXT,
            immediate_action TEXT,
            status TEXT NOT NULL DEFAULT 'reported',
            investigation_notes TEXT,
            corrective_action TEXT,
            reviewed_by TEXT,
            review_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (participant_id) REFERENCES participants(id),
            FOREIGN KEY (reported_by_worker_id) REFERENCES workers(id)
        );

        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_id INTEGER,
            complainant_name TEXT NOT NULL,
            complainant_contact TEXT,
            complaint_date TEXT NOT NULL DEFAULT (date('now')),
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            priority TEXT NOT NULL DEFAULT 'medium',
            assigned_to TEXT,
            resolution TEXT,
            resolved_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (participant_id) REFERENCES participants(id)
        );
        """)
