import os
from pathlib import Path
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import init_db
from app.auth import get_current_user
from app.routes.auth_routes import router as auth_router
from app.routes.participant_routes import router as participant_router
from app.routes.agreement_routes import router as agreement_router
from app.routes.worker_routes import router as worker_router
from app.routes.schedule_routes import router as schedule_router
from app.routes.service_routes import router as service_router
from app.routes.claim_routes import router as claim_router
from app.routes.incident_routes import router as incident_router
from app.routes.complaint_routes import router as complaint_router
from app.routes.dashboard_routes import router as dashboard_router

app = FastAPI(title="NDIS Provider Management System")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()

# Include all routers
app.include_router(auth_router)
app.include_router(participant_router)
app.include_router(agreement_router)
app.include_router(worker_router)
app.include_router(schedule_router)
app.include_router(service_router)
app.include_router(claim_router)
app.include_router(incident_router)
app.include_router(complaint_router)
app.include_router(dashboard_router)

# Auth me endpoint
@app.get("/api/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# Serve frontend static files
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't serve SPA for API routes
        if full_path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Not found"}, status_code=404)
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
