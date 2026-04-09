from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "WatchSync AI Service"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8001

    # SAM 2 model
    sam2_checkpoint: str = "/app/models/sam2_hiera_small.pt"
    sam2_model_cfg: str = "sam2_hiera_s"

    # Upload / output
    max_upload_size_mb: int = 20
    output_dir: str = "/app/outputs"
    upload_dir: str = "/app/uploads"

    # CORS
    allowed_origins: list[str] = ["http://localhost:8000", "http://localhost:3000"]

    model_config = {"env_prefix": "AI_", "env_file": ".env"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
