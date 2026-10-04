#!/usr/bin/env python3
"""Record the lesson's voice lines in your browser.

Run from the project folder on a Mac:  python3 tools/record_voices.py

It opens a recording page at http://localhost:8800/tools/recorder/. Each take
is trimmed, leveled, converted to .m4a, and saved straight into assets/voice/,
and assets/voice/manifest.json is rewritten so the lesson plays it right away.
Needs ffmpeg (brew install ffmpeg).
"""

import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voice_lines import MANIFEST, ROOT, VOICE_DIR, load_lesson, spoken_lines  # noqa: E402

PORT = 8800
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
CLEANUP_FILTER = (
    "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.08,"
    "areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.15,areverse,"
    "loudnorm=I=-16:TP=-1.5:LRA=11"
)
UPLOAD_EXTENSIONS = {"audio/mp4": ".mp4", "audio/webm": ".webm", "audio/ogg": ".ogg", "audio/wav": ".wav"}


def recordings_for(line_id):
    return sorted(VOICE_DIR.glob(f"{line_id}-*.m4a"))


def clip_seconds(path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    )
    return round(float(result.stdout.strip()), 3)


def current_lines():
    lines = spoken_lines(load_lesson())
    for line in lines:
        existing = recordings_for(line["id"])
        line["file"] = f"assets/voice/{existing[-1].name}" if existing else None
    return lines


def write_manifest():
    manifest = {}
    for line in current_lines():
        if line["file"]:
            manifest[line["text"]] = {"file": line["file"], "seconds": clip_seconds(ROOT / line["file"])}
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def save_recording(line_id, audio, content_type):
    extension = UPLOAD_EXTENSIONS.get(content_type.split(";")[0].strip(), ".webm")
    with tempfile.TemporaryDirectory() as scratch:
        source = Path(scratch) / f"take{extension}"
        cleaned = Path(scratch) / "take.m4a"
        source.write_bytes(audio)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(source), "-af", CLEANUP_FILTER,
             "-ar", "44100", "-ac", "1", "-c:a", "aac", "-b:a", "96k", str(cleaned)],
            check=True,
        )
        content_hash = hashlib.sha1(cleaned.read_bytes()).hexdigest()[:8]
        for old in recordings_for(line_id):
            old.unlink()
        target = VOICE_DIR / f"{line_id}-{content_hash}.m4a"
        shutil.move(cleaned, target)
    write_manifest()
    return {"file": f"assets/voice/{target.name}", "seconds": clip_seconds(target)}


def delete_recording(line_id):
    for old in recordings_for(line_id):
        old.unlink()
    write_manifest()


class RecorderHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/tools/recorder":
            self.send_response(302)
            self.send_header("Location", "/tools/recorder/")
            self.end_headers()
            return
        if self.path == "/api/lines":
            self.send_json(current_lines())
            return
        super().do_GET()

    def do_POST(self):
        line_id = self.recording_id()
        if not line_id:
            return
        length = int(self.headers.get("Content-Length", 0))
        if not 0 < length <= MAX_UPLOAD_BYTES:
            self.send_json({"error": "That recording is empty or too large."}, status=400)
            return
        try:
            saved = save_recording(line_id, self.rfile.read(length), self.headers.get("Content-Type", ""))
        except subprocess.CalledProcessError:
            self.send_json({"error": "ffmpeg couldn't read that recording. Try again."}, status=500)
            return
        self.send_json(saved)

    def do_DELETE(self):
        line_id = self.recording_id()
        if line_id:
            delete_recording(line_id)
            self.send_json({"deleted": line_id})

    def recording_id(self):
        prefix = "/api/recordings/"
        line_id = self.path[len(prefix):] if self.path.startswith(prefix) else ""
        known = {line["id"] for line in spoken_lines(load_lesson())}
        if line_id in known:
            return line_id
        self.send_json({"error": "Unknown line."}, status=404)
        return None

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        if self.command != "GET":
            super().log_message(format, *args)


def main():
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is missing. Install it with: brew install ffmpeg")
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    write_manifest()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), partial(RecorderHandler, directory=str(ROOT)))
    url = f"http://localhost:{PORT}/tools/recorder/"
    print(f"Recording page: {url}\nThe lesson with your recordings: http://localhost:{PORT}/\nPress Ctrl+C to stop.")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped. Your recordings are in assets/voice/.")


if __name__ == "__main__":
    main()
