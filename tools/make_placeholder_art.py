#!/usr/bin/env python3
"""Draw the placeholder Pawnzy poses until the team's real raccoon art arrives.

Run from the project folder:  python3 tools/make_placeholder_art.py
Writes assets/characters/pawnzy-<pose>.svg for every pose in lesson.json.
"""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "characters"
INK = "#1C1D20"
MASK = "#2F3238"
LINE = f'stroke="{INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"'
WHITE_LINE = 'stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none"'
LEFT_EYE, RIGHT_EYE = (72, 103), (128, 103)

HEAD = f"""<path d="M44 80 L56 30 Q60 23 67 30 L94 62 Z" fill="#858B94"/>
  <path d="M156 80 L144 30 Q140 23 133 30 L106 62 Z" fill="#858B94"/>
  <path d="M55 70 L61 42 L82 64 Z" fill="#3F434A"/>
  <path d="M145 70 L139 42 L118 64 Z" fill="#3F434A"/>
  <ellipse cx="100" cy="112" rx="66" ry="56" fill="#A3A9B1"/>
  <ellipse cx="56" cy="132" rx="22" ry="18" fill="#E8EBEF"/>
  <ellipse cx="144" cy="132" rx="22" ry="18" fill="#E8EBEF"/>
  <path d="M92 58 Q100 54 108 58 L104 84 Q100 88 96 84 Z" fill="#6F757E"/>
  <path d="M38 104 Q40 84 64 84 Q86 84 96 98 Q100 102 104 98 Q114 84 136 84 Q160 84 162 104 Q160 122 136 122 Q114 122 104 112 Q100 108 96 112 Q86 122 64 122 Q40 122 38 104 Z" fill="{MASK}"/>
  <ellipse cx="100" cy="142" rx="28" ry="22" fill="#F2F4F6"/>
  <ellipse cx="100" cy="128" rx="10" ry="7" fill="{INK}"/>"""

OPEN_MOUTH = f"""<path d="M85 139 Q100 143 115 139 Q113 160 100 160 Q87 160 85 139 Z" fill="{INK}"/>
  <path d="M91 153 Q100 146 109 153 Q107 160 100 160 Q93 160 91 153 Z" fill="#FF7A8A"/>"""

CONFETTI = """<rect x="20" y="16" width="12" height="18" rx="3" fill="#58CC02" transform="rotate(-24 26 25)"/>
  <rect x="166" y="14" width="12" height="18" rx="3" fill="#1CB0F6" transform="rotate(28 172 23)"/>
  <circle cx="34" cy="52" r="6" fill="#FF4B4B"/>
  <circle cx="170" cy="52" r="5" fill="#CE82FF"/>
  <rect x="94" y="4" width="10" height="16" rx="3" fill="#FF9600" transform="rotate(14 99 12)"/>"""


def eyes(radius, pupil):
    return "\n  ".join(
        f'<circle cx="{x}" cy="{y}" r="{radius}" fill="#FFFFFF"/><circle cx="{x}" cy="{y + 1}" r="{pupil}" fill="{INK}"/>'
        f'<circle cx="{x + 2}" cy="{y - 2}" r="1.8" fill="#FFFFFF"/>'
        for x, y in (LEFT_EYE, RIGHT_EYE)
    )


FACES = {
    "idle": f"""{eyes(9, 5)}
  <path d="M100 135v5M89 141q5.5 6 11 0q5.5 6 11 0" {LINE}/>""",
    "happy": f"""{eyes(9, 5)}
  {OPEN_MOUTH}""",
    "sad": f"""<path d="M58 80 L82 72M142 80 L118 72" {LINE}/>
  <path d="M64 101 Q72 109 80 101M120 101 Q128 109 136 101" {WHITE_LINE}/>
  <path d="M88 152 Q100 142 112 152" {LINE}/>""",
    "shocked": f"""<path d="M56 74 L80 68M144 74 L120 68" {LINE}/>
  {eyes(13, 5)}
  <ellipse cx="100" cy="149" rx="8" ry="10" fill="{INK}"/>""",
    "celebrate": f"""{CONFETTI}
  <path d="M63 106 Q72 95 81 106M119 106 Q128 95 137 106" {WHITE_LINE}/>
  {OPEN_MOUTH}""",
}


def main():
    for pose, face in FACES.items():
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <title>Pawnzy, {pose}</title>
  {HEAD}
  {face}
</svg>
"""
        (OUT / f"pawnzy-{pose}.svg").write_text(svg, encoding="utf-8")
    print(f"Wrote {len(FACES)} poses to {OUT}")


if __name__ == "__main__":
    main()
