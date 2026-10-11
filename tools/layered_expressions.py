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

For the deck's design-process slide it also saves every layer cropped to its
paint in assets/characters/layers/<expression>/, and writes
deck/src/deck/layers.json with each layer's place on the canvas, bottom layer
first. The stacking order is read off merged.png: wherever two layers overlap
in different colors, the one whose color shows in merged.png is on top.
"""

import json

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from graphlib import TopologicalSorter
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cut_out_art import LARGE, OUT, PADDING, save_web  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "source" / "pawnzy"
MANIFEST = ROOT / "deck" / "src" / "deck" / "layers.json"

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


def layer_names(expression):
    return sorted(path.stem for path in (SOURCE / expression).glob("*.png") if path.stem != "merged")


def on_top(upper, lower, merged):
    """Whether `upper` shows over `lower` in merged.png, or None if they never differ."""
    overlap = (upper[..., 3] > 230) & (lower[..., 3] > 230)
    colors = [image[overlap][:, :3].astype(int) for image in (upper, lower, merged)]
    differ = np.abs(colors[0] - colors[1]).sum(axis=1) > 30
    if differ.sum() < 20:
        return None
    upper_match = np.abs(colors[0] - colors[2]).sum(axis=1) < np.abs(colors[1] - colors[2]).sum(axis=1)
    return upper_match[differ].mean() > 0.5


def stacking_order(expression, layers, merged):
    below = {name: set() for name in layers}
    names = list(layers)
    for index, first in enumerate(names):
        for second in names[index + 1:]:
            first_on_top = on_top(layers[first], layers[second], merged)
            if first_on_top is not None:
                below[first if first_on_top else second].add(second if first_on_top else first)
    return list(TopologicalSorter(below).static_order())


def export_layers(expression, merged):
    layers = {name: layer(expression, name) for name in layer_names(expression)}
    folder = OUT / "layers" / expression
    folder.mkdir(parents=True, exist_ok=True)
    placed = []
    for name in stacking_order(expression, layers, merged):
        image = Image.fromarray(layers[name], "RGBA")
        box = image.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
        image.crop(box).save(folder / f"{name}.png", optimize=True)
        placed.append({"name": name, "x": box[0], "y": box[1], "width": box[2] - box[0], "height": box[3] - box[1]})
    height, width = merged.shape[:2]
    return {"width": width, "height": height, "layers": placed}


def main():
    LARGE.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for expression in HEAD_LAYERS:
        merged = layer(expression, "merged")
        save(square(merged), f"pawnzy-standing-{expression}")
        save(square(head_only(merged, expression)), f"pawnzy-head-front-{expression}")
        manifest[expression] = export_layers(expression, merged)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
