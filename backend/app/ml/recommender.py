import json
import logging
from pathlib import Path
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

DATA_FILE = Path(__file__).parent / "data" / "destinations.json"


class BaseScorer:
    """Abstract interface for scoring travel items.

    Allows plugging in neural Transformer embeddings in the future without API contract changes.
    """

    def compute_scores(self, query_text: str, candidate_texts: list[str]) -> list[float]:
        raise NotImplementedError


class TfidfRuleScorer(BaseScorer):
    """Lightweight vector + cosine similarity scorer using Scikit-Learn TF-IDF."""

    def compute_scores(self, query_text: str, candidate_texts: list[str]) -> list[float]:
        if not candidate_texts:
            return []
        corpus = [query_text] + candidate_texts
        try:
            vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(corpus)
            query_vec = tfidf_matrix[0:1]
            candidate_vecs = tfidf_matrix[1:]
            sims = cosine_similarity(query_vec, candidate_vecs)[0]
            # Convert to standard float list
            return [round(float(s), 4) for s in sims]
        except Exception as e:
            logger.warning(f"TF-IDF scoring fallback to rule-based: {e}")
            return [0.5] * len(candidate_texts)


class RecommendationEngine:
    """Production recommendation service for India-first itineraries."""

    def __init__(self):
        self.destinations: dict[str, dict[str, Any]] = {}
        self.scorer: BaseScorer = TfidfRuleScorer()
        self._load_data()

    def _load_data(self):
        if not DATA_FILE.exists():
            logger.warning(f"Data file {DATA_FILE} not found.")
            return
        try:
            with open(DATA_FILE, encoding="utf-8") as f:
                data = json.load(f)
                for dest in data.get("destinations", []):
                    city_key = dest.get("city", "").strip().lower()
                    self.destinations[city_key] = dest
            logger.info(f"Loaded {len(self.destinations)} destinations into recommendation catalog.")
        except Exception as e:
            logger.error(f"Error loading destinations catalog: {e}")

    def _build_preference_query(
        self,
        interests: list[str],
        travel_style: str,
        pace: str,
        budget_level: str,
        dietary_prefs: list[str] | None = None,
    ) -> str:
        tokens = list(interests)
        tokens.extend([travel_style, pace, budget_level])
        if dietary_prefs:
            tokens.extend(dietary_prefs)
        return " ".join(tokens)

    def _fallback_destination_catalog(self, destination: str) -> dict[str, Any]:
        """Provides dynamic catalog if destination is not in static dataset."""
        dest_clean = destination.strip().title()
        return {
            "city": dest_clean,
            "state": "India",
            "tags": ["culture", "sightseeing", "food", "relaxation"],
            "center": {"lat": 20.5937, "lng": 78.9629},
            "attractions": [
                {
                    "name": f"Historic Central Landmark of {dest_clean}",
                    "category": "heritage",
                    "tags": ["culture", "sightseeing", "history"],
                    "lat": 20.5937,
                    "lng": 78.9629,
                    "estimated_cost": 250,
                    "duration_min": 120,
                    "best_time": "Morning (09:00 - 12:00)",
                    "description": f"Architectural and cultural landmark capturing the essence of {dest_clean}.",
                },
                {
                    "name": f"{dest_clean} Heritage Promenade & Bazaar",
                    "category": "shopping",
                    "tags": ["shopping", "culture", "sightseeing"],
                    "lat": 20.5950,
                    "lng": 78.9640,
                    "estimated_cost": 150,
                    "duration_min": 120,
                    "best_time": "Late Afternoon",
                    "description": "Vibrant local market for authentic artisan crafts, spices, and souvenirs.",
                },
                {
                    "name": f"{dest_clean} Lake or Scenic Viewpoint",
                    "category": "nature",
                    "tags": ["nature", "relaxation"],
                    "lat": 20.5910,
                    "lng": 78.9600,
                    "estimated_cost": 50,
                    "duration_min": 90,
                    "best_time": "Sunset (17:30 - 19:00)",
                    "description": "Peaceful scenic vista perfect for golden hour photography and unwinding.",
                },
            ],
            "dining": [
                {
                    "name": f"{dest_clean} Traditional Thali Bhavan",
                    "cuisine": "Regional Authentic Indian",
                    "tags": ["food", "culture"],
                    "price_level": "mid",
                    "estimated_cost": 450,
                    "vegetarian_friendly": True,
                    "signature_dish": "Traditional Regional Thali",
                    "lat": 20.5940,
                    "lng": 78.9630,
                    "description": f"Renowned for fresh home-style flavors and authentic recipes of {dest_clean}.",
                },
                {
                    "name": f"{dest_clean} Street Food Square",
                    "cuisine": "Local Indian Street Food & Chaat",
                    "tags": ["food", "streetfood"],
                    "price_level": "budget",
                    "estimated_cost": 200,
                    "vegetarian_friendly": True,
                    "signature_dish": "Piping-hot local snacks & masala chai",
                    "lat": 20.5945,
                    "lng": 78.9635,
                    "description": "Bustling street stalls serving regional snacks and fresh beverages.",
                },
            ],
            "stays": [
                {
                    "name": f"{dest_clean} Heritage Boutique Stay / Hotel",
                    "type": "hotel",
                    "price_category": "mid",
                    "estimated_cost_per_night": 3200,
                    "amenities": ["Free WiFi", "Breakfast", "Air Conditioning"],
                    "lat": 20.5920,
                    "lng": 78.9610,
                },
                {
                    "name": f"Backpackers Haven {dest_clean}",
                    "type": "hostel",
                    "price_category": "budget",
                    "estimated_cost_per_night": 750,
                    "amenities": ["WiFi", "Community Area", "City Center"],
                    "lat": 20.5930,
                    "lng": 78.9620,
                },
            ],
            "transport": [
                {
                    "type": "Auto-Rickshaw & E-Rickshaws",
                    "estimated_cost_base": 70,
                    "description": "Affordable point-to-point transit through city roads.",
                    "tip": "Agree on fare or verify meter before boarding.",
                },
                {
                    "type": "Local Taxi / App Cabs",
                    "estimated_cost_base": 250,
                    "description": "Comfortable air-conditioned transport across town.",
                    "tip": "Book via Ola, Uber, or local taxi stand.",
                },
            ],
        }

    def recommend(
        self,
        destination: str,
        interests: list[str],
        travel_style: str = "balanced",
        pace: str = "moderate",
        budget_level: str = "mid",
        dietary_prefs: list[str] | None = None,
        max_items_per_category: int = 5,
    ) -> dict[str, Any]:
        """Scores and ranks attractions, dining, stays, and transport for a trip."""
        dest_key = destination.strip().lower()
        dest_data = self.destinations.get(dest_key)
        if not dest_data:
            dest_data = self._fallback_destination_catalog(destination)

        query_text = self._build_preference_query(
            interests=interests,
            travel_style=travel_style,
            pace=pace,
            budget_level=budget_level,
            dietary_prefs=dietary_prefs,
        )

        def score_items(items: list[dict[str, Any]], item_type: str) -> list[dict[str, Any]]:
            if not items:
                return []

            candidate_texts = []
            for item in items:
                tags = " ".join(item.get("tags", []))
                desc = item.get("description", "")
                cat = item.get("category", item.get("type", item.get("cuisine", "")))
                candidate_texts.append(f"{cat} {tags} {desc} {item.get('name', '')}")

            vector_scores = self.scorer.compute_scores(query_text, candidate_texts)

            scored_list = []
            for idx, item in enumerate(items):
                v_score = vector_scores[idx] if idx < len(vector_scores) else 0.5

                # Rule-based heuristics
                rule_boost = 0.0
                item_tags = [t.lower() for t in item.get("tags", [])]
                for interest in interests:
                    if interest.lower() in item_tags:
                        rule_boost += 0.15

                # Budget match bonus
                price_cat = item.get("price_level", item.get("price_category", "mid"))
                if price_cat == budget_level:
                    rule_boost += 0.10

                # Dietary consideration
                if dietary_prefs and "vegetarian" in dietary_prefs and item.get("vegetarian_friendly") is True:
                    rule_boost += 0.10

                final_score = min(round(float(0.5 * v_score + 0.5 * min(rule_boost, 1.0) + 0.2), 3), 0.99)

                item_copy = dict(item)
                item_copy["recommendation_score"] = final_score
                item_copy["type"] = item_type
                scored_list.append(item_copy)

            # Sort descending by score
            scored_list.sort(key=lambda x: x["recommendation_score"], reverse=True)
            return scored_list[:max_items_per_category]

        ranked_attractions = score_items(dest_data.get("attractions", []), "attraction")
        ranked_dining = score_items(dest_data.get("dining", []), "dining")
        ranked_stays = score_items(dest_data.get("stays", []), "stay")
        transport_options = dest_data.get("transport", [])

        return {
            "destination": dest_data.get("city", destination),
            "state": dest_data.get("state", "India"),
            "center": dest_data.get("center", {"lat": 20.5937, "lng": 78.9629}),
            "ranked_attractions": ranked_attractions,
            "ranked_dining": ranked_dining,
            "ranked_stays": ranked_stays,
            "transport_guidance": transport_options,
            "query_summary": {
                "interests": interests,
                "travel_style": travel_style,
                "pace": pace,
                "budget_level": budget_level,
            },
        }


engine = RecommendationEngine()
