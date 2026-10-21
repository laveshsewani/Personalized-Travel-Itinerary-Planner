from typing import Any

from backend.app.core.security import CurrentUser, get_current_user
from backend.app.db.supabase import TripRepository
from backend.app.schemas.itinerary import (
    GenerateItineraryRequest,
    ItineraryItemCreate,
    ItineraryItemResponse,
    ItineraryItemUpdate,
    RegenerateDayRequest,
    ReorderItemsRequest,
    TripResponse,
)
from backend.app.services.llm import LLMService
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/itineraries", tags=["Itineraries"])


@router.post("/generate", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def generate_itinerary(
    req: GenerateItineraryRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate an AI-powered personalized travel itinerary.
    Uses Llama-3 (Groq/Together) when LLM_API_KEY is configured, or controlled mock generator otherwise.
    Persists to Supabase or in-memory store and returns full Day/Item structure.
    """
    raw_itinerary = await LLMService.generate_itinerary(
        destination=req.destination,
        start_date=str(req.start_date),
        end_date=str(req.end_date),
        budget=req.budget,
        group_size=req.group_size,
        interests=req.interests,
        travel_style=req.travel_style,
        pace=req.pace,
        dietary_prefs=req.dietary_prefs,
        notes=req.notes,
    )

    trip_data = {
        "title": req.title or raw_itinerary.get("title", f"Trip to {req.destination}"),
        "destination": req.destination,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "budget": req.budget,
        "currency": req.currency,
        "group_size": req.group_size,
        "status": "planned",
        "interests": req.interests,
        "travel_style": req.travel_style,
        "pace": req.pace,
        "notes": req.notes,
        "days": raw_itinerary.get("days", []),
    }

    if req.save_to_trips:
        saved_trip = await TripRepository.create_trip(trip_data, current_user.id)
        saved_trip["total_estimated_cost"] = raw_itinerary.get("total_estimated_cost")
        saved_trip["cost_breakdown"] = raw_itinerary.get("cost_breakdown")
        saved_trip["is_ai_generated"] = raw_itinerary.get("is_ai_generated", True)
        saved_trip["llm_provider_used"] = raw_itinerary.get("llm_provider_used", "groq")
        return saved_trip

    return trip_data


@router.post("/{trip_id}/days/{day_number}/regenerate", response_model=dict[str, Any])
async def regenerate_trip_day(
    trip_id: str,
    day_number: int,
    req: RegenerateDayRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Regenerate an individual day while preserving other days and user customizations."""
    trip = await TripRepository.get_by_id(trip_id, current_user.id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    target_day = None
    for d in trip.get("days", []):
        if d.get("day_number") == day_number:
            target_day = d
            break

    if not target_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Day {day_number} not found in this trip",
        )

    new_day = await LLMService.regenerate_single_day(
        destination=trip.get("destination", "India"),
        day_number=day_number,
        date_str=str(target_day.get("date")),
        custom_instruction=req.custom_instruction or "",
        travel_style=trip.get("travel_style", "balanced"),
        pace=trip.get("pace", "moderate"),
        interests=trip.get("interests", []),
        current_day_summary=target_day.get("summary", ""),
    )

    updated = await TripRepository.replace_day(trip_id, day_number, new_day)
    return updated or new_day


@router.post("/{trip_id}/days/{day_number}/items", response_model=ItineraryItemResponse)
async def add_itinerary_item(
    trip_id: str,
    day_number: int,
    item: ItineraryItemCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Add a new activity, meal, or stay item to a specific day."""
    new_item = await TripRepository.add_item(trip_id, day_number, item.model_dump())
    if not new_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip or day not found")
    return new_item


@router.put("/{trip_id}/items/{item_id}", response_model=ItineraryItemResponse)
async def update_itinerary_item(
    trip_id: str,
    item_id: str,
    update_data: ItineraryItemUpdate,
    day_id: str = "",
    current_user: CurrentUser = Depends(get_current_user),
):
    """Inline edit an existing itinerary item."""
    fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    updated = await TripRepository.update_item(trip_id, day_id, item_id, fields)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return updated


@router.delete("/{trip_id}/items/{item_id}")
async def delete_itinerary_item(
    trip_id: str,
    item_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete an item from a trip day."""
    success = await TripRepository.delete_item(trip_id, item_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return {"message": "Item deleted successfully", "item_id": item_id}


@router.put("/{trip_id}/days/{day_number}/reorder")
async def reorder_day_items(
    trip_id: str,
    day_number: int,
    req: ReorderItemsRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Reorder activities within a day (drag-and-drop support)."""
    ok = await TripRepository.reorder_items(trip_id, day_number, req.ordered_item_ids)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to reorder items")
    return {"message": "Items reordered successfully", "day_number": day_number}
