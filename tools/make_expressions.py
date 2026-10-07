#!/usr/bin/env python3
"""Draw Pawnzy's extra expressions onto the team's art.

Run after tools/cut_out_art.py:  python3 tools/make_expressions.py

The team drew one face (happy). This finds that face's eyes, pupils and mouth
in the front head and the standing pose, paints over them with colors sampled
from the art, and draws new features in the same flat style: black features,
white eyes, the dark mask color for lids. Writes, for each expression:

    assets/characters/pawnzy-head-front-<expression>.png
    assets/characters/pawnzy-standing-<expression>.png

plus full-size copies in assets/characters/large/.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cut_out_art import save_web  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "characters"
LARGE = OUT / "large"
WEB_SIZE = 768
SUPERSAMPLE = 4

INK = (14, 14, 16)
TONGUE = (255, 134, 154)
TEAR = (128, 196, 245)
BASES = ["pawnzy-head-front", "pawnzy-standing"]


def blobs(mask, minimum):
    labels, count = ndimage.label(mask)
    boxes = ndimage.find_objects(labels)
    sizes = ndimage.sum(mask, labels, range(1, count + 1))
    found = []
    for index in np.argsort(sizes)[::-1]:
        if sizes[index] < minimum:
            break
        rows, columns = boxes[index]
        found.append({"box": (columns.start, rows.start, columns.stop, rows.stop), "mask": labels == index + 1, "size": sizes[index]})
    return found


def center(box):
    return ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2)


def inside(inner, outer, margin=0):
    return inner[0] >= outer[0] - margin and inner[1] >= outer[1] - margin and inner[2] <= outer[2] + margin and inner[3] <= outer[3] + margin


def find_face(rgb, alpha):
    """Eyes are the two white blobs on the dark mask; pupils sit inside them;
    the nose and mouth are the black blobs between and below the eyes."""
    solid = alpha > 200
    whites = blobs(solid & (rgb.min(axis=2) > 225), 3000)
    blacks = blobs(solid & (rgb.max(axis=2) < 45), 800)
    eyes = sorted([white for white in whites if white["size"] < 20000][:2], key=lambda white: white["box"][0])
    pupils = [next(black for black in blacks if inside(black["box"], eye["box"], 6)) for eye in eyes]
    eye_bottom = max(eye["box"][3] for eye in eyes)
    between = (eyes[0]["box"][2], eyes[1]["box"][0])
    below = [black for black in blacks if between[0] - 40 < center(black["box"])[0] < between[1] + 40 and black["box"][1] > eye_bottom - 40]
    nose, mouth = sorted(below, key=lambda black: black["box"][1])[:2]
    return {"eyes": eyes, "pupils": pupils, "nose": nose, "mouth": mouth}


def mask_area(rgb, alpha, face):
    """The dark mask around the eyes, as a soft 0-1 map, so lids stay inside it."""
    dark = (alpha > 200) & (np.abs(rgb - (63, 64, 71)).max(axis=2) < 30)
    eyes = face["eyes"][0]["mask"] | face["eyes"][1]["mask"] | face["pupils"][0]["mask"] | face["pupils"][1]["mask"]
    area = ndimage.binary_closing(dark | ndimage.binary_dilation(eyes, iterations=6), iterations=4)
    area = ndimage.binary_fill_holes(area)
    return ndimage.gaussian_filter(area.astype(np.float32), 1.2)


def sample_ring(rgb, mask, width):
    ring = ndimage.binary_dilation(mask, iterations=width + 4) & ~ndimage.binary_dilation(mask, iterations=width)
    return tuple(int(value) for value in np.median(rgb[ring], axis=0))


def erase(rgb, mask, color, grow):
    """Paint over a feature with a soft edge, so no outline of it is left behind."""
    area = ndimage.binary_dilation(mask, iterations=grow).astype(np.float32)
    soft = np.clip(ndimage.gaussian_filter(area, 3) * 1.6, 0, 1)[..., None]
    rgb[:] = rgb * (1 - soft) + np.array(color, dtype=np.float32) * soft


class Canvas:
    """Draws antialiased shapes over a region of the image at 4x, then blends them in."""

    def __init__(self, rgb, region, clip=None):
        self.rgb, self.region, self.clip = rgb, region, clip
        width, height = region[2] - region[0], region[3] - region[1]
        self.layer = Image.new("RGBA", (width * SUPERSAMPLE, height * SUPERSAMPLE), (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.layer)

    def point(self, x, y):
        return ((x - self.region[0]) * SUPERSAMPLE, (y - self.region[1]) * SUPERSAMPLE)

    def ellipse(self, cx, cy, rx, ry, color):
        (left, top), (right, bottom) = self.point(cx - rx, cy - ry), self.point(cx + rx, cy + ry)
        self.draw.ellipse((left, top, right, bottom), fill=color + (255,))

    def polygon(self, points, color):
        self.draw.polygon([self.point(x, y) for x, y in points], fill=color + (255,))

    def curve(self, start, control, end, width, color, steps=40):
        points = [quadratic(start, control, end, step / steps) for step in range(steps + 1)]
        scaled = [self.point(x, y) for x, y in points]
        self.draw.line(scaled, fill=color + (255,), width=int(width * SUPERSAMPLE), joint="curve")
        for x, y in (points[0], points[-1]):
            self.ellipse(x, y, width / 2, width / 2, color)

    def with_clip(self, clip):
        return Canvas(self.rgb, self.region, clip)

    def blend(self):
        width, height = self.region[2] - self.region[0], self.region[3] - self.region[1]
        small = np.asarray(self.layer.resize((width, height), Image.LANCZOS)).astype(np.float32)
        cover = small[..., 3:] / 255
        if self.clip is not None:
            cover = cover * self.clip[self.region[1]:self.region[3], self.region[0]:self.region[2], None]
        patch = self.rgb[self.region[1]:self.region[3], self.region[0]:self.region[2]]
        patch[:] = patch * (1 - cover) + small[..., :3] * cover


def quadratic(start, control, end, t):
    return tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c for a, b, c in zip(start, control, end))


def face_region(face, height, width):
    boxes = [eye["box"] for eye in face["eyes"]] + [face["mouth"]["box"]]
    return (
        max(min(box[0] for box in boxes) - 80, 0),
        max(min(box[1] for box in boxes) - 80, 0),
        min(max(box[2] for box in boxes) + 80, width),
        min(max(box[3] for box in boxes) + 120, height),
    )


def eye_size(eye):
    left, top, right, bottom = eye["box"]
    return center(eye["box"]), (right - left) / 2, (bottom - top) / 2


def shocked(canvas, face, colors):
    for eye in face["eyes"]:
        (cx, cy), rx, ry = eye_size(eye)
        canvas.ellipse(cx, cy - ry * 0.06, rx * 1.1, ry * 1.08, (255, 255, 255))
        canvas.ellipse(cx, cy, rx * 0.36, ry * 0.36, INK)
        canvas.ellipse(cx - rx * 0.12, cy - ry * 0.14, rx * 0.11, ry * 0.11, (255, 255, 255))
    (mx, my), mouth_width = center(face["mouth"]["box"]), face["mouth"]["box"][2] - face["mouth"]["box"][0]
    canvas.ellipse(mx, my + 6, mouth_width * 0.2, mouth_width * 0.27, INK)


def sad(canvas, face, colors):
    eyes = canvas.with_clip(None)
    for side, eye in enumerate(face["eyes"]):
        (cx, cy), rx, ry = eye_size(eye)
        outward = -1 if side == 0 else 1
        eyes.ellipse(cx, cy, rx * 0.95, ry * 0.95, (255, 255, 255))
        eyes.ellipse(cx - outward * rx * 0.08, cy + ry * 0.3, rx * 0.52, ry * 0.52, INK)
        eyes.ellipse(cx - outward * rx * 0.24, cy + ry * 0.14, rx * 0.14, ry * 0.14, (255, 255, 255))
    eyes.blend()
    lids = canvas.with_clip(colors["mask_area"])
    for side, eye in enumerate(face["eyes"]):
        (cx, cy), rx, ry = eye_size(eye)
        outward = -1 if side == 0 else 1
        inner = (cx - outward * rx * 1.4, cy - ry * 0.62)
        outer = (cx + outward * rx * 1.4, cy + ry * 0.2)
        lids.polygon([inner, outer, (outer[0], cy - ry * 2), (inner[0], cy - ry * 2)], colors["mask"])
    lids.blend()
    (mx, my), mouth_width = center(face["mouth"]["box"]), face["mouth"]["box"][2] - face["mouth"]["box"][0]
    stroke = (face["mouth"]["box"][3] - face["mouth"]["box"][1]) * 0.36
    canvas.curve((mx - mouth_width * 0.36, my + 16), (mx, my - 26), (mx + mouth_width * 0.36, my + 16), stroke, INK)
    (ex, ey), erx, ery = eye_size(face["eyes"][0])
    tear_x, tear_y = ex + erx * 0.2, ey + ery * 1.25
    canvas.polygon([(tear_x, tear_y - ery * 0.42), (tear_x - erx * 0.2, tear_y), (tear_x + erx * 0.2, tear_y)], TEAR)
    canvas.ellipse(tear_x, tear_y + erx * 0.02, erx * 0.2, erx * 0.2, TEAR)


def celebrate(canvas, face, colors):
    for eye in face["eyes"]:
        (cx, cy), rx, ry = eye_size(eye)
        stroke = rx * 0.32
        canvas.curve((cx - rx * 0.75, cy + ry * 0.25), (cx, cy - ry * 0.75), (cx + rx * 0.75, cy + ry * 0.25), stroke, INK)
    left, top, right, bottom = face["mouth"]["box"]
    mx, mouth_width = (left + right) / 2, right - left
    mouth_top = top - 4
    mouth = [quadratic((mx - mouth_width * 0.55, mouth_top), (mx, mouth_top + mouth_width * 1.15), (mx + mouth_width * 0.55, mouth_top), step / 30) for step in range(31)]
    canvas.polygon(mouth, INK)
    canvas.ellipse(mx, mouth_top + mouth_width * 0.43, mouth_width * 0.26, mouth_width * 0.14, TONGUE)


EXPRESSIONS = {"shocked": shocked, "sad": sad, "celebrate": celebrate}


def make(base, expression, draw):
    image = np.asarray(Image.open(LARGE / f"{base}.png").convert("RGBA")).astype(np.float32)
    rgb, alpha = image[..., :3].copy(), image[..., 3]
    face = find_face(rgb.astype(int), alpha)
    colors = {
        "mask": sample_ring(rgb, face["eyes"][0]["mask"], 14),
        "muzzle": sample_ring(rgb, face["mouth"]["mask"], 10),
        "mask_area": mask_area(rgb, alpha, face),
    }
    for eye, pupil in zip(face["eyes"], face["pupils"]):
        erase(rgb, eye["mask"] | pupil["mask"], colors["mask"], 12)
    erase(rgb, face["mouth"]["mask"], colors["muzzle"], 9)
    canvas = Canvas(rgb, face_region(face, *alpha.shape))
    draw(canvas, face, colors)
    canvas.blend()
    result = Image.fromarray(np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8), "RGBA")
    name = f"{base}-{expression}"
    result.save(LARGE / f"{name}.png", optimize=True)
    save_web(result, OUT / f"{name}.png")
    print(f"{name}.png")


def main():
    for base in BASES:
        for expression, draw in EXPRESSIONS.items():
            make(base, expression, draw)


if __name__ == "__main__":
    main()
