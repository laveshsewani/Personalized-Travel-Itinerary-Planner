import pytest
from backend.app.services.llm import LLMService, repair_json


def test_repair_json_clean_string():
    clean_json = '{"title": "Jaipur Trip", "days": []}'
    parsed = repair_json(clean_json)
    assert parsed == {"title": "Jaipur Trip", "days": []}


def test_repair_json_markdown_wrapped():
    wrapped = '```json\n{"title": "Bhopal Explorer", "cost": 15000}\n```'
    parsed = repair_json(wrapped)
    assert parsed["title"] == "Bhopal Explorer"
    assert parsed["cost"] == 15000


def test_repair_json_trailing_comma():
    trailing = '{"items": ["Amber Fort", "City Palace", ], "budget": 5000, }'
    parsed = repair_json(trailing)
    assert parsed is not None
    assert parsed["budget"] == 5000


def test_controlled_mock_generator():
    res = LLMService.generate_controlled_mock(
        destination="Jaipur",
        start_date="2026-11-01",
        end_date="2026-11-03",
        num_days=3,
        budget=30000,
        group_size=2,
        interests=["culture", "food"],
        travel_style="balanced",
        pace="moderate",
    )
    assert res["destination"] == "Jaipur"
    assert len(res["days"]) == 3
    assert res["is_ai_generated"] is False
    assert res["llm_provider_used"] == "mock"
    assert "cost_breakdown" in res
    assert res["cost_breakdown"]["stay"] > 0
    assert len(res["days"][0]["items"]) >= 3


@pytest.mark.asyncio
async def test_generate_itinerary_offline_fallback():
    res = await LLMService.generate_itinerary(
        destination="Goa",
        start_date="2026-12-01",
        end_date="2026-12-03",
        budget=25000,
        group_size=2,
        interests=["nature", "nightlife"],
    )
    assert res["destination"] == "Goa"
    assert len(res["days"]) == 3
    assert res["total_estimated_cost"] > 0
