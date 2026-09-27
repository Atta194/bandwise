#!/usr/bin/env python3
"""
Turn the stored listening scripts into real recordings.

Reads the pool of parts from app/src/content/listening/*.ts, speaks each turn
with an offline neural voice, assembles the turns into one file per part with
short silences between speakers, and writes app/public/audio/<unit>.mp3, which
is exactly where the player looks before falling back to the browser's voice.

Voices:
  en-AU speakers  -> en_AU-librivox-medium, a ten voice Australian model trained
                     on public domain LibriVox recordings (CC BY 4.0).
  en-US speakers  -> en_US-ryan-medium / en_US-amy-medium from the piper
                     collection.
Voices alternate between the speakers of a conversation, so the two people are
always audibly different, and the Australian speakers are drawn from different
narrators so a part with three of them still sounds like three people.

Requirements: piper (pip install piper-tts) and ffmpeg.
    VOICES_DIR=/path/to/voices ./scripts/generate-listening-audio.py
"""
import json
import os
import re
import subprocess
import sys
import tempfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(REPO, "app", "src", "content", "listening")
OUT_DIR = os.path.join(REPO, "app", "public", "audio")
VOICES_DIR = os.environ.get("VOICES_DIR", "/home/user/voices")
PIPER = os.environ.get("PIPER_BIN", os.path.expanduser("~/.local/bin/piper"))

AU_MODEL = "en_AU-librivox-medium"
# Speaker ids inside the Australian model, alternating male and female narrators.
AU_SPEAKERS = [0, 1, 4, 3, 5, 8]

VOICES = {
    "en-AU": [(AU_MODEL, speaker) for speaker in AU_SPEAKERS],
    "en-US": [("en_US-ryan-medium", None), ("en_US-amy-medium", None)],
}
FALLBACK = [("en_US-ryan-medium", None), ("en_US-amy-medium", None)]

TURN = re.compile(
    r'\{\s*speaker:\s*"([^"]+)",\s*accent:\s*"([^"]+)",\s*line:\s*"((?:[^"\\]|\\.)*)"\s*\}'
)
UNIT_ID = re.compile(r'id:\s*"(L[0-9]+-[A-Z])"')
ROLE = re.compile(r'role:\s*"((?:[^"\\]|\\.)*)"')

GAP_MS = 420          # between two turns
INTRO_GAP_MS = 1100   # after the part announcement
TAIL_MS = 1400        # at the end of the part

CREDITS = """# Recording credits

Every file in this folder is synthetic speech generated from the scripts stored in
`app/src/content/listening`, by `scripts/generate-listening-audio.py`. No Cambridge,
IELTS or British Council recording is used, and no human recording is copied.

| Used for | Voice | Source | Licence |
| --- | --- | --- | --- |
| Australian English speakers | en_AU-librivox-medium (ten narrators) | [DataCraftsmanAustralia/piper-en_AU-librivox-medium](https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium) | CC BY 4.0, trained on public domain LibriVox recordings |
| American English speakers | en_US-ryan-medium, en_US-amy-medium | [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) | as published in that collection |

Regenerate with: `VOICES_DIR=/path/to/voices ./scripts/generate-listening-audio.py`
"""


def unescape(text: str) -> str:
    return text.replace('\\"', '"').replace("\\'", "'").replace("\\\\", "\\")


def read_pool():
    """Returns [(unit_id, role, [(speaker, accent, line), ...]), ...] in file order."""
    units = []
    for name in sorted(os.listdir(CONTENT)):
        if not name.endswith(".ts"):
            continue
        raw = open(os.path.join(CONTENT, name), encoding="utf-8").read()
        marks = [(m.start(), m.group(1)) for m in UNIT_ID.finditer(raw)]
        for index, (start, unit_id) in enumerate(marks):
            end = marks[index + 1][0] if index + 1 < len(marks) else len(raw)
            block = raw[start:end]
            role_match = ROLE.search(block)
            role = unescape(role_match.group(1)) if role_match else f"Part {unit_id[1]}"
            turns = [
                (unescape(m.group(1)), m.group(2), unescape(m.group(3)))
                for m in TURN.finditer(block)
            ]
            if turns:
                units.append((unit_id, role, turns))
    return units


def voice_plan(turns, part_offset: int):
    """
    One (model, speaker) per speaker, alternating within the accent group, and
    rotated by the part so the eight parts do not all sound like one narrator.
    """
    assigned = {}
    counters = {}
    for speaker, accent, _line in turns:
        if speaker in assigned:
            continue
        options = VOICES.get(accent, FALLBACK)
        seen = counters.get(accent, 0)
        # The Australian list is long on purpose: rotating it keeps a different
        # narrator on each part while staying inside the accent.
        index = (seen + part_offset) % len(options) if accent == "en-AU" else seen % len(options)
        assigned[speaker] = options[index]
        counters[accent] = seen + 1
    return assigned


def speak(text: str, voice, out_wav: str) -> None:
    model, speaker = voice
    path = os.path.join(VOICES_DIR, f"{model}.onnx")
    if not os.path.exists(path):
        raise SystemExit(f"missing voice model: {path}")
    command = [PIPER, "-m", path]
    if speaker is not None:
        command += ["--speaker", str(speaker)]
    command += ["-f", out_wav]
    result = subprocess.run(
        command,
        input=text.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=180,
    )
    if result.returncode != 0 or not os.path.exists(out_wav):
        raise SystemExit(f"piper failed for {model} speaker {speaker}: {result.stderr[-400:]!r}")


def silence(ms: int, out_wav: str) -> None:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
         "-t", f"{ms / 1000:.2f}", "-y", out_wav],
        check=True,
    )


def build_unit(unit_id: str, role: str, turns, workdir: str, part_offset: int) -> dict:
    plan = voice_plan(turns, part_offset)
    pieces = []

    # The announcement the real paper opens with, then a pause.
    intro = os.path.join(workdir, "intro.wav")
    speak(role, plan.get(turns[0][0], FALLBACK[0]), intro)
    pieces.append(intro)
    gap = os.path.join(workdir, "gap.wav")
    silence(INTRO_GAP_MS, gap)
    pieces.append(gap)

    for index, (speaker, _accent, line) in enumerate(turns):
        clip = os.path.join(workdir, f"turn-{index:03d}.wav")
        speak(line, plan[speaker], clip)
        pieces.append(clip)
        if index != len(turns) - 1:
            small = os.path.join(workdir, f"gap-{index:03d}.wav")
            silence(GAP_MS, small)
            pieces.append(small)

    tail = os.path.join(workdir, "tail.wav")
    silence(TAIL_MS, tail)
    pieces.append(tail)

    listing = os.path.join(workdir, "concat.txt")
    with open(listing, "w", encoding="utf-8") as handle:
        for piece in pieces:
            handle.write(f"file '{piece}'\n")

    os.makedirs(OUT_DIR, exist_ok=True)
    out_mp3 = os.path.join(OUT_DIR, f"{unit_id}.mp3")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "concat", "-safe", "0", "-i", listing,
         "-ac", "1", "-ar", "22050", "-b:a", "64k", "-y", out_mp3],
        check=True,
    )

    duration = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
         "default=nw=1:nk=1", out_mp3],
        capture_output=True, text=True, check=True,
    ).stdout.strip()

    return {
        "unit": unit_id,
        "turns": len(turns),
        "speakers": {name: f"{model}#{speaker}" for name, (model, speaker) in plan.items()},
        "file": os.path.relpath(out_mp3, REPO),
        "seconds": round(float(duration), 1),
        "kb": round(os.path.getsize(out_mp3) / 1024),
    }


def main():
    units = read_pool()
    if not units:
        raise SystemExit("no listening units found")
    print(f"parts to record: {len(units)}")
    report = []
    for offset, (unit_id, role, turns) in enumerate(units):
        with tempfile.TemporaryDirectory() as workdir:
            info = build_unit(unit_id, role, turns, workdir, offset)
        report.append(info)
        voices = ", ".join(sorted(set(info["speakers"].values())))
        print(f"  {info['unit']}  {info['turns']:>2} turns  {info['seconds']:>6}s  {info['kb']:>5}KB  {voices}")

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
    with open(os.path.join(OUT_DIR, "CREDITS.md"), "w", encoding="utf-8") as handle:
        handle.write(CREDITS)

    total = sum(item["seconds"] for item in report)
    size = sum(item["kb"] for item in report)
    print(f"\ntotal audio: {total / 60:.1f} minutes, {size / 1024:.1f} MB")
    print(f"written to {os.path.relpath(OUT_DIR, REPO)}, with CREDITS.md")


if __name__ == "__main__":
    sys.exit(main())
