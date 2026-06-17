import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from PIL import Image

from app.config import get_settings
from app.schemas import (
    BackgroundPreset,
    EnhanceResponse,
    ReplaceBackgroundResponse,
    SegmentResponse,
)
from app.services.segmentation import segment_image, extract_rgba, get_predictor
from app.services.background import replace_background

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()


def _save_image(img: Image.Image, prefix: str, fmt: str = "PNG") -> str:
    """Save an image to the output directory and return its relative URL path."""
    ext = "png" if fmt == "PNG" else "jpg"
    filename = f"{prefix}_{uuid.uuid4().hex[:12]}.{ext}"
    path = Path(settings.output_dir) / filename
    img.save(str(path), fmt, quality=95)
    return f"/outputs/{filename}"


@router.post("/segment", response_model=SegmentResponse)
async def segment(
    image: UploadFile = File(..., description="Watch image to segment"),
    point_x: float = Form(default=0.5, ge=0, le=1),
    point_y: float = Form(default=0.5, ge=0, le=1),
):
    """
    Segment the watch from the uploaded image using SAM 2.

    Returns the binary mask and an RGBA image with transparent background.
    """
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Unsupported image format. Use JPEG, PNG or WebP.")

    contents = await image.read()
    if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(413, f"Image exceeds {settings.max_upload_size_mb}MB limit.")

    image.file.seek(0)
    pil_image = Image.open(image.file).convert("RGB")

    mask = segment_image(pil_image, point_x, point_y)
    rgba = extract_rgba(pil_image, mask)

    mask_url = _save_image(
        Image.fromarray((mask.astype("uint8") * 255)),
        "mask",
    )
    rgba_url = _save_image(rgba, "rgba")

    return SegmentResponse(
        mask_url=mask_url,
        rgba_url=rgba_url,
        width=pil_image.width,
        height=pil_image.height,
    )


@router.post("/replace-background", response_model=ReplaceBackgroundResponse)
async def replace_bg(
    image: UploadFile = File(..., description="RGBA image (transparent background)"),
    preset: BackgroundPreset = Form(default=BackgroundPreset.WHITE_STUDIO),
    custom_background: UploadFile | None = File(default=None),
    shadow: bool = Form(default=True),
    output_width: int | None = Form(default=None, ge=100, le=4096),
    output_height: int | None = Form(default=None, ge=100, le=4096),
):
    """
    Replace the background of an RGBA watch image.

    Supply a preset name or upload a custom background image.
    """
    contents = await image.read()
    if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(413, f"Image exceeds {settings.max_upload_size_mb}MB limit.")

    image.file.seek(0)
    pil_image = Image.open(image.file).convert("RGBA")

    custom_bg = None
    if custom_background is not None:
        custom_bg = Image.open(custom_background.file).convert("RGB")

    result = replace_background(
        rgba_image=pil_image,
        preset=preset if custom_bg is None else None,
        custom_bg=custom_bg,
        shadow=shadow,
        output_width=output_width,
        output_height=output_height,
    )

    original_url = _save_image(pil_image, "original")
    result_url = _save_image(result, "result", "JPEG")

    return ReplaceBackgroundResponse(
        result_url=result_url,
        original_url=original_url,
        width=result.width,
        height=result.height,
    )


@router.post("/enhance", response_model=EnhanceResponse)
async def enhance(
    image: UploadFile = File(..., description="Watch image to enhance"),
    point_x: float = Form(default=0.5, ge=0, le=1),
    point_y: float = Form(default=0.5, ge=0, le=1),
    shadow: bool = Form(default=True),
):
    """
    Full pipeline: segment watch → remove background → generate multiple
    background variants (white studio, black velvet, marble).
    """
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Unsupported image format. Use JPEG, PNG or WebP.")

    contents = await image.read()
    if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(413, f"Image exceeds {settings.max_upload_size_mb}MB limit.")

    image.file.seek(0)
    pil_image = Image.open(image.file).convert("RGB")

    # Step 1: Segment
    mask = segment_image(pil_image, point_x, point_y)
    rgba = extract_rgba(pil_image, mask)

    original_url = _save_image(pil_image, "original", "JPEG")
    rgba_url = _save_image(rgba, "rgba")

    # Step 2: Generate background variants
    presets = [
        BackgroundPreset.WHITE_STUDIO,
        BackgroundPreset.BLACK_VELVET,
        BackgroundPreset.MARBLE,
    ]

    results = []
    for preset in presets:
        result = replace_background(rgba_image=rgba, preset=preset, shadow=shadow)
        result_url = _save_image(result, f"bg_{preset.value}", "JPEG")
        results.append(
            ReplaceBackgroundResponse(
                result_url=result_url,
                original_url=original_url,
                width=result.width,
                height=result.height,
            )
        )

    return EnhanceResponse(
        original_url=original_url,
        rgba_url=rgba_url,
        results=results,
    )


@router.get("/health")
async def ai_health():
    """Check if the AI model is loaded and ready."""
    try:
        predictor = get_predictor()
        return {"status": "ok", "model_loaded": predictor is not None}
    except Exception as e:
        return {"status": "degraded", "model_loaded": False, "error": str(e)}
