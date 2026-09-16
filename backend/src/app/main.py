import asyncio
import logging
import re
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.api.endpoints import router as api_router
from app.core.database import AsyncSessionLocal
from app.core.security import verify_access_token
from app.models.domain import Organization, AuditLog
from app.services.recurring import RecurringEngine

logger = logging.getLogger("titanium_core.scheduler")

app = FastAPI(title="Secure FinTech Engine", version="0.1.0")

# Enable Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_ORG_ID_PATTERN = re.compile(r"/organizations/([0-9a-fA-F-]{36})")

@app.middleware("http")
async def audit_log_middleware(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/v1") and request.method in ("POST", "PUT", "PATCH", "DELETE"):
        try:
            user_id = None
            auth_header = request.headers.get("authorization", "")
            if auth_header.lower().startswith("bearer "):
                claims = verify_access_token(auth_header.split(" ", 1)[1])
                user_id = uuid.UUID(claims.get("sub"))
            match = _ORG_ID_PATTERN.search(request.url.path)
            org_id = uuid.UUID(match.group(1)) if match else None
            async with AsyncSessionLocal() as session:
                session.add(AuditLog(
                    user_id=user_id,
                    organization_id=org_id,
                    method=request.method,
                    path=request.url.path,
                    status_code=str(response.status_code),
                ))
                await session.commit()
        except Exception as audit_err:
            logger.warning(f"Audit logging failed: {audit_err}")
    return response

app.include_router(api_router, prefix="/api/v1")

@app.get("/healthz")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Autonomous background worker: sweeps every organization once per interval
# and posts any recurring schedules that are due. This is intentionally a
# lightweight asyncio loop (no extra dependency such as APScheduler) so the
# container stays small; swap for a proper job queue before real production
# use with many tenants.
# ---------------------------------------------------------------------------
RECURRING_SWEEP_INTERVAL_SECONDS = 6 * 60 * 60  # every 6 hours

async def _recurring_sweep_loop():
    while True:
        try:
            async with AsyncSessionLocal() as session:
                org_ids = (await session.execute(select(Organization.id))).scalars().all()
                for org_id in org_ids:
                    results = await RecurringEngine.execute_due_for_org(session, org_id)
                    if results:
                        logger.info("Recurring sweep org=%s posted=%d", org_id, len(results))
                await session.commit()
        except Exception:
            logger.exception("Recurring sweep failed")
        await asyncio.sleep(RECURRING_SWEEP_INTERVAL_SECONDS)

@app.on_event("startup")
async def start_background_workers():
    asyncio.create_task(_recurring_sweep_loop())