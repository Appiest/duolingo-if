#!/usr/bin/env python3
"""Generate a voice clip for every spoken line in lesson.json.

Run from the project folder on a Mac:  python3 tools/make_voice.py

Biscuit speaks the intro, the outro, every feedback line and his half of the
intro chat. The friend speaks the other half. The narrator reads every prompt
and the feedback headings from lesson.ui ("Great job!", "Not quite", and so on).
Voices and speeds come from lesson.json (character.voice, narrator.voice and
introChat.friend.voice). Clips are named by a
hash of voice + text, so editing a line makes a new clip and the old one is
deleted. The page finds clips through assets/voice/manifest.json.
"""

import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE_DIR = ROOT / "assets" / "voice"


def all_questions(data):
    q10 = data.get("q10", {})
    return [*data.get("questions", []), *q10.get("replays", {}).values(), q10.get("boss")]


def feedback_lines(question):
    if not question:
        return []
    lines = [entry["text"] for entry in question.get("feedback", {}).values()]
    lines += [option["feedback"] for option in question.get("options", []) if option.get("feedback")]
    return lines


def narrator_lines(lesson, questions):
    ui = lesson.get("ui", {})
    lines = [question["prompt"] for question in questions if question]
    lines += ui.get("praise", [])
    lines += [ui[key] for key in ("incorrect", "almost") if ui.get(key)]
    combo = ui.get("combo")
    if combo:
        lines += [combo.replace("{count}", str(count)) for count in ui.get("comboMilestones", [])]
    return lines


def spoken_lines(data):
    lesson = data["lesson"]
    biscuit = lesson["character"]["voice"]
    narrator = lesson.get("narrator", {}).get("voice", biscuit)
    chat = lesson.get("introChat", {})
    friend = chat.get("friend", {}).get("voice", biscuit)

    lines = [(biscuit, lesson["intro"]["speech"]), (biscuit, lesson["outro"]["speech"])]
    for message in chat.get("messages", []):
        lines.append((friend if message["from"] == "friend" else biscuit, message["text"]))
    for question in all_questions(data):
        lines += [(biscuit, text) for text in feedback_lines(question)]
    lines += [(narrator, text) for text in narrator_lines(lesson, all_questions(data))]
    return lines


def spoken_form(text, pronunciations):
    for written, spoken in pronunciations.items():
        text = text.replace(written, spoken)
    return re.sub(r"\s+", " ", text).strip()


def clip_name(voice, text):
    key = f"{voice['macVoice']}|{voice.get('rate', 175)}|{text}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:12] + ".m4a"


def render_clip(voice, text, target):
    with tempfile.TemporaryDirectory() as scratch:
        aiff = Path(scratch) / "line.aiff"
        subprocess.run(["say", "-v", voice["macVoice"], "-r", str(voice.get("rate", 175)), "-o", str(aiff), text], check=True)
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", str(aiff), str(target)], check=True)


def clip_seconds(path):
    info = subprocess.run(["afinfo", str(path)], check=True, capture_output=True, text=True).stdout
    match = re.search(r"estimated duration: ([\d.]+)", info)
    return round(float(match.group(1)), 3) if match else None


def main():
    data = json.loads((ROOT / "lesson.json").read_text(encoding="utf-8"))
    pronunciations = data["lesson"].get("pronunciations", {})
    VOICE_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {}
    for voice, text in spoken_lines(data):
        name = clip_name(voice, spoken_form(text, pronunciations))
        target = VOICE_DIR / name
        if not target.exists():
            render_clip(voice, spoken_form(text, pronunciations), target)
            print(f"made {name}  {text[:60]}")
        manifest[text] = {"file": f"assets/voice/{name}", "seconds": clip_seconds(target)}

    used = {Path(entry["file"]).name for entry in manifest.values()}
    for stale in VOICE_DIR.glob("*.m4a"):
        if stale.name not in used:
            stale.unlink()
            print(f"removed {stale.name}")

    (VOICE_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(manifest)} lines in assets/voice/manifest.json")


if __name__ == "__main__":
    main()
