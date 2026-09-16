from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# Note: slowapi requires 'request: Request' as the very first parameter
@router.post("/auth/register")
@limiter.limit("5/minute")
async def register(request: Request, payload: dict):
    # Aapka existing registration logic
    return {"status": "success", "message": "User registered successfully"}
