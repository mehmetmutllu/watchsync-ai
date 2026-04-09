import logging
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

from app.schemas import BackgroundPreset

logger = logging.getLogger(__name__)

# Pre-defined background generators
_PRESET_COLORS = {
    BackgroundPreset.WHITE_STUDIO: (255, 255, 255),
    BackgroundPreset.BLACK_VELVET: (15, 15, 15),
    BackgroundPreset.MARBLE: None,  # uses gradient
    BackgroundPreset.GRADIENT_GRAY: None,
}


def replace_background(
    rgba_image: Image.Image,
    preset: BackgroundPreset | None = None,
    custom_bg: Image.Image | None = None,
    shadow: bool = True,
    output_width: int | None = None,
    output_height: int | None = None,
) -> Image.Image:
    """
    Replace the transparent background of an RGBA image.

    Args:
        rgba_image: RGBA PIL Image (watch with transparent BG).
        preset: One of the predefined background presets.
        custom_bg: Custom background image (overrides preset).
        shadow: Whether to render a drop shadow.
        output_width: Optional output width.
        output_height: Optional output height.

    Returns:
        RGB PIL Image with the new background.
    """
    w, h = rgba_image.size
    out_w = output_width or w
    out_h = output_height or h

    # Generate or resize background
    if custom_bg is not None:
        bg = custom_bg.convert("RGB").resize((out_w, out_h), Image.LANCZOS)
    elif preset is not None:
        bg = _generate_preset_bg(preset, out_w, out_h)
    else:
        bg = _generate_preset_bg(BackgroundPreset.WHITE_STUDIO, out_w, out_h)

    # Resize foreground to fit
    fg = rgba_image.copy()
    if (out_w, out_h) != (w, h):
        fg = _fit_foreground(fg, out_w, out_h)

    # Add shadow beneath the watch
    if shadow:
        bg = _add_shadow(bg, fg)

    # Composite
    bg.paste(fg, _center_offset(bg.size, fg.size), mask=fg.split()[3])
    return bg


def _generate_preset_bg(preset: BackgroundPreset, w: int, h: int) -> Image.Image:
    """Create a background image for the given preset."""
    color = _PRESET_COLORS.get(preset)
    if color is not None:
        return Image.new("RGB", (w, h), color)

    if preset == BackgroundPreset.MARBLE:
        return _marble_gradient(w, h)

    if preset == BackgroundPreset.GRADIENT_GRAY:
        return _radial_gradient(w, h, center=(200, 200, 200), edge=(60, 60, 60))

    return Image.new("RGB", (w, h), (255, 255, 255))


def _marble_gradient(w: int, h: int) -> Image.Image:
    """Create a light marble-like gradient background."""
    return _radial_gradient(w, h, center=(245, 242, 238), edge=(210, 205, 198))


def _radial_gradient(
    w: int,
    h: int,
    center: tuple[int, int, int],
    edge: tuple[int, int, int],
) -> Image.Image:
    """Radial gradient from center colour outward."""
    img = np.zeros((h, w, 3), dtype=np.uint8)
    Y, X = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    max_dist = np.sqrt(cx**2 + cy**2)
    dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2) / max_dist
    dist = np.clip(dist, 0, 1)

    for c in range(3):
        img[:, :, c] = (center[c] * (1 - dist) + edge[c] * dist).astype(np.uint8)

    return Image.fromarray(img)


def _fit_foreground(fg: Image.Image, canvas_w: int, canvas_h: int) -> Image.Image:
    """Scale foreground to fit within canvas while maintaining aspect ratio."""
    fg_w, fg_h = fg.size
    # Leave 10% padding
    max_w = int(canvas_w * 0.85)
    max_h = int(canvas_h * 0.85)
    ratio = min(max_w / fg_w, max_h / fg_h, 1.0)
    new_w = int(fg_w * ratio)
    new_h = int(fg_h * ratio)
    return fg.resize((new_w, new_h), Image.LANCZOS)


def _center_offset(
    canvas: tuple[int, int], fg: tuple[int, int]
) -> tuple[int, int]:
    """Calculate offset to centre fg on canvas."""
    return ((canvas[0] - fg[0]) // 2, (canvas[1] - fg[1]) // 2)


def _add_shadow(bg: Image.Image, fg: Image.Image) -> Image.Image:
    """Render a soft drop shadow on the background under the foreground."""
    shadow_offset = (8, 12)
    shadow_color = (0, 0, 0, 80)

    alpha = fg.split()[3]
    shadow_layer = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    offset = _center_offset(bg.size, fg.size)
    shadow_pos = (offset[0] + shadow_offset[0], offset[1] + shadow_offset[1])
    shadow_alpha = alpha.copy()
    shadow_img = Image.new("RGBA", fg.size, shadow_color)
    shadow_img.putalpha(shadow_alpha)
    shadow_layer.paste(shadow_img, shadow_pos)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=15))

    bg_rgba = bg.convert("RGBA")
    composite = Image.alpha_composite(bg_rgba, shadow_layer)
    return composite.convert("RGB")
