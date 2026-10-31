from backend.app.services.prompts import (
    SYSTEM_PROMPT,
    build_generation_prompt,
    build_regenerate_day_prompt,
)


def test_system_prompt_contains_critical_rules():
    assert "Indian Rupees" in SYSTEM_PROMPT or "INR" in SYSTEM_PROMPT
    assert "24-hour" in SYSTEM_PROMPT
    assert "JSON" in SYSTEM_PROMPT


def test_build_generation_prompt_injects_traveler_data():
    prompt = build_generation_prompt(
        destination="Jaipur",
        start_date="2026-11-01",
        end_date="2026-11-03",
        num_days=3,
        budget=35000,
        group_size=2,
        interests=["sightseeing", "food"],
        travel_style="balanced",
        pace="moderate",
        dietary_prefs=["vegetarian"],
    )
    assert "Jaipur" in prompt
    assert "35000" in prompt
    assert "vegetarian" in prompt
    assert "balanced" in prompt


def test_build_regenerate_day_prompt():
    prompt = build_regenerate_day_prompt(
        destination="Goa",
        day_number=2,
        date_str="2026-11-05",
        custom_instruction="Add sunset beach shack dinner",
        travel_style="relaxed",
        pace="moderate",
        interests=["nature", "nightlife"],
        current_day_summary="Beach stroll and fort visit",
    )
    assert "Day 2" in prompt
    assert "Goa" in prompt
    assert "sunset beach shack dinner" in prompt
