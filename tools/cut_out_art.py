#!/usr/bin/env python3
"""Cut Pawnzy's art out of the team's exported JPEGs.

Run from the project folder:  python3 tools/cut_out_art.py

The originals live untouched in assets/source/pawnzy/. Each full-body pose was
exported twice, on white and on black, so its transparency is recovered
exactly by comparing the two copies. Heads and props only exist on white, so
their background is removed by flooding in from the edges, which keeps white
details inside the shape (eyes, belly) intact. Results are written to
assets/characters/ as transparent PNGs.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "source" / "pawnzy"
OUT = ROOT / "assets" / "characters"
PADDING = 0.06

# Full-body poses, exported on white and on black.
PAIRS = {
    "pawnzy-standing": ("Untitled28_20261007001113.jpeg", "Untitled28_20261007001113.PNG.jpg"),
    "pawnzy-tiptoe": ("Untitled28_20261007001120.jpeg", "Untitled28_20261007001120.PNG.jpg"),
}

# Single layers exported on white.
LAYERS = {
    "pawnzy-head-front": "Untitled28_20261007001105.jpeg",
    "pawnzy-head-side": "Untitled28_20261007001049.jpeg",
    "apple": "Untitled28_20261007000830.jpeg",
    "book": "Untitled28_20261007000833.jpeg",
    "phone": "Untitled28_20261007000837.jpeg",
}


def load(name):
    return np.asarray(Image.open(SOURCE / name).convert("RGB")).astype(np.float32)


def alpha_from_pair(on_white, on_black):
    """Exact alpha from the same art composited over white and over black."""
    alpha = 1 - (on_white - on_black).mean(axis=2) / 255
    alpha = np.clip(alpha, 0, 1)
    alpha[alpha < 0.04] = 0
    alpha[alpha > 0.96] = 1
    color = np.where(alpha[..., None] > 0, on_black / np.maximum(alpha[..., None], 1e-3), 0)
    return np.clip(color, 0, 255), alpha


def alpha_from_white(on_white):
    """Background is whatever near-white region touches the image edge."""
    image = Image.fromarray(on_white.astype(np.uint8))
    marked = image.copy()
    height, width = on_white.shape[:2]
    for corner in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(marked, corner, (255, 0, 255), thresh=40)
    background = np.all(np.asarray(marked) == (255, 0, 255), axis=2)
    alpha = (~background).astype(np.float32)
    # Soften the edge one pixel, using how far each edge pixel is from white.
    edge = ndimage.binary_dilation(alpha > 0) & ~ndimage.binary_erosion(alpha > 0)
    lightness = on_white.mean(axis=2)
    alpha[edge] = np.clip((255 - lightness[edge]) / 120, 0, 1)
    return on_white, alpha


def keep_main_shapes(alpha):
    """Drop stray specks: keep shapes at least 1% the size of the largest."""
    solid = alpha > 0.5
    labels, count = ndimage.label(solid)
    if count == 0:
        return alpha
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    keep = np.isin(labels, [index + 1 for index, size in enumerate(sizes) if size >= sizes.max() * 0.01])
    return alpha * ndimage.binary_dilation(keep, iterations=2)


def save_square(color, alpha, name):
    alpha = keep_main_shapes(alpha)
    rows, columns = np.nonzero(alpha > 0.02)
    top, bottom, left, right = rows.min(), rows.max() + 1, columns.min(), columns.max() + 1
    rgba = np.dstack([color, alpha * 255]).astype(np.uint8)
    subject = Image.fromarray(rgba[top:bottom, left:right], "RGBA")
    side = int(max(subject.size) * (1 + 2 * PADDING))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(subject, ((side - subject.width) // 2, (side - subject.height) // 2))
    canvas.save(OUT / f"{name}.png", optimize=True)
    print(f"{name}.png  {side}x{side}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (white, black) in PAIRS.items():
        save_square(*alpha_from_pair(load(white), load(black)), name)
    for name, white in LAYERS.items():
        save_square(*alpha_from_white(load(white)), name)


if __name__ == "__main__":
    main()
