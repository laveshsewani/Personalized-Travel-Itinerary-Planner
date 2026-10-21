import copy
import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client = None


def get_supabase_client():
    """Returns singleton Supabase client or None if credentials are missing."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY):
        try:
            from supabase import create_client
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
            _supabase_client = create_client(settings.SUPABASE_URL, key)
            logger.info("Supabase client initialized successfully.")
            return _supabase_client
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client: {e}")
            return None
    return None


# -----------------------------------------------------------------------------
# In-Memory Fallback Store (Ensures 100% operational demo & local testing)
# -----------------------------------------------------------------------------
_SEED_USER_ID = "00000000-0000-0000-0000-000000000001"
_SEED_TRIP_ID = "11111111-1111-1111-1111-111111111111"
_SEED_DAY_1_ID = "22222222-2222-2222-2222-222222222221"
_SEED_DAY_2_ID = "22222222-2222-2222-2222-222222222222"

_IN_MEMORY_PREFERENCES: dict[str, dict[str, Any]] = {
    _SEED_USER_ID: {
        "id": "pref-1",
        "user_id": _SEED_USER_ID,
        "interests": ["culture", "food", "sightseeing"],
        "travel_style": "balanced",
        "pace": "moderate",
        "budget_level": "mid",
        "accommodation_type": "hotel",
        "dietary_prefs": ["vegetarian"],
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat(),
    }
}

_IN_MEMORY_TRIPS: dict[str, dict[str, Any]] = {
    _SEED_TRIP_ID: {
        "id": _SEED_TRIP_ID,
        "user_id": _SEED_USER_ID,
        "title": "Royal Rajasthan Heritage Experience",
        "destination": "Jaipur",
        "start_date": "2026-11-01",
        "end_date": "2026-11-03",
        "budget": 35000.0,
        "currency": "INR",
        "group_size": 2,
        "status": "planned",
        "interests": ["culture", "food", "sightseeing"],
        "travel_style": "balanced",
        "pace": "moderate",
        "members": [{"email": "aarav@yatra.local", "role": "owner"}],
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat(),
        "days": [
            {
                "id": _SEED_DAY_1_ID,
                "trip_id": _SEED_TRIP_ID,
                "day_number": 1,
                "date": "2026-11-01",
                "summary": "Arrival, City Palace, Jantar Mantar and Chokhi Dhani evening",
                "estimated_cost": 8500.0,
                "items": [
                    {
                        "id": "item-101",
                        "day_id": _SEED_DAY_1_ID,
                        "time_slot": "09:30 - 12:30",
                        "type": "attraction",
                        "title": "City Palace & Museum",
                        "description": "Explore royal courtyards, textiles gallery, and historic peacocks gate.",
                        "location": "Gangori Bazaar, Jaipur",
                        "lat": 26.9258,
                        "lng": 75.8237,
                        "cost": 700.0,
                        "duration_min": 180,
                        "order_index": 0,
                    },
                    {
                        "id": "item-102",
                        "day_id": _SEED_DAY_1_ID,
                        "time_slot": "13:00 - 14:15",
                        "type": "dining",
                        "title": "Traditional Thali at LMB",
                        "description": "Savor authentic Dal Baati Churma, Ker Sangri, and Rajasthani sweets.",
                        "location": "Johari Bazaar",
                        "lat": 26.9197,
                        "lng": 75.8242,
                        "cost": 900.0,
                        "duration_min": 75,
                        "order_index": 1,
                    },
                    {
                        "id": "item-103",
                        "day_id": _SEED_DAY_1_ID,
                        "time_slot": "15:00 - 17:00",
                        "type": "attraction",
                        "title": "Jantar Mantar Observatory",
                        "description": "UNESCO World Heritage stone astronomical instruments.",
                        "location": "Near City Palace",
                        "lat": 26.9248,
                        "lng": 75.8246,
                        "cost": 200.0,
                        "duration_min": 120,
                        "order_index": 2,
                    },
                    {
                        "id": "item-104",
                        "day_id": _SEED_DAY_1_ID,
                        "time_slot": "18:30 - 22:00",
                        "type": "dining",
                        "title": "Chokhi Dhani Ethnic Resort",
                        "description": "Village fair ambiance, Kalbeliya folk dances, camel rides, and grand Rajasthani thali.",
                        "location": "12 Miles Tonk Road",
                        "lat": 26.7663,
                        "lng": 75.8362,
                        "cost": 2200.0,
                        "duration_min": 210,
                        "order_index": 3,
                    },
                ],
            },
            {
                "id": _SEED_DAY_2_ID,
                "trip_id": _SEED_TRIP_ID,
                "day_number": 2,
                "date": "2026-11-02",
                "summary": "Amber Fort, Jal Mahal views, and Hawa Mahal shopping",
                "estimated_cost": 7200.0,
                "items": [
                    {
                        "id": "item-201",
                        "day_id": _SEED_DAY_2_ID,
                        "time_slot": "08:30 - 12:00",
                        "type": "attraction",
                        "title": "Amber Fort & Maota Lake",
                        "description": "Hilltop fort featuring Sheesh Mahal (Mirror Palace) and cobblestone ramparts.",
                        "location": "Devisinghpura, Amer",
                        "lat": 26.9855,
                        "lng": 75.8513,
                        "cost": 1000.0,
                        "duration_min": 210,
                        "order_index": 0,
                    },
                    {
                        "id": "item-202",
                        "day_id": _SEED_DAY_2_ID,
                        "time_slot": "12:30 - 13:15",
                        "type": "attraction",
                        "title": "Jal Mahal Photo Stop",
                        "description": "Five-story palace standing in the center of Man Sagar Lake.",
                        "location": "Amer Road",
                        "lat": 26.9656,
                        "lng": 75.8433,
                        "cost": 0.0,
                        "duration_min": 45,
                        "order_index": 1,
                    },
                    {
                        "id": "item-203",
                        "day_id": _SEED_DAY_2_ID,
                        "time_slot": "13:30 - 15:00",
                        "type": "dining",
                        "title": "1135 AD Amber Fort",
                        "description": "Regal Rajput dining inside historic fortress halls.",
                        "location": "Amber Fort premises",
                        "lat": 26.9850,
                        "lng": 75.8500,
                        "cost": 2400.0,
                        "duration_min": 90,
                        "order_index": 2,
                    },
                    {
                        "id": "item-204",
                        "day_id": _SEED_DAY_2_ID,
                        "time_slot": "15:30 - 17:30",
                        "type": "attraction",
                        "title": "Hawa Mahal & Bapu Bazaar",
                        "description": "Palace of Winds honeycomb windows followed by block-printed textiles and juttis.",
                        "location": "Bapu Bazaar & Hawa Mahal Rd",
                        "lat": 26.9239,
                        "lng": 75.8267,
                        "cost": 1200.0,
                        "duration_min": 120,
                        "order_index": 3,
                    },
                ],
            },
        ],
    }
}


class PreferenceRepository:
    """Manages User Travel Preferences."""

    @staticmethod
    async def get_by_user_id(user_id: str) -> dict[str, Any] | None:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("preferences").select("*").eq("user_id", user_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Error fetching preferences from Supabase: {e}")

        # In-memory fallback
        return copy.deepcopy(_IN_MEMORY_PREFERENCES.get(user_id) or _IN_MEMORY_PREFERENCES.get(_SEED_USER_ID))

    @staticmethod
    async def upsert(user_id: str, data: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase_client()
        record = {
            "user_id": user_id,
            "interests": data.get("interests", ["sightseeing", "food", "culture"]),
            "travel_style": data.get("travel_style", "balanced"),
            "pace": data.get("pace", "moderate"),
            "budget_level": data.get("budget_level", "mid"),
            "accommodation_type": data.get("accommodation_type", "hotel"),
            "dietary_prefs": data.get("dietary_prefs", ["any"]),
            "updated_at": datetime.now(UTC).isoformat(),
        }

        if client:
            try:
                res = client.table("preferences").upsert(record, on_conflict="user_id").execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Error saving preferences to Supabase: {e}")

        # Update in-memory
        if user_id not in _IN_MEMORY_PREFERENCES:
            record["id"] = str(uuid.uuid4())
            record["created_at"] = datetime.now(UTC).isoformat()
        else:
            record["id"] = _IN_MEMORY_PREFERENCES[user_id]["id"]
            record["created_at"] = _IN_MEMORY_PREFERENCES[user_id]["created_at"]

        _IN_MEMORY_PREFERENCES[user_id] = record
        return copy.deepcopy(record)


class TripRepository:
    """Manages Trips, Days, and Itinerary items."""

    @staticmethod
    async def list_by_user(user_id: str) -> list[dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("trips").select("*, itinerary_days(*, itinerary_items(*))").order("created_at", desc=True).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning(f"Error reading trips from Supabase: {e}")

        # Return in-memory trips
        return [copy.deepcopy(t) for t in _IN_MEMORY_TRIPS.values()]

    @staticmethod
    async def get_by_id(trip_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("trips").select("*, itinerary_days(*, itinerary_items(*))").eq("id", trip_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Error fetching trip {trip_id} from Supabase: {e}")

        if trip_id in _IN_MEMORY_TRIPS:
            return copy.deepcopy(_IN_MEMORY_TRIPS[trip_id])
        return None

    @staticmethod
    async def create_trip(trip_data: dict[str, Any], user_id: str) -> dict[str, Any]:
        trip_id = str(uuid.uuid4())
        created_at = datetime.now(UTC).isoformat()

        days = trip_data.pop("days", [])

        full_trip = {
            "id": trip_id,
            "user_id": user_id,
            "title": trip_data.get("title", f"Trip to {trip_data.get('destination', 'India')}"),
            "destination": trip_data.get("destination", "India"),
            "start_date": str(trip_data.get("start_date")),
            "end_date": str(trip_data.get("end_date")),
            "budget": float(trip_data.get("budget", 25000.0)),
            "currency": trip_data.get("currency", "INR"),
            "group_size": int(trip_data.get("group_size", 1)),
            "status": trip_data.get("status", "planned"),
            "interests": trip_data.get("interests", []),
            "travel_style": trip_data.get("travel_style", "balanced"),
            "pace": trip_data.get("pace", "moderate"),
            "notes": trip_data.get("notes", ""),
            "members": [{"email": "user@yatra.local", "role": "owner"}],
            "created_at": created_at,
            "updated_at": created_at,
            "days": [],
        }

        # Build day and items structures
        for d_idx, d in enumerate(days):
            day_id = str(uuid.uuid4())
            day_items = []
            for i_idx, item in enumerate(d.get("items", [])):
                day_items.append({
                    "id": str(uuid.uuid4()),
                    "day_id": day_id,
                    "time_slot": item.get("time_slot", "Morning"),
                    "type": item.get("type", "attraction"),
                    "title": item.get("title", "Visit Destination"),
                    "description": item.get("description", ""),
                    "location": item.get("location", ""),
                    "lat": item.get("lat"),
                    "lng": item.get("lng"),
                    "cost": float(item.get("cost", 0.0)),
                    "duration_min": int(item.get("duration_min", 60)),
                    "order_index": item.get("order_index", i_idx),
                    "created_at": created_at,
                    "updated_at": created_at,
                })

            full_trip["days"].append({
                "id": day_id,
                "trip_id": trip_id,
                "day_number": d.get("day_number", d_idx + 1),
                "date": str(d.get("date", full_trip["start_date"])),
                "summary": d.get("summary", ""),
                "estimated_cost": float(d.get("estimated_cost", sum(i["cost"] for i in day_items))),
                "items": day_items,
                "created_at": created_at,
                "updated_at": created_at,
            })

        # Save to Supabase if configured
        client = get_supabase_client()
        if client:
            try:
                trip_db_payload = {k: v for k, v in full_trip.items() if k not in ("days", "members")}
                client.table("trips").insert(trip_db_payload).execute()
                for day in full_trip["days"]:
                    day_db_payload = {k: v for k, v in day.items() if k != "items"}
                    client.table("itinerary_days").insert(day_db_payload).execute()
                    if day["items"]:
                        client.table("itinerary_items").insert(day["items"]).execute()
            except Exception as e:
                logger.warning(f"Error persisting trip to Supabase: {e}")

        # Save to in-memory store
        _IN_MEMORY_TRIPS[trip_id] = full_trip
        return copy.deepcopy(full_trip)

    @staticmethod
    async def delete_trip(trip_id: str, user_id: str) -> bool:
        client = get_supabase_client()
        if client:
            try:
                client.table("trips").delete().eq("id", trip_id).execute()
            except Exception as e:
                logger.warning(f"Error deleting trip from Supabase: {e}")

        if trip_id in _IN_MEMORY_TRIPS:
            del _IN_MEMORY_TRIPS[trip_id]
            return True
        return False

    @staticmethod
    async def update_item(trip_id: str, day_id: str, item_id: str, update_fields: dict[str, Any]) -> dict[str, Any] | None:
        trip = _IN_MEMORY_TRIPS.get(trip_id)
        if not trip:
            return None

        for day in trip.get("days", []):
            if day.get("id") == day_id or not day_id:
                for item in day.get("items", []):
                    if item.get("id") == item_id:
                        item.update(update_fields)
                        item["updated_at"] = datetime.now(UTC).isoformat()
                        # Recalculate day cost
                        day["estimated_cost"] = sum(i.get("cost", 0.0) for i in day.get("items", []))
                        trip["updated_at"] = datetime.now(UTC).isoformat()
                        return copy.deepcopy(item)
        return None

    @staticmethod
    async def delete_item(trip_id: str, item_id: str) -> bool:
        trip = _IN_MEMORY_TRIPS.get(trip_id)
        if not trip:
            return False

        for day in trip.get("days", []):
            initial_len = len(day.get("items", []))
            day["items"] = [i for i in day.get("items", []) if i.get("id") != item_id]
            if len(day["items"]) < initial_len:
                day["estimated_cost"] = sum(i.get("cost", 0.0) for i in day.get("items", []))
                trip["updated_at"] = datetime.now(UTC).isoformat()
                return True
        return False

    @staticmethod
    async def add_item(trip_id: str, day_number: int, item_data: dict[str, Any]) -> dict[str, Any] | None:
        trip = _IN_MEMORY_TRIPS.get(trip_id)
        if not trip:
            return None

        target_day = None
        for day in trip.get("days", []):
            if day.get("day_number") == day_number:
                target_day = day
                break

        if not target_day:
            return None

        item_id = str(uuid.uuid4())
        new_item = {
            "id": item_id,
            "day_id": target_day.get("id"),
            "time_slot": item_data.get("time_slot", "Afternoon"),
            "type": item_data.get("type", "attraction"),
            "title": item_data.get("title", "New Activity"),
            "description": item_data.get("description", ""),
            "location": item_data.get("location", ""),
            "lat": item_data.get("lat"),
            "lng": item_data.get("lng"),
            "cost": float(item_data.get("cost", 0.0)),
            "duration_min": int(item_data.get("duration_min", 60)),
            "order_index": len(target_day.get("items", [])),
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
        }

        target_day["items"].append(new_item)
        target_day["estimated_cost"] = sum(i.get("cost", 0.0) for i in target_day["items"])
        trip["updated_at"] = datetime.now(UTC).isoformat()
        return copy.deepcopy(new_item)

    @staticmethod
    async def reorder_items(trip_id: str, day_number: int, ordered_item_ids: list[str]) -> bool:
        trip = _IN_MEMORY_TRIPS.get(trip_id)
        if not trip:
            return False

        for day in trip.get("days", []):
            if day.get("day_number") == day_number:
                items_by_id = {i["id"]: i for i in day.get("items", [])}
                new_items = []
                for idx, iid in enumerate(ordered_item_ids):
                    if iid in items_by_id:
                        item = items_by_id[iid]
                        item["order_index"] = idx
                        new_items.append(item)
                # Keep any items not explicitly in ordered_item_ids
                for i in day.get("items", []):
                    if i["id"] not in ordered_item_ids:
                        new_items.append(i)
                day["items"] = new_items
                trip["updated_at"] = datetime.now(UTC).isoformat()
                return True
        return False

    @staticmethod
    async def replace_day(trip_id: str, day_number: int, new_day_data: dict[str, Any]) -> dict[str, Any] | None:
        trip = _IN_MEMORY_TRIPS.get(trip_id)
        if not trip:
            return None

        for day in trip.get("days", []):
            if day.get("day_number") == day_number:
                day_id = day.get("id")
                day["summary"] = new_day_data.get("summary", day.get("summary"))
                day["estimated_cost"] = new_day_data.get("estimated_cost", 0.0)
                
                # Replace items
                new_items = []
                for idx, itm in enumerate(new_day_data.get("items", [])):
                    new_items.append({
                        "id": str(uuid.uuid4()),
                        "day_id": day_id,
                        "time_slot": itm.get("time_slot", "Morning"),
                        "type": itm.get("type", "attraction"),
                        "title": itm.get("title", ""),
                        "description": itm.get("description", ""),
                        "location": itm.get("location", ""),
                        "lat": itm.get("lat"),
                        "lng": itm.get("lng"),
                        "cost": float(itm.get("cost", 0.0)),
                        "duration_min": int(itm.get("duration_min", 60)),
                        "order_index": idx,
                        "created_at": datetime.now(UTC).isoformat(),
                        "updated_at": datetime.now(UTC).isoformat(),
                    })
                day["items"] = new_items
                trip["updated_at"] = datetime.now(UTC).isoformat()
                return copy.deepcopy(day)
        return None

    @staticmethod
    async def add_member(trip_id: str, email: str, role: str = "editor") -> dict[str, Any] | None:
        trip = _IN_MEMORY_TRIPS.get(trip_id)
        if not trip:
            return None
        members = trip.setdefault("members", [])
        # Check if already present
        for m in members:
            if m.get("email") == email:
                m["role"] = role
                return m
        member = {"email": email, "role": role, "joined_at": datetime.now(UTC).isoformat()}
        members.append(member)
        trip["updated_at"] = datetime.now(UTC).isoformat()
        return member
