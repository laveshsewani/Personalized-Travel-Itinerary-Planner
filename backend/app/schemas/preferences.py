from datetime import datetime

from pydantic import BaseModel, Field


class PreferenceBase(BaseModel):
    interests: list[str] = Field(
        default=["sightseeing", "food", "culture"],
        description="List of traveler interests: food, sightseeing, adventure, culture, nightlife, nature, shopping, relaxation",
    )
    travel_style: str = Field(default="balanced", description="relaxed, balanced, packed, adventure, luxury, backpacking")
    pace: str = Field(default="moderate", description="relaxed, moderate, fast")
    budget_level: str = Field(default="mid", description="budget, mid, premium, luxury")
    accommodation_type: str = Field(default="hotel", description="hostel, hotel, resort, homestay, heritage")
    dietary_prefs: list[str] = Field(default=["any"], description="vegetarian, vegan, jain, halal, non-veg, any")


class PreferenceUpdate(PreferenceBase):
    pass


class PreferenceResponse(PreferenceBase):
    id: str | None = None
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
