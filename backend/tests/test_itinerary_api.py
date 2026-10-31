from datetime import date, timedelta

import pytest
from backend.app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_recommendations_endpoint():
    payload = {
        "destination": "Jaipur",
        "interests": ["culture", "sightseeing"],
        "travel_style": "balanced",
        "pace": "moderate",
        "budget_level": "mid",
        "max_items": 4,
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["destination"] == "Jaipur"
    assert len(data["ranked_attractions"]) > 0


def test_preferences_get_and_put():
    # Update preferences
    payload = {
        "interests": ["adventure", "nature"],
        "travel_style": "relaxed",
        "pace": "moderate",
        "budget_level": "mid",
        "accommodation_type": "homestay",
        "dietary_prefs": ["vegetarian"],
    }
    put_res = client.put("/api/preferences", json=payload)
    assert put_res.status_code == 200
    assert put_res.json()["travel_style"] == "relaxed"

    # Get preferences
    get_res = client.get("/api/preferences")
    assert get_res.status_code == 200
    assert get_res.json()["travel_style"] == "relaxed"


@pytest.mark.parametrize("destination,days_count", [
    ("Bhopal", 2),
    ("Jaipur", 3),
    ("Goa", 4),
])
def test_generate_itinerary_for_indian_destinations(destination, days_count):
    start = date.today() + timedelta(days=10)
    end = start + timedelta(days=days_count - 1)
    payload = {
        "title": f"Trip to {destination}",
        "destination": destination,
        "start_date": str(start),
        "end_date": str(end),
        "budget": 20000 * days_count,
        "group_size": 2,
        "interests": ["sightseeing", "food"],
        "travel_style": "balanced",
        "pace": "moderate",
        "save_to_trips": True,
    }
    response = client.post("/api/itineraries/generate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["destination"] == destination
    assert len(data["days"]) == days_count
    assert data["budget"] == 20000 * days_count
    assert data["currency"] == "INR"

    trip_id = data["id"]

    # Verify retrieval
    get_res = client.get(f"/api/trips/{trip_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == trip_id

    # Verify single-day regeneration
    regen_res = client.post(
        f"/api/itineraries/{trip_id}/days/1/regenerate",
        json={"custom_instruction": "Add traditional local breakfast"},
    )
    assert regen_res.status_code == 200
    assert regen_res.json()["day_number"] == 1

    # Verify adding activity item
    item_payload = {
        "time_slot": "16:00 - 17:00",
        "type": "dining",
        "title": "Evening Masala Chai & Samosa",
        "description": "Authentic street snack experience",
        "location": f"Central {destination}",
        "cost": 150.0,
        "duration_min": 60,
        "order_index": 5,
    }
    add_item_res = client.post(f"/api/itineraries/{trip_id}/days/1/items", json=item_payload)
    assert add_item_res.status_code == 200
    new_item_id = add_item_res.json()["id"]

    # Verify editing item
    update_item_res = client.put(
        f"/api/itineraries/{trip_id}/items/{new_item_id}",
        json={"cost": 180.0, "title": "Special Kulhad Chai"},
    )
    assert update_item_res.status_code == 200
    assert update_item_res.json()["cost"] == 180.0

    # Verify deleting item
    del_item_res = client.delete(f"/api/itineraries/{trip_id}/items/{new_item_id}")
    assert del_item_res.status_code == 200

    # Verify trip delete
    del_res = client.delete(f"/api/trips/{trip_id}")
    assert del_res.status_code == 200


def test_invalid_itinerary_input():
    # Budget below minimum threshold
    invalid_payload = {
        "destination": "Delhi",
        "start_date": "2026-11-01",
        "end_date": "2026-11-03",
        "budget": 200,  # Below 1000 minimum
        "group_size": 1,
    }
    response = client.post("/api/itineraries/generate", json=invalid_payload)
    assert response.status_code == 422  # Pydantic validation error
