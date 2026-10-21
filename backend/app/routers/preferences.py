from backend.app.core.security import CurrentUser, get_current_user
from backend.app.db.supabase import PreferenceRepository
from backend.app.schemas.preferences import PreferenceResponse, PreferenceUpdate
from fastapi import APIRouter, Depends, status

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("", response_model=PreferenceResponse)
async def get_user_preferences(current_user: CurrentUser = Depends(get_current_user)):
    """Fetch current user's saved travel preferences."""
    pref = await PreferenceRepository.get_by_user_id(current_user.id)
    if not pref:
        # Return sensible defaults
        return PreferenceResponse(
            user_id=current_user.id,
            interests=["sightseeing", "food", "culture"],
            travel_style="balanced",
            pace="moderate",
            budget_level="mid",
            accommodation_type="hotel",
            dietary_prefs=["any"],
        )
    return pref


@router.post("", response_model=PreferenceResponse, status_code=status.HTTP_201_CREATED)
@router.put("", response_model=PreferenceResponse)
async def save_user_preferences(
    payload: PreferenceUpdate, current_user: CurrentUser = Depends(get_current_user)
):
    """Save or update current user's travel preferences."""
    saved = await PreferenceRepository.upsert(current_user.id, payload.model_dump())
    return saved
