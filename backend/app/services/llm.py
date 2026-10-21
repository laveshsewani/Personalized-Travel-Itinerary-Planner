import json
import logging
import re
import time
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from backend.app.core.config import settings
from backend.app.ml.recommender import engine
from backend.app.services.prompts import SYSTEM_PROMPT, build_generation_prompt, build_regenerate_day_prompt

logger = logging.getLogger(__name__)

# Simple in-memory response cache: hash -> (timestamp, data)
_ITINERARY_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}

# Sliding window rate limiter: list of timestamps
_RATE_LIMIT_TIMESTAMPS: list[float] = []


def check_rate_limit() -> bool:
    """Returns True if within rate limit, False if rate limited."""
    now = time.time()
    cutoff = now - 60.0
    global _RATE_LIMIT_TIMESTAMPS
    _RATE_LIMIT_TIMESTAMPS = [t for t in _RATE_LIMIT_TIMESTAMPS if t > cutoff]
    if len(_RATE_LIMIT_TIMESTAMPS) >= settings.RATE_LIMIT_PER_MINUTE:
        return False
    _RATE_LIMIT_TIMESTAMPS.append(now)
    return True


def repair_json(text: str) -> dict[str, Any] | None:
    """Robustly cleans and repairs raw JSON output from LLM responses."""
    cleaned = text.strip()

    # Strip markdown code blocks if wrapped
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()

    # Attempt direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Extract outermost JSON object { ... }
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        snippet = cleaned[first_brace : last_brace + 1]
        try:
            return json.loads(snippet)
        except json.JSONDecodeError:
            # Remove trailing commas before closing braces/brackets
            fixed_commas = re.sub(r",\s*([\]}])", r"\1", snippet)
            try:
                return json.loads(fixed_commas)
            except json.JSONDecodeError:
                pass

    logger.warning("Failed to parse and repair JSON output from LLM.")
    return None


class LLMService:
    """Gateway service for itinerary generation with multi-provider and mock fallback."""

    @staticmethod
    async def call_groq(prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str | None:
        if not settings.LLM_API_KEY:
            return None
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.LLM_MODEL or "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
            "max_tokens": 4096,
        }
        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.warning(f"Groq API returned HTTP {resp.status_code}: {resp.text}")
                return None

    @staticmethod
    async def call_openai_compatible(prompt: str, base_url: str, system_prompt: str = SYSTEM_PROMPT) -> str | None:
        if not settings.LLM_API_KEY:
            return None
        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 4096,
        }
        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            return None

    @classmethod
    def generate_controlled_mock(
        cls,
        destination: str,
        start_date: str,
        end_date: str,
        num_days: int,
        budget: float,
        group_size: int,
        interests: list[str],
        travel_style: str,
        pace: str,
        dietary_prefs: list[str] | None = None,
        notes: str | None = "",
    ) -> dict[str, Any]:
        """Deterministic, rich offline mock itinerary generator for seamless local and offline operation."""
        # Query recommendation engine
        recs = engine.recommend(
            destination=destination,
            interests=interests,
            travel_style=travel_style,
            pace=pace,
            budget_level="mid",
            dietary_prefs=dietary_prefs,
            max_items_per_category=10,
        )

        attractions = recs.get("ranked_attractions", [])
        dining = recs.get("ranked_dining", [])
        stays = recs.get("ranked_stays", [])
        transports = recs.get("transport_guidance", [])

        # Start date parsing
        try:
            curr_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        except Exception:
            curr_date = datetime.now(UTC).date()

        days = []

        for d in range(1, num_days + 1):
            date_str = (curr_date + timedelta(days=d - 1)).isoformat()

            # Pick 2 attractions, 2 dining, and 1 transport item for this day
            attr_idx_1 = (d * 2 - 2) % len(attractions) if attractions else 0
            attr_idx_2 = (d * 2 - 1) % len(attractions) if attractions else 0
            dine_idx_1 = (d * 2 - 2) % len(dining) if dining else 0
            dine_idx_2 = (d * 2 - 1) % len(dining) if dining else 0
            trans_idx = (d - 1) % len(transports) if transports else 0

            a1 = attractions[attr_idx_1] if attractions else {"name": f"Explore {destination} Highlights", "lat": 26.9, "lng": 75.8, "estimated_cost": 250}
            a2 = attractions[attr_idx_2] if len(attractions) > 1 else {"name": f"{destination} Cultural Evening", "lat": 26.92, "lng": 75.82, "estimated_cost": 200}
            d1 = dining[dine_idx_1] if dining else {"name": f"Traditional Lunch in {destination}", "estimated_cost": 450, "signature_dish": "Regional Thali"}
            d2 = dining[dine_idx_2] if len(dining) > 1 else {"name": "Dinner & Street Food", "estimated_cost": 650, "signature_dish": "Chef Special"}
            tr = transports[trans_idx] if transports else {"type": "Auto-Rickshaw", "estimated_cost_base": 120}

            day_items = [
                {
                    "time_slot": "09:00 - 09:30",
                    "type": "transport",
                    "title": f"Transit via {tr.get('type', 'Auto-Rickshaw')}",
                    "description": tr.get("description", "Convenient point-to-point transit to morning attraction."),
                    "location": destination,
                    "lat": a1.get("lat"),
                    "lng": a1.get("lng"),
                    "cost": float(tr.get("estimated_cost_base", 120)),
                    "duration_min": 30,
                    "order_index": 0,
                },
                {
                    "time_slot": "09:30 - 12:30",
                    "type": "attraction",
                    "title": a1.get("name", f"Discover {destination}"),
                    "description": a1.get("description", f"Immerse in the iconic sights and heritage of {destination}."),
                    "location": f"Central {destination}",
                    "lat": a1.get("lat"),
                    "lng": a1.get("lng"),
                    "cost": float(a1.get("estimated_cost", 300)),
                    "duration_min": a1.get("duration_min", 180),
                    "order_index": 0,
                },
                {
                    "time_slot": "13:00 - 14:15",
                    "type": "dining",
                    "title": d1.get("name", "Regional Lunch"),
                    "description": f"Enjoy authentic flavors. Recommended: {d1.get('signature_dish', 'Traditional Thali')}.",
                    "location": f"{destination} Market",
                    "lat": d1.get("lat", a1.get("lat")),
                    "lng": d1.get("lng", a1.get("lng")),
                    "cost": float(d1.get("estimated_cost", 500)),
                    "duration_min": 75,
                    "order_index": 1,
                },
                {
                    "time_slot": "15:30 - 18:00",
                    "type": "attraction",
                    "title": a2.get("name", f"{destination} Heritage Walk"),
                    "description": a2.get("description", "Vibrant local bazaar, artisans, and architectural vantage points."),
                    "location": f"Old Town, {destination}",
                    "lat": a2.get("lat"),
                    "lng": a2.get("lng"),
                    "cost": float(a2.get("estimated_cost", 200)),
                    "duration_min": 150,
                    "order_index": 2,
                },
                {
                    "time_slot": "19:30 - 21:30",
                    "type": "dining",
                    "title": d2.get("name", "Evening Dinner"),
                    "description": f"Relaxed dinner ambiance. Don't miss: {d2.get('signature_dish', 'Local specialties')}.",
                    "location": f"{destination}",
                    "lat": d2.get("lat", a2.get("lat")),
                    "lng": d2.get("lng", a2.get("lng")),
                    "cost": float(d2.get("estimated_cost", 800)),
                    "duration_min": 120,
                    "order_index": 3,
                },
            ]

            day_cost = sum(i["cost"] for i in day_items)
            days.append({
                "day_number": d,
                "date": date_str,
                "summary": f"Day {d}: Exploring {a1.get('name')} followed by afternoon culture and {d2.get('name')}.",
                "estimated_cost": day_cost,
                "items": day_items,
            })

        total_est = sum(d["estimated_cost"] for d in days)
        # Add stay estimation
        stay_cost = (stays[0].get("estimated_cost_per_night", 2500) if stays else 2500) * max(num_days - 1, 1)

        return {
            "title": f"Bespoke {travel_style.title()} Journey to {destination}",
            "destination": destination,
            "summary": f"A thoughtfully paced {num_days}-day itinerary through {destination}, featuring key attractions, authentic local cuisine, and seamless transit.",
            "total_estimated_cost": round(total_est + stay_cost, 2),
            "cost_breakdown": {
                "stay": round(stay_cost, 2),
                "food": round(total_est * 0.55, 2),
                "activities": round(total_est * 0.35, 2),
                "transport": round(total_est * 0.10, 2),
            },
            "is_ai_generated": False,
            "llm_provider_used": "mock",
            "setup_notice": "Generated using our offline rule engine because LLM_API_KEY is not set. To enable live Llama-3 generation, set LLM_API_KEY in backend/.env.",
            "days": days,
        }

    @classmethod
    async def generate_itinerary(
        cls,
        destination: str,
        start_date: str,
        end_date: str,
        budget: float,
        group_size: int,
        interests: list[str],
        travel_style: str = "balanced",
        pace: str = "moderate",
        dietary_prefs: list[str] | None = None,
        notes: str | None = "",
    ) -> dict[str, Any]:
        """Primary method to generate an itinerary via LLM with caching and graceful mock fallback."""
        # Calculate number of days
        try:
            d_start = datetime.strptime(start_date, "%Y-%m-%d").date()
            d_end = datetime.strptime(end_date, "%Y-%m-%d").date()
            num_days = max((d_end - d_start).days + 1, 1)
        except Exception:
            num_days = 3

        # Check in-memory cache
        cache_key = f"{destination.lower()}_{start_date}_{end_date}_{int(budget)}_{group_size}_{travel_style}_{pace}_{','.join(sorted(interests))}"
        if cache_key in _ITINERARY_CACHE:
            ts, cached_data = _ITINERARY_CACHE[cache_key]
            if time.time() - ts < settings.CACHE_EXPIRATION_SECONDS:
                logger.info(f"Returning cached itinerary for {destination}")
                return cached_data

        # If rate limit exceeded, return mock or cached
        if not check_rate_limit():
            logger.warning("Rate limit reached; utilizing controlled generator.")
            return cls.generate_controlled_mock(
                destination, start_date, end_date, num_days, budget, group_size, interests, travel_style, pace, dietary_prefs, notes
            )

        # If no LLM key configured, return controlled mock immediately
        if not settings.LLM_API_KEY or settings.LLM_PROVIDER == "mock":
            logger.info(f"No LLM_API_KEY configured. Utilizing controlled mock generator for {destination}.")
            mock_res = cls.generate_controlled_mock(
                destination, start_date, end_date, num_days, budget, group_size, interests, travel_style, pace, dietary_prefs, notes
            )
            _ITINERARY_CACHE[cache_key] = (time.time(), mock_res)
            return mock_res

        # Retrieve recommendation context to inject into prompt
        recs = engine.recommend(
            destination=destination,
            interests=interests,
            travel_style=travel_style,
            pace=pace,
            budget_level="mid",
            dietary_prefs=dietary_prefs,
        )

        user_prompt = build_generation_prompt(
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            num_days=num_days,
            budget=budget,
            group_size=group_size,
            interests=interests,
            travel_style=travel_style,
            pace=pace,
            dietary_prefs=dietary_prefs,
            recommendations=recs,
            notes=notes,
        )

        raw_llm_response = None
        for attempt in range(settings.LLM_MAX_RETRIES + 1):
            try:
                if settings.LLM_PROVIDER == "groq":
                    raw_llm_response = await cls.call_groq(user_prompt)
                elif settings.LLM_PROVIDER == "together":
                    raw_llm_response = await cls.call_openai_compatible(user_prompt, base_url="https://api.together.xyz/v1")
                elif settings.LLM_PROVIDER == "openai":
                    raw_llm_response = await cls.call_openai_compatible(user_prompt, base_url="https://api.openai.com/v1")
                elif settings.LLM_PROVIDER == "gemini":
                    raw_llm_response = await cls.call_openai_compatible(
                        user_prompt, base_url="https://generativelanguage.googleapis.com/v1beta/openai"
                    )

                if raw_llm_response:
                    parsed = repair_json(raw_llm_response)
                    if parsed and "days" in parsed and len(parsed["days"]) > 0:
                        parsed["is_ai_generated"] = True
                        parsed["llm_provider_used"] = settings.LLM_PROVIDER
                        _ITINERARY_CACHE[cache_key] = (time.time(), parsed)
                        return parsed
            except Exception as e:
                logger.warning(f"LLM generation attempt {attempt + 1} error: {e}")

        logger.warning(f"All LLM generation attempts failed. Falling back to controlled mock for {destination}.")
        mock_res = cls.generate_controlled_mock(
            destination, start_date, end_date, num_days, budget, group_size, interests, travel_style, pace, dietary_prefs, notes
        )
        return mock_res

    @classmethod
    async def regenerate_single_day(
        cls,
        destination: str,
        day_number: int,
        date_str: str,
        custom_instruction: str,
        travel_style: str,
        pace: str,
        interests: list[str],
        current_day_summary: str,
    ) -> dict[str, Any]:
        """Regenerate a single day with custom instructions or fresh items."""
        if settings.LLM_API_KEY and settings.LLM_PROVIDER != "mock":
            prompt = build_regenerate_day_prompt(
                destination, day_number, date_str, custom_instruction, travel_style, pace, interests, current_day_summary
            )
            try:
                if settings.LLM_PROVIDER == "groq":
                    raw = await cls.call_groq(prompt)
                else:
                    raw = await cls.call_openai_compatible(prompt, "https://api.groq.com/openai/v1")
                if raw:
                    parsed = repair_json(raw)
                    if parsed and "items" in parsed:
                        return parsed
            except Exception as e:
                logger.warning(f"Error regenerating day with LLM: {e}")

        # Controlled regeneration fallback
        recs = engine.recommend(destination=destination, interests=interests, travel_style=travel_style, pace=pace)
        attractions = recs.get("ranked_attractions", [])
        dining = recs.get("ranked_dining", [])

        offset = (day_number + 1) % max(len(attractions), 1)
        a = attractions[offset] if attractions else {"name": f"Alternative Sights of {destination}", "lat": 26.9, "lng": 75.8, "estimated_cost": 300}
        d = dining[offset % max(len(dining), 1)] if dining else {"name": "Local Special Dinner", "estimated_cost": 600}

        return {
            "day_number": day_number,
            "date": date_str,
            "summary": f"Fresh day plan: {a.get('name')} with tailored recommendations: '{custom_instruction or 'Updated experiences'}'.",
            "estimated_cost": float(a.get("estimated_cost", 300) + d.get("estimated_cost", 600)),
            "items": [
                {
                    "time_slot": "10:00 - 13:00",
                    "type": "attraction",
                    "title": a.get("name", "Scenic Sight"),
                    "description": a.get("description", "Alternative exploration matching requested tweaks."),
                    "location": f"{destination}",
                    "lat": a.get("lat"),
                    "lng": a.get("lng"),
                    "cost": float(a.get("estimated_cost", 300)),
                    "duration_min": 180,
                    "order_index": 0,
                },
                {
                    "time_slot": "13:30 - 15:00",
                    "type": "dining",
                    "title": d.get("name", "Local Culinary Stop"),
                    "description": f"Curated dish: {d.get('signature_dish', 'Traditional delicacy')}.",
                    "location": f"{destination}",
                    "lat": d.get("lat"),
                    "lng": d.get("lng"),
                    "cost": float(d.get("estimated_cost", 600)),
                    "duration_min": 90,
                    "order_index": 1,
                },
            ],
        }
