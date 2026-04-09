from pydantic import BaseModel, Field
from enum import Enum


class BackgroundPreset(str, Enum):
    WHITE_STUDIO = "white_studio"
    BLACK_VELVET = "black_velvet"
    MARBLE = "marble"
    GRADIENT_GRAY = "gradient_gray"


class SegmentRequest(BaseModel):
    """Request body for segmentation with point prompts."""
    point_x: float = Field(..., ge=0, le=1, description="Normalized X coordinate (0-1)")
    point_y: float = Field(..., ge=0, le=1, description="Normalized Y coordinate (0-1)")


class SegmentResponse(BaseModel):
    mask_url: str
    rgba_url: str
    width: int
    height: int


class ReplaceBackgroundRequest(BaseModel):
    """Request body for background replacement."""
    preset: BackgroundPreset | None = None
    shadow: bool = Field(default=True, description="Add drop shadow")
    output_width: int | None = Field(default=None, ge=100, le=4096)
    output_height: int | None = Field(default=None, ge=100, le=4096)


class ReplaceBackgroundResponse(BaseModel):
    result_url: str
    original_url: str
    width: int
    height: int


class EnhanceResponse(BaseModel):
    """Combined segmentation + background replacement."""
    original_url: str
    rgba_url: str
    results: list[ReplaceBackgroundResponse]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
