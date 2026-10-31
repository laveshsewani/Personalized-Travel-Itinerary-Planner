from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class ItineraryItemBase(BaseModel):
    time_slot: str = Field(..., description="e.g. 09:00 - 11:30 or Morning")
    type: Literal["attraction", "dining", "stay", "transport"]
    title: str
    description: str | None = ""
    location: str | None = ""
    lat: float | None = None
    lng: float | None = None
    cost: float = Field(default=0.0, ge=0, description="Estimated cost in INR (₹)")
    duration_min: int = Field(default=60, ge=0)
    order_index: int = Field(default=0, ge=0)


class ItineraryItemCreate(ItineraryItemBase):
    pass


class ItineraryItemUpdate(BaseModel):
    time_slot: str | None = None
    type: Literal["attraction", "dining", "stay", "transport"] | None = None
    title: str | None = None
    description: str | None = None
    location: str | None = None
    lat: float | None = None
    lng: float | None = None
    cost: float | None = None
    duration_min: int | None = None
    order_index: int | None = None


class ItineraryItemResponse(ItineraryItemBase):
    id: str
    day_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ItineraryDayBase(BaseModel):
    day_number: int = Field(..., ge=1)
    date: date
    summary: str | None = ""
    estimated_cost: float = Field(default=0.0, ge=0)


class ItineraryDayResponse(ItineraryDayBase):
    id: str
    trip_id: str | None = None
    items: list[ItineraryItemResponse] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class TripMember(BaseModel):
    email: str
    role: Literal["owner", "editor", "viewer"] = "editor"
    joined_at: str | None = None


class TripCreate(BaseModel):
    title: str | None = None
    destination: str
    start_date: date
    end_date: date
    budget: float = Field(..., ge=1000, description="Total budget in INR (₹)")
    currency: str = "INR"
    group_size: int = Field(default=1, ge=1)
    interests: list[str] = Field(default=["sightseeing", "food", "culture"])
    travel_style: str = "balanced"
    pace: str = "moderate"
    dietary_prefs: list[str] | None = Field(default=["any"])
    notes: str | None = ""


class TripResponse(BaseModel):
    id: str
    user_id: str
    title: str
    destination: str
    start_date: date
    end_date: date
    budget: float
    currency: str = "INR"
    group_size: int
    status: str
    interests: list[str] = []
    travel_style: str = "balanced"
    pace: str = "moderate"
    notes: str | None = ""
    members: list[TripMember] = []
    days: list[ItineraryDayResponse] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Summary metrics
    total_estimated_cost: float | None = None
    cost_breakdown: dict[str, float] | None = None
    is_ai_generated: bool | None = True
    llm_provider_used: str | None = "groq"

    model_config = {"from_attributes": True}


class GenerateItineraryRequest(TripCreate):
    include_recommendations: bool = True
    save_to_trips: bool = True


class RegenerateDayRequest(BaseModel):
    custom_instruction: str | None = Field(
        default="", description="Specific modification request (e.g., 'more relaxing afternoon', 'vegetarian street food')"
    )
    preserve_existing_customizations: bool = True


class ReorderItemsRequest(BaseModel):
    ordered_item_ids: list[str]


class MemberInviteRequest(BaseModel):
    email: str
    role: Literal["editor", "viewer"] = "editor"
