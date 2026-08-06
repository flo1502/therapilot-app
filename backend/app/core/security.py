from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


@dataclass(frozen=True)
class Principal:
    """Who is making the request. MVP: a single shared-secret API key maps
    to one trusted caller (the frontend app / edge function). Per-user roles
    and per-tenant scoping are prepared here but not enforced yet - real
    RBAC needs an auth provider (e.g. Supabase Auth JWTs) wired in before
    this handles multiple therapists/tenants.
    """

    tenant_id: str
    role: str = "service"


async def get_current_principal(
    authorization: str | None = Header(default=None),
) -> Principal:
    settings = get_settings()
    if settings.api_key is None:
        # No key configured (local dev): trust the caller.
        return Principal(tenant_id="default")

    expected = f"Bearer {settings.api_key}"
    if authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return Principal(tenant_id="default")
