#!/usr/bin/env python3
"""Cut Pawnzy's art out of the team's exported JPEGs, upscaled 4x.

Run from the project folder:
    python3 tools/cut_out_art.py --upscaler /path/to/realesrgan-ncnn-vulkan

The originals live untouched in assets/source/pawnzy/. Each piece is cropped,
upscaled 4x with Real-ESRGAN's realesr-animevideov3 model (the most faithful
to flat cartoon art), then cut out:

- Full-body poses were exported on white and on black, so transparency is
  recovered exactly by comparing the two upscaled copies.
- Heads and props only exist on white, so their background is removed by
  flooding in from the edges, which keeps white details inside intact.

Writes transparent PNGs to assets/characters/ at web size (1024px) and to
assets/characters/large/ at full size. tools/make_expressions.py then draws the
extra faces from these.
"""

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "source" / "pawnzy"
OUT = ROOT / "assets" / "characters"
LARGE = OUT / "large"
MODEL = "realesr-animevideov3"
SCALE = 4
CROP_MARGIN = 16
PADDING = 0.06
WEB_SIZE = 768

PAIRS = {
    "pawnzy-standing": ("Untitled28_20261007001113.jpeg", "Untitled28_20261007001113.PNG.jpg"),
    "pawnzy-tiptoe": ("Untitled28_20261007001120.jpeg", "Untitled28_20261007001120.PNG.jpg"),
}

LAYERS = {
    "pawnzy-head-front": "Untitled28_20261007001105.jpeg",
    "pawnzy-head-side": "Untitled28_20261007001049.jpeg",
    "apple": "Untitled28_20261007000830.jpeg",
    "book": "Untitled28_20261007000833.jpeg",
    "phone": "Untitled28_20261007000837.jpeg",
}


def load(name):
    return np.asarray(Image.open(SOURCE / name).convert("RGB"))


def subject_box(on_white):
    """Bounding box of the drawing, ignoring single stray pixels."""
    ink = on_white.astype(int).min(axis=2) < 225
    labels, count = ndimage.label(ink)
    sizes = ndimage.sum(ink, labels, range(1, count + 1))
    keep = np.isin(labels, [index + 1 for index, size in enumerate(sizes) if size >= sizes.max() * 0.01])
    rows, columns = np.nonzero(keep)
    height, width = ink.shape
    return (
        max(columns.min() - CROP_MARGIN, 0),
        max(rows.min() - CROP_MARGIN, 0),
        min(columns.max() + CROP_MARGIN, width),
        min(rows.max() + CROP_MARGIN, height),
    )


def upscale(upscaler, pixels, box):
    with tempfile.TemporaryDirectory() as scratch:
        source, target = Path(scratch) / "in.png", Path(scratch) / "out.png"
        Image.fromarray(pixels).crop(box).save(source)
        subprocess.run(
            [str(upscaler), "-i", str(source), "-o", str(target), "-n", MODEL, "-s", str(SCALE)],
            check=True, capture_output=True, cwd=Path(upscaler).parent,
        )
        return np.asarray(Image.open(target).convert("RGB")).astype(np.float32)


def alpha_from_pair(on_white, on_black):
    alpha = np.clip(1 - (on_white - on_black).mean(axis=2) / 255, 0, 1)
    alpha[alpha < 0.05] = 0
    alpha[alpha > 0.95] = 1
    color = np.where(alpha[..., None] > 0, on_black / np.maximum(alpha[..., None], 1e-3), 0)
    return np.clip(color, 0, 255), alpha


def alpha_from_white(on_white):
    image = Image.fromarray(on_white.astype(np.uint8))
    marked = image.copy()
    height, width = on_white.shape[:2]
    for corner in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(marked, corner, (255, 0, 255), thresh=40)
    background = np.all(np.asarray(marked) == (255, 0, 255), axis=2)
    alpha = (~background).astype(np.float32)
    edge = ndimage.binary_dilation(alpha > 0, iterations=2) & ~ndimage.binary_erosion(alpha > 0, iterations=2)
    lightness = on_white.mean(axis=2)
    alpha[edge] = np.clip((250 - lightness[edge]) / 110, 0, 1)
    return on_white, alpha


def keep_main_shapes(alpha):
    solid = alpha > 0.5
    labels, count = ndimage.label(solid)
    if count == 0:
        return alpha
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    keep = np.isin(labels, [index + 1 for index, size in enumerate(sizes) if size >= sizes.max() * 0.01])
    return alpha * ndimage.binary_dilation(keep, iterations=4)


def square(color, alpha):
    alpha = keep_main_shapes(alpha)
    rows, columns = np.nonzero(alpha > 0.02)
    top, bottom, left, right = rows.min(), rows.max() + 1, columns.min(), columns.max() + 1
    rgba = np.dstack([color, alpha * 255]).astype(np.uint8)
    subject = Image.fromarray(rgba[top:bottom, left:right], "RGBA")
    side = int(max(subject.size) * (1 + 2 * PADDING))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(subject, ((side - subject.width) // 2, (side - subject.height) // 2))
    return canvas


def save(image, name):
    image.save(LARGE / f"{name}.png", optimize=True)
    save_web(image, OUT / f"{name}.png")
    print(f"{name}.png  {image.width}px full")


def save_web(image, path):
    """Smaller copy for the lesson and deck: 768px with a 256-color palette,
    which flat cartoon art keeps without visible change."""
    web = image.resize((WEB_SIZE, WEB_SIZE), Image.LANCZOS) if image.width > WEB_SIZE else image
    web.quantize(256, method=Image.Quantize.FASTOCTREE).save(path, optimize=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--upscaler", required=True, help="Path to the realesrgan-ncnn-vulkan binary")
    upscaler = Path(parser.parse_args().upscaler).resolve()
    LARGE.mkdir(parents=True, exist_ok=True)
    for name, (white, black) in PAIRS.items():
        on_white, on_black = load(white), load(black)
        box = subject_box(on_white)
        save(square(*alpha_from_pair(upscale(upscaler, on_white, box), upscale(upscaler, on_black, box))), name)
    for name, white in LAYERS.items():
        on_white = load(white)
        save(square(*alpha_from_white(upscale(upscaler, on_white, subject_box(on_white)))), name)


if __name__ == "__main__":
    main()
