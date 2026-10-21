import logging

from fastapi import Header, HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class CurrentUser(BaseModel):
    id: str
    email: str
    full_name: str | None = "Traveler"
    is_authenticated: bool = True


# Default fallback user for offline / unauthenticated exploration
DEMO_USER = CurrentUser(
    id="00000000-0000-0000-0000-000000000001",
    email="traveler@yatra.local",
    full_name="Aarav Sharma",
    is_authenticated=False,
)


async def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> CurrentUser:
    """
    Validate Supabase Bearer token if present.
    If absent or in dev mode without Supabase credentials, returns default demo user context.
    """
    if not authorization:
        return DEMO_USER

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
        )

    token = parts[1]

    # In local/demo mode or dummy token, return demo or mock user
    if token in ("dummy_token", "demo", "mock_token"):
        return DEMO_USER

    try:
        from backend.app.db.supabase import get_supabase_client
        client = get_supabase_client()
        if client:
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                u = user_response.user
                return CurrentUser(
                    id=u.id,
                    email=u.email or "user@example.com",
                    full_name=u.user_metadata.get("full_name", "Traveler"),
                    is_authenticated=True,
                )
    except Exception as e:
        logger.warning(f"Supabase auth token verification error: {e}")
        # In development, fall back gracefully
        return DEMO_USER

    return DEMO_USER
