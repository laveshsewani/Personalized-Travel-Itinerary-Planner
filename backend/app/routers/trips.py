
from backend.app.core.security import CurrentUser, get_current_user
from backend.app.db.supabase import TripRepository
from backend.app.schemas.itinerary import MemberInviteRequest, TripMember, TripResponse
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("", response_model=list[TripResponse])
async def list_trips(current_user: CurrentUser = Depends(get_current_user)):
    """List all trips for the authenticated user."""
    trips = await TripRepository.list_by_user(current_user.id)
    # Calculate totals for response
    for t in trips:
        if "days" in t:
            t["total_estimated_cost"] = sum(d.get("estimated_cost", 0.0) for d in t["days"])
    return trips


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """Retrieve complete itinerary details, days, items, and members for a trip."""
    trip = await TripRepository.get_by_id(trip_id, current_user.id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if "days" in trip:
        trip["total_estimated_cost"] = sum(d.get("estimated_cost", 0.0) for d in trip["days"])
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_200_OK)
async def delete_trip(trip_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """Delete a trip (only accessible to owner)."""
    success = await TripRepository.delete_trip(trip_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return {"message": "Trip deleted successfully", "trip_id": trip_id}


@router.post("/{trip_id}/members", response_model=TripMember)
async def invite_trip_member(
    trip_id: str,
    req: MemberInviteRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Invite collaborator by email to a group trip with editor or viewer role."""
    member = await TripRepository.add_member(trip_id, req.email, req.role)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return member
