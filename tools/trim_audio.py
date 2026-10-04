"""Find where speech starts and ends in a take, ignoring hiss and key clicks.

The threshold comes from each take's own loudness, so a quiet room and a loud
voice both trim well. A short burst close to speech (a trailing "s" or "t")
joins it, while a short burst after a real pause (a Space-bar click, a desk
bump) doesn't count as speech.
"""

import subprocess

import numpy as np

SAMPLE_RATE = 16000
FRAME_SECONDS = 0.02
MIN_SPEECH_SECONDS = 0.08
JOIN_GAP_SECONDS = 0.35
BELOW_PEAK_DB = 35
ABOVE_FLOOR_DB = 12
LEAD_PAD_SECONDS = 0.08
TAIL_PAD_SECONDS = 0.15


def frame_loudness(path):
    pcm = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-"],
        check=True, capture_output=True,
    ).stdout
    samples = np.frombuffer(pcm, dtype=np.float32)
    frame = int(SAMPLE_RATE * FRAME_SECONDS)
    count = len(samples) // frame
    frames = samples[: count * frame].reshape(count, frame)
    return 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)


def loud_runs(loud):
    runs, start = [], None
    for index, is_loud in enumerate([*loud, False]):
        if is_loud and start is None:
            start = index
        elif not is_loud and start is not None:
            runs.append((start, index))
            start = None
    return runs


def group_runs(runs):
    max_gap = round(JOIN_GAP_SECONDS / FRAME_SECONDS)
    groups = []
    for run in runs:
        if groups and run[0] - groups[-1][-1][1] <= max_gap:
            groups[-1].append(run)
        else:
            groups.append([run])
    return groups


def speech_runs(loud):
    min_frames = round(MIN_SPEECH_SECONDS / FRAME_SECONDS)
    speech = [group for group in group_runs(loud_runs(loud)) if sum(end - start for start, end in group) >= min_frames]
    return [(group[0][0], group[-1][1]) for group in speech]


def speech_bounds(path):
    """Return (start, end) in seconds, padded, or None if no speech is found."""
    loudness = frame_loudness(path)
    if loudness.size == 0:
        return None
    threshold = max(loudness.max() - BELOW_PEAK_DB, np.percentile(loudness, 20) + ABOVE_FLOOR_DB)
    runs = speech_runs(loudness > threshold)
    if not runs:
        return None
    total = loudness.size * FRAME_SECONDS
    start = max(0.0, runs[0][0] * FRAME_SECONDS - LEAD_PAD_SECONDS)
    end = min(total, runs[-1][1] * FRAME_SECONDS + TAIL_PAD_SECONDS)
    return start, end
