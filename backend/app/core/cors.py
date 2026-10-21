from backend.app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app):
    origins = settings.CORS_ORIGINS
    if isinstance(origins, str):
        origins = [origins]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != ["*"] else ["*"],
        allow_origin_regex=r"https://.*\.vercel\.app" if "*" not in origins else None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
