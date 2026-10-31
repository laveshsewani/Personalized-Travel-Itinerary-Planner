from backend.app.ml.recommender import RecommendationEngine


def test_recommender_curated_city():
    engine = RecommendationEngine()
    recs = engine.recommend(
        destination="Jaipur",
        interests=["culture", "sightseeing"],
        travel_style="balanced",
        pace="moderate",
        budget_level="mid",
        max_items_per_category=4,
    )
    assert recs["destination"] == "Jaipur"
    assert len(recs["ranked_attractions"]) > 0
    assert len(recs["ranked_dining"]) > 0
    assert len(recs["ranked_stays"]) > 0
    assert len(recs["transport_guidance"]) > 0

    top_attr = recs["ranked_attractions"][0]
    assert "recommendation_score" in top_attr
    assert 0.0 <= top_attr["recommendation_score"] <= 1.0


def test_recommender_fallback_city():
    engine = RecommendationEngine()
    recs = engine.recommend(
        destination="Ujjain",
        interests=["culture"],
        travel_style="relaxed",
        pace="moderate",
        budget_level="budget",
    )
    assert recs["destination"] == "Ujjain"
    assert len(recs["ranked_attractions"]) > 0
    assert "center" in recs
