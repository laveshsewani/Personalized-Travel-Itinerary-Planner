from backend.app.ml.recommender import engine
from backend.app.schemas.recommendations import RecommendationRequest, RecommendationResponse
from fastapi import APIRouter

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("", response_model=RecommendationResponse)
async def get_travel_recommendations(req: RecommendationRequest):
    """
    Compute ranked attractions, dining, stays, and transport for a given destination.
    Uses lightweight TF-IDF and rule heuristics without requiring heavy GPU or neural models.
    """
    res = engine.recommend(
        destination=req.destination,
        interests=req.interests,
        travel_style=req.travel_style,
        pace=req.pace,
        budget_level=req.budget_level,
        dietary_prefs=req.dietary_prefs,
        max_items_per_category=req.max_items,
    )
    return res
