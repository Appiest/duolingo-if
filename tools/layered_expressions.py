#!/usr/bin/env python3
"""Build Pawnzy's thinking and sad art from the team's layered exports.

Run from the project folder:  python3 tools/layered_expressions.py

Each folder in assets/source/pawnzy/<expression>/ holds the team's layers on
one shared canvas, plus merged.png with every layer flattened in the right
order. The full-body pose is merged.png cropped to the drawing. The head
portrait is merged.png kept only where the head layers are, so the stacking
order still comes from the team's flattened copy.

Writes, for each expression:

    assets/characters/pawnzy-standing-<expression>.png
    assets/characters/pawnzy-head-front-<expression>.png

plus full-size copies in assets/characters/large/.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cut_out_art import LARGE, OUT, PADDING, save_web  # noqa: E402

SOURCE = Path(__file__).resolve().parent.parent / "assets" / "source" / "pawnzy"

HEAD_LAYERS = {
    "thinking": ["head", "ear-left", "ear-right", "brows", "eye-left", "eye-right", "muzzle", "paw-on-chin"],
    "sad": ["head", "ear-left", "ear-right", "brow-left", "brow-right", "eye-left", "eye-right", "muzzle"],
}


def layer(expression, name):
    return np.asarray(Image.open(SOURCE / expression / f"{name}.png").convert("RGBA"))


def head_only(merged, expression):
    """Alpha from merged.png, limited to where any head layer has paint."""
    cover = np.max([layer(expression, name)[..., 3] for name in HEAD_LAYERS[expression]], axis=0) > 128
    soft = ndimage.gaussian_filter(cover.astype(np.float32), 0.8)
    head = merged.copy()
    head[..., 3] = (merged[..., 3] * soft).astype(np.uint8)
    return head


def square(pixels):
    image = Image.fromarray(pixels, "RGBA")
    subject = image.crop(image.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox())
    side = int(max(subject.size) * (1 + 2 * PADDING))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(subject, ((side - subject.width) // 2, (side - subject.height) // 2))
    return canvas


def save(image, name):
    image.save(LARGE / f"{name}.png", optimize=True)
    save_web(image, OUT / f"{name}.png")
    print(f"{name}.png  {image.width}px full")


def main():
    LARGE.mkdir(parents=True, exist_ok=True)
    for expression in HEAD_LAYERS:
        merged = layer(expression, "merged")
        save(square(merged), f"pawnzy-standing-{expression}")
        save(square(head_only(merged, expression)), f"pawnzy-head-front-{expression}")


if __name__ == "__main__":
    main()
