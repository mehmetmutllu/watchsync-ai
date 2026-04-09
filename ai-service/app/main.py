from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.routers import ai
from app.routers import scraping

settings = get_settings()


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Ensure directories exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.output_dir, exist_ok=True)

    # Static files for output images
    application.mount(
        "/outputs",
        StaticFiles(directory=settings.output_dir),
        name="outputs",
    )

    # Routers
    application.include_router(ai.router, prefix="/api/ai", tags=["AI"])
    application.include_router(scraping.router, prefix="/api/scraping", tags=["Scraping"])

    @application.get("/health")
    async def health_check():
        return {"status": "ok", "service": settings.app_name}

    return application


app = create_app()
