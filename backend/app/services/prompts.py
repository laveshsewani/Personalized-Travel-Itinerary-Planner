import json
from typing import Any

SYSTEM_PROMPT = """You are an expert Indian travel planner and cultural concierge with deep logistical knowledge of tourism across all states and union territories of India.
Your mission is to generate an authentic, realistic, logistically coherent, and culturally enriching day-by-day travel itinerary strictly tailored to the traveler's budget, dates, group size, interests, pace, and dietary needs.

CRITICAL OPERATIONAL & REGIONAL RULES:
1. CURRENCY: Always calculate in Indian Rupees (INR / ₹). Keep the total estimated trip cost strictly within the traveler's budget.
2. INDIAN LOGISTICAL CONTEXT: Factor in realistic Indian travel modes: auto-rickshaws, app cabs (Ola/Uber), metro systems (Delhi, Jaipur, Bengaluru, Mumbai), heritage walking tours, and local trains/buses. Use 24-hour time slots (e.g., '09:00 - 11:30', '13:00 - 14:30', '16:00 - 18:30', '19:30 - 22:00').
3. PACE & CLIMATE: Respect Indian weather and pace (e.g., avoid outdoor exposure in peak afternoon summer heat; schedule temples early morning or evening Ganga aartis at dusk).
4. COSTS: All prices are strictly 'estimated costs' in INR (₹). Never claim live pricing or confirmed tickets.
5. PROXIMITY: Group activities by geographical proximity where known, avoiding cross-city zig-zagging.
6. FORMAT: Respond ONLY with a valid, raw JSON object matching the requested schema. Do NOT include markdown code fences (```json), commentary, or explanations outside the JSON.
"""


def build_generation_prompt(
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
    recommendations: dict[str, Any] | None = None,
    notes: str | None = "",
) -> str:
    """Builds the structured user prompt injecting traveler context and ML recommendations."""
    context_data = {
        "destination": destination,
        "start_date": start_date,
        "end_date": end_date,
        "number_of_days": num_days,
        "total_budget_inr": budget,
        "group_size": group_size,
        "interests": interests,
        "travel_style": travel_style,
        "pace": pace,
        "dietary_preferences": dietary_prefs or ["any"],
        "special_notes": notes or "None",
    }

    recs_snippet = ""
    if recommendations:
        top_attractions = [a.get("name") for a in recommendations.get("ranked_attractions", [])[:4]]
        top_dining = [d.get("name") for d in recommendations.get("ranked_dining", [])[:3]]
        top_stays = [s.get("name") for s in recommendations.get("ranked_stays", [])[:2]]
        recs_snippet = f"""
Top Curated Regional Nodes to Consider Incorporating:
- Must-consider Attractions: {', '.join(top_attractions) if top_attractions else 'Local landmarks'}
- Recommended Dining: {', '.join(top_dining) if top_dining else 'Authentic local cuisine'}
- Stay Options: {', '.join(top_stays) if top_stays else 'Central hotel/guesthouse'}
"""

    prompt = f"""Generate a detailed {num_days}-day itinerary for {destination}, India based on these traveler parameters:
{json.dumps(context_data, indent=2)}
{recs_snippet}

JSON SCHEMA SPECIFICATION:
{{
  "title": "Evocative and inspiring title for the trip (e.g., 'Royal Heritage & Culinary Odyssey of Jaipur')",
  "destination": "{destination}",
  "summary": "2-3 sentences summarizing the overall journey experience and highlight themes.",
  "total_estimated_cost": {budget * 0.9},
  "cost_breakdown": {{
    "stay": {budget * 0.35},
    "food": {budget * 0.25},
    "activities": {budget * 0.25},
    "transport": {budget * 0.15}
  }},
  "days": [
    {{
      "day_number": 1,
      "date": "{start_date}",
      "summary": "Daily theme and highlights overview",
      "estimated_cost": 2500,
      "items": [
        {{
          "time_slot": "09:00 - 11:30",
          "type": "attraction",
          "title": "Specific attraction name",
          "description": "Engaging 1-2 sentence description including local tips (e.g. guide availability, photography)",
          "location": "Locality or landmark name",
          "lat": 26.9855,
          "lng": 75.8513,
          "cost": 500.0,
          "duration_min": 150
        }},
        {{
          "time_slot": "13:00 - 14:15",
          "type": "dining",
          "title": "Restaurant or eatery name",
          "description": "Recommended authentic regional dishes to taste",
          "location": "Locality name",
          "lat": 26.9197,
          "lng": 75.8242,
          "cost": 750.0,
          "duration_min": 75
        }},
        {{
          "time_slot": "15:30 - 17:30",
          "type": "attraction",
          "title": "Afternoon cultural or shopping highlight",
          "description": "What to see or experience",
          "location": "Locality name",
          "lat": 26.9248,
          "lng": 75.8246,
          "cost": 250.0,
          "duration_min": 120
        }},
        {{
          "time_slot": "19:30 - 21:30",
          "type": "dining",
          "title": "Evening dinner experience",
          "description": "Dinner ambiance and flavors",
          "location": "Locality name",
          "lat": 26.7663,
          "lng": 75.8362,
          "cost": 1200.0,
          "duration_min": 120
        }}
      ]
    }}
  ]
}}

Generate all {num_days} days. Ensure each day contains 3 to 5 realistic items (attraction, dining, stay, transport). Ensure sum of item costs matches day estimated_cost and does not exceed the total budget of ₹{budget:,.0f}.
"""
    return prompt.strip()


def build_regenerate_day_prompt(
    destination: str,
    day_number: int,
    date_str: str,
    custom_instruction: str,
    travel_style: str,
    pace: str,
    interests: list[str],
    current_day_summary: str,
) -> str:
    """Prompt for regenerating a single day with custom traveler tweaks."""
    return f"""Regenerate ONLY Day {day_number} ({date_str}) of an itinerary for {destination}, India.
Current summary of this day was: "{current_day_summary}"
Traveler's specific modification request: "{custom_instruction or 'Provide fresh alternate activities and dining options'}"
Traveler style: {travel_style}, Pace: {pace}, Interests: {', '.join(interests)}.

Respond ONLY with a JSON object for Day {day_number}:
{{
  "day_number": {day_number},
  "date": "{date_str}",
  "summary": "Updated day summary reflecting requested changes",
  "estimated_cost": 2400.0,
  "items": [
    {{
      "time_slot": "09:00 - 11:30",
      "type": "attraction",
      "title": "Activity Name",
      "description": "Specific details and advice",
      "location": "Locality",
      "lat": 26.9,
      "lng": 75.8,
      "cost": 400.0,
      "duration_min": 150
    }}
  ]
}}
"""
