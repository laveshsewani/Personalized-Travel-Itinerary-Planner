from typing import Any

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float
    lng: float


class RecommendationRequest(BaseModel):
    destination: str = Field(..., description="Destination city, state, or region")
    interests: list[str] = Field(default=["sightseeing", "food", "culture"])
    travel_style: str = Field(default="balanced")
    pace: str = Field(default="moderate")
    budget_level: str = Field(default="mid")
    dietary_prefs: list[str] | None = Field(default=None)
    max_items: int = Field(default=5, ge=1, le=15)


class ScoredItem(BaseModel):
    name: str
    type: str
    recommendation_score: float
    category: str | None = None
    tags: list[str] | None = None
    lat: float | None = None
    lng: float | None = None
    estimated_cost: float | None = None
    duration_min: int | None = None
    best_time: str | None = None
    description: str | None = None
    cuisine: str | None = None
    vegetarian_friendly: bool | None = None
    signature_dish: str | None = None
    price_level: str | None = None
    price_category: str | None = None
    amenities: list[str] | None = None


class TransportGuidance(BaseModel):
    type: str
    estimated_cost_base: float
    description: str
    tip: str | None = None


class RecommendationResponse(BaseModel):
    destination: str
    state: str
    center: Coordinates
    ranked_attractions: list[ScoredItem]
    ranked_dining: list[ScoredItem]
    ranked_stays: list[ScoredItem]
    transport_guidance: list[TransportGuidance]
    query_summary: dict[str, Any]
