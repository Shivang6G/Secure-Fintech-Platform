from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api.endpoints import router, limiter

app = FastAPI(title="Secure FinTech Engine")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(router, prefix="/api/v1")

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
