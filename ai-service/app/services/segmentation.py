import logging
import numpy as np
import torch
from PIL import Image
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_predictor = None


def get_predictor():
    """Lazy-load SAM 2 model predictor."""
    global _predictor
    if _predictor is not None:
        return _predictor

    checkpoint = Path(settings.sam2_checkpoint)
    if not checkpoint.exists():
        raise RuntimeError(
            f"SAM 2 checkpoint not found at {checkpoint}. "
            "Download it with: python scripts/download_model.py"
        )

    try:
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor

        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Loading SAM 2 model on %s …", device)

        sam2_model = build_sam2(
            settings.sam2_model_cfg,
            str(checkpoint),
            device=device,
        )
        _predictor = SAM2ImagePredictor(sam2_model)
        logger.info("SAM 2 model loaded successfully.")
    except ImportError:
        logger.warning("sam2 package not installed — using fallback segmentation")
        _predictor = None

    return _predictor


def segment_image(
    image: Image.Image,
    point_x: float,
    point_y: float,
) -> np.ndarray:
    """
    Segment the watch from the image using SAM 2 with a point prompt.

    Args:
        image: PIL Image (RGB).
        point_x: Normalized X coordinate (0-1).
        point_y: Normalized Y coordinate (0-1).

    Returns:
        Binary mask as numpy array (H, W), dtype bool.
    """
    predictor = get_predictor()
    img_array = np.array(image)
    h, w = img_array.shape[:2]

    # Convert normalised coords to pixel coords
    px = int(point_x * w)
    py = int(point_y * h)
    input_point = np.array([[px, py]])
    input_label = np.array([1])  # 1 = foreground

    if predictor is None:
        # Fallback: simple center-crop elliptical mask
        logger.warning("SAM 2 not available, returning fallback elliptical mask")
        return _fallback_mask(h, w, px, py)

    predictor.set_image(img_array)
    masks, scores, _ = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True,
    )

    # Pick the mask with highest confidence
    best_idx = int(np.argmax(scores))
    return masks[best_idx]


def extract_rgba(image: Image.Image, mask: np.ndarray) -> Image.Image:
    """
    Apply the binary mask to produce an RGBA image with transparent background.

    Includes basic color decontamination at mask edges.
    """
    img_array = np.array(image.convert("RGB"))
    h, w = img_array.shape[:2]

    # Ensure mask matches image dimensions
    if mask.shape != (h, w):
        mask_img = Image.fromarray(mask.astype(np.uint8) * 255)
        mask_img = mask_img.resize((w, h), Image.NEAREST)
        mask = np.array(mask_img) > 127

    # Create alpha channel
    alpha = (mask.astype(np.uint8) * 255)

    # Basic edge colour decontamination
    alpha = _refine_alpha_edges(alpha)

    # Compose RGBA
    rgba = np.dstack([img_array, alpha])
    return Image.fromarray(rgba, "RGBA")


def _refine_alpha_edges(alpha: np.ndarray, radius: int = 2) -> np.ndarray:
    """Soften alpha edges to reduce colour fringing."""
    from scipy.ndimage import gaussian_filter
    smoothed = gaussian_filter(alpha.astype(np.float32), sigma=radius)
    # Keep hard interior, smooth edge only
    result = np.where(alpha == 255, 255, np.clip(smoothed, 0, 255))
    return result.astype(np.uint8)


def _fallback_mask(h: int, w: int, cx: int, cy: int) -> np.ndarray:
    """Generate an elliptical mask centred at (cx, cy) as a fallback."""
    Y, X = np.ogrid[:h, :w]
    rx, ry = w * 0.3, h * 0.3
    mask = ((X - cx) ** 2 / rx**2 + (Y - cy) ** 2 / ry**2) <= 1
    return mask
