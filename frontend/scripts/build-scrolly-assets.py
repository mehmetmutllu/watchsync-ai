# Landing scrollytelling asset pipeline.
# Input : foto1..foto4.png at repo root (Gemini keyframes)
# Output: frontend/public/media/scrolly/  (cleaned base frames + exploded-view
#         component layers cut from foto3) + layers.json metadata.
# Run   : py frontend/scripts/build-scrolly-assets.py   (from repo root)

import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "frontend", "public", "media", "scrolly")
os.makedirs(OUT, exist_ok=True)

TARGET_BG = np.array([9.0, 11.0, 14.0])  # #090b0e
SIZE = (1672, 941)


def load(name):
    return Image.open(os.path.join(ROOT, f"{name}.png")).convert("RGB")


def corner_bg(a):
    c = np.concatenate([
        a[:40, :40].reshape(-1, 3), a[:40, -40:].reshape(-1, 3),
        a[-40:, :40].reshape(-1, 3), a[-40:, -40:].reshape(-1, 3),
    ])
    return c.mean(0)


def normalize_bg(im):
    a = np.asarray(im).astype(np.float64)
    off = corner_bg(a) - TARGET_BG
    a = np.clip(a - off, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def patch_watermark_foto1(im):
    # Gemini sparkle sits around x[2483,2539] y[1305,1343] in the 2752x1536 frame.
    a = np.asarray(im).copy()
    y0, y1, x0, x1 = 1260, 1390, 2420, 2610
    src = a[y0:y1, x0 - 500:x1 - 500].copy()
    a[y0:y1, x0:x1] = src
    return Image.fromarray(a)


# ---------- base frames ----------
foto1 = patch_watermark_foto1(load("foto1")).resize(SIZE, Image.LANCZOS)
foto1 = normalize_bg(foto1)
foto2 = normalize_bg(load("foto2"))
foto3 = normalize_bg(load("foto3"))
foto4 = normalize_bg(load("foto4"))

foto1.save(os.path.join(OUT, "front.jpg"), quality=90)
foto2.save(os.path.join(OUT, "angle.jpg"), quality=90)
foto3.save(os.path.join(OUT, "exploded.jpg"), quality=90)
foto4.save(os.path.join(OUT, "back.jpg"), quality=90)
print("base frames saved")

# ---------- cut foto3 into horizontal-band layers ----------
# The exploded parts are stacked on one vertical axis. Row-profile analysis of
# this specific frame gives clean gaps / waists at these y coordinates:
CUTS = [0, 129, 196, 325, 497, 637, 941]
NAMES = ["crystal", "hands", "dial", "movement", "bezel", "case"]
FEATHER = 8  # px of alpha ramp at band cut lines

a = np.asarray(foto3).astype(np.float64)
H, W, _ = a.shape
dist = np.sqrt(((a - TARGET_BG) ** 2).sum(2))
# soft alpha from color distance to bg; parts render on the same bg color so
# edge fringe is invisible
alpha_full = np.clip((dist - 8.0) / 24.0, 0.0, 1.0)

meta = {"frame": {"w": W, "h": H}, "layers": []}
for i, name in enumerate(NAMES):
    y0, y1 = CUTS[i], CUTS[i + 1]
    al = alpha_full.copy()
    al[:y0] = 0
    al[y1:] = 0
    # feather at interior cut lines
    if y0 > 0:
        for k in range(FEATHER):
            if y0 + k < H:
                al[y0 + k] *= (k + 1) / (FEATHER + 1)
    if y1 < H:
        for k in range(FEATHER):
            if y1 - 1 - k >= 0:
                al[y1 - 1 - k] *= (k + 1) / (FEATHER + 1)

    ys, xs = np.where(al > 0.02)
    bx0, bx1 = int(xs.min()), int(xs.max())
    by0, by1 = int(ys.min()), int(ys.max())
    pad = 4
    bx0, by0 = max(0, bx0 - pad), max(0, by0 - pad)
    bx1, by1 = min(W - 1, bx1 + pad), min(H - 1, by1 + pad)

    rgba = np.zeros((by1 - by0 + 1, bx1 - bx0 + 1, 4), dtype=np.uint8)
    rgba[:, :, :3] = a[by0:by1 + 1, bx0:bx1 + 1].astype(np.uint8)
    rgba[:, :, 3] = (al[by0:by1 + 1, bx0:bx1 + 1] * 255).astype(np.uint8)
    Image.fromarray(rgba).save(os.path.join(OUT, f"layer-{name}.png"))

    w_al = al[by0:by1 + 1, bx0:bx1 + 1]
    tot = w_al.sum()
    yy, xx = np.mgrid[by0:by1 + 1, bx0:bx1 + 1]
    meta["layers"].append({
        "name": name,
        "x": bx0, "y": by0,
        "w": int(bx1 - bx0 + 1), "h": int(by1 - by0 + 1),
        "cx": round(float((xx * w_al).sum() / tot), 1),
        "cy": round(float((yy * w_al).sum() / tot), 1),
    })
    print(f"layer {name:9s} bbox=({bx0},{by0},{bx1},{by1}) center=({meta['layers'][-1]['cx']},{meta['layers'][-1]['cy']})")

with open(os.path.join(OUT, "layers.json"), "w") as f:
    json.dump(meta, f, indent=1)
print("layers.json saved")
