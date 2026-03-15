# NDIS Provider Management System - Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Frontend Pages](#6-frontend-pages)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [User Roles & Permissions](#8-user-roles--permissions)
9. [Setup & Installation](#9-setup--installation)
10. [Deployment](#10-deployment)
11. [Configuration](#11-configuration)
12. [Functional Modules](#12-functional-modules)

---

## 1. System Overview

The NDIS Provider Management System is a web-based application designed for Australian NDIS (National Disability Insurance Scheme) service providers. It streamlines the management of participants, workers, service delivery, claims, incidents, and compliance tracking.

### Key Features

- **Participant Management** - Register, track, and manage NDIS participants with plan details and budget tracking
- **Worker Management** - Manage support workers with certification/compliance tracking (WWCC, police checks, NDIS screening, first aid)
- **Service Scheduling** - Create, assign, and manage service schedules for participants and workers
- **Service Delivery** - Check-in/check-out workflow for service sessions with automatic hour calculation
- **Case Notes** - Record progress notes and service notes attached to service records
- **Claims Management** - Generate, track, and manage NDIS claims with support categories and item numbers
- **Budget Tracking** - Real-time tracking of Core Supports and Capacity Building budget utilization per participant
- **Incident Reporting** - Log, investigate, and resolve incidents with severity tracking
- **Complaint Management** - Register, assign, and resolve complaints with priority levels
- **Service Agreements** - Create and manage service agreements per participant
- **Dashboard & Analytics** - Real-time dashboard with charts showing key metrics and trends
- **Compliance Reports** - Worker certification compliance rates, incident/complaint analytics
- **Role-Based Access Control** - Five user roles with appropriate access levels

---

## 2. Architecture

```
ndis-system/
├── ndis-backend/           # FastAPI backend (Python)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI app entry point, static file serving
│   │   ├── auth.py         # JWT authentication & password hashing
│   │   ├── database.py     # SQLite database connection & schema
│   │   ├── routes/
│   │   │   ├── auth_routes.py        # Registration, login, user info
│   │   │   ├── participant_routes.py # CRUD + budget tracking
│   │   │   ├── worker_routes.py      # CRUD + certifications
│   │   │   ├── schedule_routes.py    # CRUD + today's schedules
│   │   │   ├── service_routes.py     # Check-in/out, case notes
│   │   │   ├── claim_routes.py       # CRUD + claims summary
│   │   │   ├── incident_routes.py    # CRUD + investigation
│   │   │   ├── complaint_routes.py   # CRUD + resolution
│   │   │   ├── agreement_routes.py   # Service agreements
│   │   │   └── dashboard_routes.py   # Dashboard summary, reports
│   │   ├── models/
│   │   └── schemas/
│   ├── static/              # Built frontend (served by FastAPI)
│   │   ├── index.html
│   │   └── assets/
│   └── pyproject.toml       # Python dependencies (Poetry)
│
├── ndis-frontend/           # React frontend (TypeScript)
│   ├── src/
│   │   ├── App.tsx          # Router configuration
│   │   ├── main.tsx         # Entry point
│   │   ├── components/
│   │   │   ├── Layout.tsx   # Sidebar navigation layout
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Auth state management
│   │   ├── lib/
│   │   │   ├── api.ts       # API client (fetch wrapper)
│   │   │   └── utils.ts     # Utility functions
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── DashboardPage.tsx
│   │       ├── ParticipantsPage.tsx
│   │       ├── ParticipantDetailPage.tsx
│   │       ├── WorkersPage.tsx
│   │       ├── SchedulesPage.tsx
│   │       ├── ServicesPage.tsx
│   │       ├── ClaimsPage.tsx
│   │       ├── IncidentsPage.tsx
│   │       ├── ComplaintsPage.tsx
│   │       └── ReportsPage.tsx
│   ├── package.json
│   └── .env                 # Frontend environment config
│
└── NDIS_Management_System_Documentation.md
```

### Data Flow

1. **User** interacts with the **React Frontend** (SPA)
2. Frontend makes **REST API calls** to the **FastAPI Backend**
3. Backend authenticates requests via **JWT tokens**
4. Backend reads/writes data to **SQLite database**
5. In production, the frontend is served as static files from the backend (same-origin deployment)

---

## 3. Technology Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | ^0.135.1 |
| Language | Python | ^3.12 |
| Database | SQLite | Built-in |
| Auth Tokens | PyJWT | ^2.12.1 |
| Password Hashing | passlib + bcrypt | ^1.7.4 |
| Form Handling | python-multipart | ^0.0.22 |
| Package Manager | Poetry | Latest |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | ^18.3.1 |
| Language | TypeScript | ~5.6.2 |
| Build Tool | Vite | ^6.0.1 |
| Routing | React Router | ^7.13.1 |
| Styling | Tailwind CSS | ^3.4.16 |
| UI Components | shadcn/ui (Radix UI) | Various |
| Charts | Recharts | ^2.12.4 |
| Icons | Lucide React | ^0.364.0 |

---

## 4. Database Schema

### Entity Relationship Overview

```
users ──────────────────────────────┐
                                    │
participants ──── service_agreements│
    │                               │
    ├── schedules ──── workers ─────┘
    │       │
    │       └── service_records
    │               │
    │               └── case_notes
    │
    ├── claims
    ├── incidents
    └── complaints
```

### Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| email | TEXT UNIQUE | User email (login identifier) |
| password_hash | TEXT | bcrypt hashed password |
| full_name | TEXT | Display name |
| role | TEXT | One of: admin, provider_manager, support_worker, finance_officer, compliance_officer |
| is_active | INTEGER | 1 = active, 0 = disabled |
| created_at | TEXT | ISO timestamp |

#### `participants`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| first_name | TEXT | Participant first name |
| last_name | TEXT | Participant last name |
| ndis_number | TEXT UNIQUE | NDIS participant number |
| date_of_birth | TEXT | Date of birth (YYYY-MM-DD) |
| phone | TEXT | Contact phone |
| email | TEXT | Contact email |
| address | TEXT | Residential address |
| plan_start_date | TEXT | NDIS plan start date |
| plan_end_date | TEXT | NDIS plan end date |
| core_supports_budget | REAL | Total Core Supports budget ($) |
| capacity_building_budget | REAL | Total Capacity Building budget ($) |
| core_supports_used | REAL | Core Supports budget spent ($) |
| capacity_building_used | REAL | Capacity Building budget spent ($) |
| status | TEXT | active, inactive, on_hold |
| notes | TEXT | Additional notes |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

#### `workers`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| user_id | INTEGER FK | Links to users table (optional) |
| first_name | TEXT | Worker first name |
| last_name | TEXT | Worker last name |
| email | TEXT UNIQUE | Worker email |
| phone | TEXT | Contact phone |
| role | TEXT | Worker role type |
| status | TEXT | active, inactive, on_leave |
| wwcc_number | TEXT | Working With Children Check number |
| wwcc_expiry | TEXT | WWCC expiry date |
| police_check_date | TEXT | Date of police check |
| first_aid_expiry | TEXT | First aid certificate expiry |
| ndis_screening_number | TEXT | NDIS Worker Screening number |
| ndis_screening_expiry | TEXT | NDIS screening expiry date |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

#### `schedules`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| participant_id | INTEGER FK | Linked participant |
| worker_id | INTEGER FK | Assigned worker |
| service_type | TEXT | Type of service |
| scheduled_date | TEXT | Date of service (YYYY-MM-DD) |
| start_time | TEXT | Start time (HH:MM) |
| end_time | TEXT | End time (HH:MM) |
| status | TEXT | scheduled, in_progress, completed, cancelled |
| notes | TEXT | Schedule notes |
| created_at | TEXT | ISO timestamp |

#### `service_records`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| schedule_id | INTEGER FK | Linked schedule |
| worker_id | INTEGER FK | Worker who delivered service |
| participant_id | INTEGER FK | Participant who received service |
| check_in_time | TEXT | ISO timestamp of check-in |
| check_out_time | TEXT | ISO timestamp of check-out |
| service_type | TEXT | Type of service delivered |
| status | TEXT | pending, in_progress, completed, cancelled |
| signature_data | TEXT | Digital signature data |
| total_hours | REAL | Calculated service duration in hours |
| rate_per_hour | REAL | Hourly rate |
| total_amount | REAL | Total amount for service |
| created_at | TEXT | ISO timestamp |

#### `case_notes`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| service_record_id | INTEGER FK | Linked service record |
| participant_id | INTEGER FK | Related participant |
| worker_id | INTEGER FK | Author worker |
| note_text | TEXT | Note content |
| note_type | TEXT | progress, service, incident, general |
| created_at | TEXT | ISO timestamp |

#### `claims`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| participant_id | INTEGER FK | Claimed participant |
| service_record_id | INTEGER FK | Linked service record (optional) |
| claim_reference | TEXT UNIQUE | Auto-generated reference (CLM-XXXXXXXX) |
| support_category | TEXT | NDIS support category (core_supports, capacity_building) |
| item_number | TEXT | NDIS item number |
| description | TEXT | Claim description |
| quantity | REAL | Service quantity |
| unit_price | REAL | Price per unit |
| total_amount | REAL | Calculated total (quantity x unit_price) |
| claim_date | TEXT | Date of claim |
| status | TEXT | pending, submitted, paid, rejected |
| submitted_date | TEXT | Date submitted to NDIS |
| paid_date | TEXT | Date payment received |
| created_at | TEXT | ISO timestamp |

#### `incidents`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| participant_id | INTEGER FK | Related participant (optional) |
| reported_by_worker_id | INTEGER FK | Reporting worker (optional) |
| incident_date | TEXT | Date of incident |
| incident_type | TEXT | Type of incident |
| severity | TEXT | low, medium, high, critical |
| description | TEXT | Incident description |
| location | TEXT | Where incident occurred |
| immediate_action | TEXT | Actions taken immediately |
| status | TEXT | reported, under_investigation, reviewed, closed |
| investigation_notes | TEXT | Investigation details |
| corrective_action | TEXT | Corrective actions taken |
| reviewed_by | TEXT | Name of reviewer |
| review_date | TEXT | Date of review |
| created_at | TEXT | ISO timestamp |

#### `complaints`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| participant_id | INTEGER FK | Related participant (optional) |
| complainant_name | TEXT | Name of person complaining |
| complainant_contact | TEXT | Contact details |
| complaint_date | TEXT | Date complaint was made |
| category | TEXT | Complaint category |
| description | TEXT | Complaint description |
| status | TEXT | open, in_progress, resolved, closed |
| priority | TEXT | low, medium, high, urgent |
| assigned_to | TEXT | Person assigned to handle |
| resolution | TEXT | Resolution details |
| resolved_date | TEXT | Date resolved |
| created_at | TEXT | ISO timestamp |

#### `service_agreements`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment ID |
| participant_id | INTEGER FK | Related participant |
| title | TEXT | Agreement title |
| description | TEXT | Agreement description |
| start_date | TEXT | Agreement start date |
| end_date | TEXT | Agreement end date |
| status | TEXT | draft, active, expired, terminated |
| total_value | REAL | Total agreement value ($) |
| created_at | TEXT | ISO timestamp |

---

## 5. API Reference

All API endpoints are prefixed with `/api`. All endpoints (except auth) require a Bearer token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/me` | Get current user info | Yes |

#### POST `/api/auth/register`
```json
// Request
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Smith",
  "role": "admin"  // optional, default: "support_worker"
}

// Response
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Smith",
    "role": "admin"
  }
}
```

#### POST `/api/auth/login`
```json
// Request
{
  "email": "user@example.com",
  "password": "securepassword"
}

// Response (same as register response)
```

### Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/participants` | List all participants (filterable by `status`, `search`) |
| POST | `/api/participants` | Create new participant |
| GET | `/api/participants/{id}` | Get participant details |
| PUT | `/api/participants/{id}` | Update participant |
| DELETE | `/api/participants/{id}` | Delete participant |
| GET | `/api/participants/{id}/budget` | Get budget breakdown |

#### POST `/api/participants`
```json
// Request
{
  "first_name": "Jane",
  "last_name": "Doe",
  "ndis_number": "4312345678",
  "date_of_birth": "1990-05-15",
  "phone": "0412345678",
  "email": "jane@example.com",
  "address": "123 Main St, Sydney NSW 2000",
  "plan_start_date": "2026-01-01",
  "plan_end_date": "2027-01-01",
  "core_supports_budget": 25000.00,
  "capacity_building_budget": 15000.00,
  "notes": "Requires wheelchair access"
}
```

#### GET `/api/participants/{id}/budget`
```json
// Response
{
  "participant_id": 1,
  "participant_name": "Jane Doe",
  "plan_start_date": "2026-01-01",
  "plan_end_date": "2027-01-01",
  "core_supports": {
    "budget": 25000.0,
    "used": 5000.0,
    "remaining": 20000.0,
    "percentage_used": 20.0
  },
  "capacity_building": {
    "budget": 15000.0,
    "used": 3000.0,
    "remaining": 12000.0,
    "percentage_used": 20.0
  },
  "total_budget": 40000.0,
  "total_used": 8000.0
}
```

### Workers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workers` | List all workers (filterable by `status`, `search`) |
| POST | `/api/workers` | Create new worker |
| GET | `/api/workers/{id}` | Get worker details |
| PUT | `/api/workers/{id}` | Update worker |
| GET | `/api/workers/{id}/certifications` | Get worker certifications |

#### POST `/api/workers`
```json
// Request
{
  "first_name": "Bob",
  "last_name": "Smith",
  "email": "bob@example.com",
  "phone": "0498765432",
  "role": "support_worker",
  "wwcc_number": "WWC123456",
  "wwcc_expiry": "2027-06-30",
  "police_check_date": "2025-11-01",
  "first_aid_expiry": "2027-03-15",
  "ndis_screening_number": "NDIS789012",
  "ndis_screening_expiry": "2028-01-01"
}
```

### Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | List schedules (filterable by `date_from`, `date_to`, `worker_id`, `participant_id`, `status`) |
| POST | `/api/schedules` | Create schedule |
| PUT | `/api/schedules/{id}` | Update schedule |
| DELETE | `/api/schedules/{id}` | Delete schedule |
| GET | `/api/schedules/today` | Get today's schedules |

#### POST `/api/schedules`
```json
// Request
{
  "participant_id": 1,
  "worker_id": 1,
  "service_type": "Personal Care",
  "scheduled_date": "2026-03-20",
  "start_time": "09:00",
  "end_time": "11:00",
  "notes": "Morning routine assistance"
}
```

### Service Delivery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List service records (filterable by `status`, `worker_id`, `participant_id`) |
| POST | `/api/services/{schedule_id}/checkin` | Check in to a scheduled service |
| POST | `/api/services/{schedule_id}/checkout` | Check out from a service (with optional signature and notes) |
| GET | `/api/services/{service_id}/notes` | Get case notes for a service |
| POST | `/api/services/{service_id}/notes` | Add case note to a service |

#### POST `/api/services/{schedule_id}/checkout`
```json
// Request
{
  "signature_data": "base64-encoded-signature",
  "notes": "Client was in good spirits. Completed morning routine successfully."
}
```

#### POST `/api/services/{service_id}/notes`
```json
// Request
{
  "note_text": "Participant showed improvement in mobility exercises.",
  "note_type": "progress"  // progress, service, incident, general
}
```

### Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/claims` | List claims (filterable by `status`, `participant_id`) |
| POST | `/api/claims` | Create new claim |
| PUT | `/api/claims/{id}` | Update claim (status, amounts) |
| GET | `/api/claims/summary` | Get claims financial summary |

#### POST `/api/claims`
```json
// Request
{
  "participant_id": 1,
  "service_record_id": 1,
  "support_category": "core_supports",
  "item_number": "01_011_0107_1_1",
  "description": "Assistance with daily life - Personal Care",
  "quantity": 2.5,
  "unit_price": 65.47
}

// Response includes auto-generated claim_reference: "CLM-A1B2C3D4"
```

#### GET `/api/claims/summary`
```json
// Response
{
  "total": {"count": 50, "amount": 45000.00},
  "pending": {"count": 10, "amount": 8500.00},
  "submitted": {"count": 25, "amount": 22000.00},
  "paid": {"count": 15, "amount": 14500.00}
}
```

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List incidents (filterable by `status`, `severity`) |
| POST | `/api/incidents` | Report new incident |
| GET | `/api/incidents/{id}` | Get incident details |
| PUT | `/api/incidents/{id}` | Update incident (status, investigation, corrective action) |

#### POST `/api/incidents`
```json
// Request
{
  "participant_id": 1,
  "reported_by_worker_id": 1,
  "incident_date": "2026-03-15",
  "incident_type": "fall",
  "severity": "medium",
  "description": "Participant had a minor fall during transfer from wheelchair.",
  "location": "Participant's home - bedroom",
  "immediate_action": "Assessed for injuries, applied ice pack to bruised elbow."
}
```

### Complaints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints` | List complaints (filterable by `status`, `priority`) |
| POST | `/api/complaints` | Register new complaint |
| GET | `/api/complaints/{id}` | Get complaint details |
| PUT | `/api/complaints/{id}` | Update complaint (status, resolution, assignment) |

#### POST `/api/complaints`
```json
// Request
{
  "participant_id": 1,
  "complainant_name": "Mary Doe",
  "complainant_contact": "0412345678",
  "category": "service_quality",
  "description": "Worker arrived 30 minutes late to scheduled appointment.",
  "priority": "medium",
  "assigned_to": "Provider Manager"
}
```

### Service Agreements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/participants/{id}/agreements` | List participant's agreements |
| POST | `/api/participants/{id}/agreements` | Create new agreement |
| PUT | `/api/agreements/{id}` | Update agreement |

### Dashboard & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard stats and recent activity |
| GET | `/api/reports/compliance` | Worker compliance report |
| GET | `/api/reports/services` | Service delivery report |

#### GET `/api/dashboard/summary`
```json
// Response
{
  "total_participants": 45,
  "active_workers": 12,
  "today_services": 8,
  "pending_incidents": 3,
  "pending_claims": 15,
  "open_complaints": 2,
  "total_budget": 1200000.0,
  "total_used": 450000.0,
  "budget_utilization": 37.5,
  "recent_incidents": [...],
  "recent_claims": [...],
  "monthly_services": [
    {"month": "2026-03", "count": 120},
    {"month": "2026-02", "count": 115}
  ]
}
```

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/healthz` | Health check endpoint | No |

---

## 6. Frontend Pages

### Login Page (`/login`)
- Email and password authentication form
- Registration form for new users with role selection
- Automatic redirect to dashboard after successful login

### Dashboard (`/`)
- Summary cards: Active Participants, Active Workers, Today's Services, Pending Incidents, Pending Claims, Open Complaints
- Budget utilization progress bar
- Monthly services bar chart (Recharts)
- Recent incidents and recent claims tables

### Participants (`/participants`)
- Searchable, filterable table of all participants
- Add new participant dialog with NDIS plan details
- Status filter (active, inactive, on_hold)

### Participant Detail (`/participants/:id`)
- Full participant profile
- Budget breakdown (Core Supports vs Capacity Building) with progress bars
- Service agreements tab
- Service history tab

### Workers (`/workers`)
- Searchable, filterable table of all workers
- Add new worker dialog with certification fields
- Certification status indicators (valid/expired)

### Schedules (`/schedules`)
- Calendar-style schedule view
- Date range filtering
- Create new schedule with participant/worker selection
- Status badges (scheduled, in_progress, completed, cancelled)
- Check-in and check-out buttons for active schedules

### Services (`/services`)
- Service records list with filtering
- Case notes viewing and creation
- Service status tracking

### Claims (`/claims`)
- Claims table with financial details
- Create new claim with NDIS support category and item numbers
- Status workflow: pending -> submitted -> paid
- Claims summary cards (total, pending, submitted, paid amounts)

### Incidents (`/incidents`)
- Incident log with severity indicators
- Report new incident form
- Investigation notes and corrective action fields
- Status workflow: reported -> under_investigation -> reviewed -> closed

### Complaints (`/complaints`)
- Complaints list with priority badges
- Register new complaint form
- Assignment and resolution tracking
- Status workflow: open -> in_progress -> resolved -> closed

### Reports (`/reports`)
- **Compliance Report**: Worker certification rates, incidents by type/severity, complaints by category
- **Service Report**: Total services, completion rates, total hours, services by type, top workers
- Interactive charts (bar charts, pie charts)

---

## 7. Authentication & Authorization

### Authentication Flow
1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server validates credentials, returns a JWT access token
3. Frontend stores token in `localStorage`
4. All subsequent API requests include the token in `Authorization: Bearer <token>` header
5. Token expires after **24 hours**

### JWT Token Structure
```json
{
  "sub": "1",          // User ID (string)
  "role": "admin",     // User role
  "exp": 1773642639    // Expiration timestamp
}
```

### Password Security
- Passwords are hashed using **bcrypt** via the passlib library
- Salt is automatically generated per password
- Raw passwords are never stored

---

## 8. User Roles & Permissions

| Role | Description |
|------|-------------|
| `admin` | Full system access. Can manage all modules, users, and system configuration. |
| `provider_manager` | Manages service delivery operations, workers, schedules, and compliance. |
| `support_worker` | Records service delivery, case notes, and can report incidents. |
| `finance_officer` | Manages claims, budget tracking, and financial reports. |
| `compliance_officer` | Manages incidents, complaints, worker certifications, and compliance reports. |

All authenticated users can access all API endpoints. Role-based UI restrictions can be added as needed.

---

## 9. Setup & Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- Poetry (Python package manager)
- npm (Node package manager)

### Backend Setup

```bash
cd ndis-backend

# Install Python dependencies
poetry install

# Run the development server
poetry run fastapi dev app/main.py --port 8000
```

The backend will start at `http://localhost:8000`.

### Frontend Setup

```bash
cd ndis-frontend

# Install Node dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Run the development server
npm run dev
```

The frontend will start at `http://localhost:5173`.

### Building for Production

```bash
cd ndis-frontend

# Set empty API URL for same-origin deployment
echo "VITE_API_URL=" > .env

# Build the frontend
npm run build

# Copy built files to backend static directory
cp -r dist/ ../ndis-backend/static/

cd ../ndis-backend

# Run production server
poetry run fastapi run app/main.py --port 8000
```

The complete application will be available at `http://localhost:8000`.

---

## 10. Deployment

### Same-Origin Deployment (Recommended)

The application is designed for same-origin deployment where the FastAPI backend serves the React frontend as static files. This eliminates CORS issues and simplifies the architecture.

1. Build the frontend: `cd ndis-frontend && npm run build`
2. Copy to backend: `cp -r dist/ ../ndis-backend/static/`
3. The backend's `main.py` automatically detects and serves the `static/` directory
4. API routes are served under `/api/*`
5. All other routes serve `index.html` (SPA fallback)

### Cloud Deployment Options

#### Fly.io
```bash
cd ndis-backend
# Deploy with persistent SQLite storage
flyctl deploy --volume true
```
The persistent volume mounts at `/data`, and the database is stored at `/data/app.db`.

#### Docker
Create a `Dockerfile`:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.in-project true && poetry install --no-root
COPY . .
CMD [".venv/bin/fastapi", "run", "app/main.py", "--port", "8000"]
```

#### Environment Variables for Production
```bash
export JWT_SECRET_KEY="your-secure-random-secret-key"
export DATABASE_PATH="/data/app.db"
```

---

## 11. Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | `ndis-secret-key-change-in-production` | Secret key for JWT token signing. **MUST be changed in production.** |
| `DATABASE_PATH` | `/data/app.db` | Path to SQLite database file. Falls back to `./app.db` if `/data` doesn't exist. |
| `VITE_API_URL` | (empty) | Backend API URL for frontend. Empty = same-origin (relative URLs). |

### SQLite Configuration
- WAL (Write-Ahead Logging) mode enabled for better concurrent read performance
- Foreign keys enforcement enabled via `PRAGMA foreign_keys=ON`
- Database auto-creates all tables on startup via `init_db()`

---

## 12. Functional Modules

### 12.1 Participant Management Module
**Purpose**: Manage NDIS participants and their plan information.

**Workflow**:
1. Register participant with NDIS number and personal details
2. Set NDIS plan dates and budget allocations (Core Supports + Capacity Building)
3. Track budget utilization as services are delivered
4. Create service agreements linking participants to service types
5. View participant detail page with budget breakdown and service history

### 12.2 Worker Management Module
**Purpose**: Manage support workers and their compliance certifications.

**Workflow**:
1. Register worker with personal and professional details
2. Enter certification information (WWCC, police check, first aid, NDIS screening)
3. Track certification expiry dates
4. Monitor compliance rates via reports
5. Assign workers to schedules

### 12.3 Service Delivery Module
**Purpose**: Schedule, deliver, and document NDIS services.

**Workflow**:
1. **Schedule** - Create a service schedule assigning a worker to a participant at a date/time
2. **Check-in** - Worker checks in when they arrive (creates a service record, records check-in time)
3. **Service** - Worker delivers the scheduled service
4. **Check-out** - Worker checks out, provides digital signature and notes (records check-out time, calculates total hours)
5. **Case Notes** - Worker adds progress notes, observations, and any relevant documentation
6. **Claim** - Finance officer creates a claim from the service record

### 12.4 Claims Management Module
**Purpose**: Generate, submit, and track NDIS claims.

**Workflow**:
1. Create claim linked to participant (and optionally a service record)
2. Specify NDIS support category and item number
3. Set quantity and unit price (total auto-calculated)
4. Auto-generated claim reference (CLM-XXXXXXXX)
5. Submit claim (status: pending -> submitted)
6. Track payment (status: submitted -> paid)
7. View claims summary with financial breakdown

### 12.5 Budget Tracking Module
**Purpose**: Track NDIS plan budget utilization per participant.

**Features**:
- Separate tracking for Core Supports and Capacity Building categories
- Real-time percentage utilization calculation
- Visual progress bars on participant detail page
- Dashboard-level aggregate budget utilization

### 12.6 Incident Management Module
**Purpose**: Report, investigate, and resolve incidents per NDIS Quality and Safeguards requirements.

**Workflow**:
1. Report incident with type, severity, location, and immediate actions taken
2. Investigate (add investigation notes)
3. Determine corrective actions
4. Review and close incident

**Severity Levels**: low, medium, high, critical

### 12.7 Complaint Management Module
**Purpose**: Register, track, and resolve complaints.

**Workflow**:
1. Register complaint with complainant details and category
2. Assign to staff member for handling
3. Track investigation and resolution
4. Close complaint with resolution details

**Priority Levels**: low, medium, high, urgent

### 12.8 Compliance & Reporting Module
**Purpose**: Generate compliance and service delivery reports.

**Reports Available**:
- **Worker Compliance Report**: Certification rates (WWCC, police check, first aid, NDIS screening), overall compliance rate
- **Service Report**: Total services, completion rates, total hours delivered, services by type, top-performing workers
- **Incident Analytics**: Incidents by type and severity
- **Complaint Analytics**: Complaints by category and status

### 12.9 Dashboard Module
**Purpose**: Provide a real-time overview of the organization's operations.

**Widgets**:
- Active Participants count
- Active Workers count
- Today's Services count
- Pending Incidents count
- Pending Claims count
- Open Complaints count
- Budget Utilization percentage bar
- Monthly Services trend chart
- Recent Incidents table
- Recent Claims table

---

## Appendix: Test Account

A demo admin account is available for testing:
- **Email**: `demo@ndis.com`
- **Password**: `demo123`
- **Role**: Administrator

---

*Document generated for the NDIS Provider Management System v0.1.0*
