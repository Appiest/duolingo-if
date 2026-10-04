"""Every line in lesson.json that gets spoken, in the order a learner hears it.

Each line says who speaks it, where it plays, and how the character feels,
so whoever records it knows how to read it.
"""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE_DIR = ROOT / "assets" / "voice"
MANIFEST = VOICE_DIR / "manifest.json"
NARRATOR = "Narrator"


def load_lesson():
    raw = json.loads((ROOT / "lesson.json").read_text(encoding="utf-8"))
    return fill_character_name(raw, raw["lesson"]["character"]["name"])


def fill_character_name(value, name):
    if isinstance(value, str):
        return value.replace("{name}", name)
    if isinstance(value, list):
        return [fill_character_name(item, name) for item in value]
    if isinstance(value, dict):
        return {key: fill_character_name(item, name) for key, item in value.items()}
    return value


def line_id(speaker, text):
    return hashlib.sha1(f"{speaker}|{text}".encode("utf-8")).hexdigest()[:10]


def make_line(speaker, text, where, mood=None):
    return {"id": line_id(speaker, text), "speaker": speaker, "text": text, "where": where, "mood": mood}


def labelled_questions(data):
    questions = [(f"Question {index}", question) for index, question in enumerate(data["questions"], start=1)]
    q10 = data.get("q10", {})
    questions += [(f"Question 10 replay ({concept})", question) for concept, question in q10.get("replays", {}).items()]
    if q10.get("boss"):
        questions.append(("Question 10 boss", q10["boss"]))
    return questions


def question_lines(label, question, character):
    lines = [make_line(NARRATOR, question["prompt"], f"{label}, read when the question appears")]
    for outcome, entry in question.get("feedback", {}).items():
        when = "after a right answer" if outcome == "correct" else "after a wrong answer"
        lines.append(make_line(character, entry["text"], f"{label}, {when}", entry.get("pose")))
    wrong_mood = question.get("feedback", {}).get("incorrect", {}).get("pose")
    for option in question.get("options", []):
        if option.get("feedback"):
            picked = option.get("text") or option.get("label")
            lines.append(make_line(character, option["feedback"], f"{label}, after picking “{picked}”", wrong_mood))
    return lines


def heading_lines(ui):
    headings = [*ui.get("praise", []), ui.get("incorrect"), ui.get("almost")]
    combo = ui.get("combo")
    if combo:
        headings += [combo.replace("{count}", str(count)) for count in ui.get("comboMilestones", [])]
    return [make_line(NARRATOR, text, "Feedback heading, read before the character's line") for text in headings if text]


def chat_label(data, question_id):
    for label, question in labelled_questions(data):
        if question["id"] == question_id:
            return label
    return question_id


def spoken_lines(data):
    lesson = data["lesson"]
    character = lesson["character"]["name"]
    chat = lesson.get("introChat", {})
    friend = chat.get("friend", {}).get("name", "Friend")

    lines = [make_line(character, lesson["intro"]["speech"], "Start screen", lesson["intro"].get("pose"))]
    for number, message in enumerate(chat.get("messages", []), start=1):
        speaker = friend if message["from"] == "friend" else character
        lines.append(make_line(speaker, message["text"], f"Intro chat, message {number}", message.get("pose")))
    for teach in lesson.get("teachChats", []):
        place = f"Lesson chat before {chat_label(data, teach['before'])}"
        chat_friend = teach.get("friend", {}).get("name", friend)
        for number, message in enumerate(teach.get("messages", []), start=1):
            speaker = chat_friend if message["from"] == "friend" else character
            lines.append(make_line(speaker, message["text"], f"{place}, message {number}", message.get("pose")))
    for label, question in labelled_questions(data):
        lines += question_lines(label, question, character)
    lines += heading_lines(lesson.get("ui", {}))
    lines.append(make_line(character, lesson["outro"]["speech"], "Lesson complete screen", lesson["outro"].get("pose")))
    return unique_lines(lines)


def unique_lines(lines):
    seen = set()
    result = []
    for line in lines:
        if line["id"] in seen:
            continue
        seen.add(line["id"])
        result.append(line)
    return result
