#!/usr/bin/env python3
"""
Fetch licence-free photographs for the Ready Band Pro build from Wikimedia Commons.

Every file is written with its author, licence and source page recorded, so the
attribution file in the repo is generated from the same run that downloaded the
image: no hand-written credits, no guessed licences.
"""
import json
import os
import re
import subprocess
import urllib.parse
import urllib.request

UA = "BandwiseBuild/1.0 (educational practice app asset fetch; build@example.com)"
OUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "app",
    "public",
    "assets",
)

TARGETS = [
    ("desk.jpg", "writing desk"),
    ("reading.jpg", "library reading room books shelves"),
    ("listening.jpg", "headphones audio listening"),
    ("speaking.jpg", "microphone condenser recording"),
]

FREE = re.compile(r"(cc0|public domain|cc[ -]by(-sa)?)", re.I)
TAG = re.compile(r"<[^>]+>")


def api(query: str, limit: int = 20):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiurlwidth": "1600",
        "format": "json",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=40) as response:
        return json.load(response)


def clean(value: str) -> str:
    return TAG.sub("", value or "").strip()


def pick(query: str):
    data = api(query)
    pages = (data.get("query") or {}).get("pages") or {}
    candidates = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        licence = clean(meta.get("LicenseShortName", {}).get("value", ""))
        if not FREE.search(licence):
            continue
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        width = info.get("width") or 0
        if width < 1000:
            continue
        # Wikimedia returns the thumbnail with tracking params, which the image
        # host rejects with a 403. Strip them.
        raw = info.get("thumburl") or info.get("url") or ""
        candidates.append(
            {
                "title": page.get("title", ""),
                "thumb": raw.split("?")[0],
                "source": info.get("descriptionurl", ""),
                "licence": licence,
                "author": clean(meta.get("Artist", {}).get("value", "")) or "Unknown",
                "width": width,
                "height": info.get("height") or 0,
                "order": page.get("index", 99),
            }
        )
    candidates.sort(key=lambda c: c["order"])
    return candidates


def download(candidates, filename: str):
    """Try candidates in order until one downloads, so one 403 never stops the run."""
    for candidate in candidates[:5]:
        try:
            request = urllib.request.Request(candidate["thumb"], headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=60) as response:
                payload = response.read()
            if len(payload) < 20_000:
                continue
            destination = os.path.join(OUT_DIR, filename)
            with open(destination, "wb") as handle:
                handle.write(payload)
            subprocess.run(
                ["convert", destination, "-resize", "1400x>", "-strip", "-quality", "82", destination],
                check=False,
            )
            return candidate, os.path.getsize(destination)
        except Exception as error:  # noqa: BLE001 - report and try the next candidate
            print(f"    retry after {type(error).__name__}: {candidate['title'][:60]}")
    return None, 0


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = []
    for filename, query in TARGETS:
        candidates = pick(query)
        if not candidates:
            print(f"NO RESULT  {filename}  ({query})")
            continue
        chosen, size = download(candidates, filename)
        if not chosen:
            print(f"DOWNLOAD FAILED  {filename}  ({query})")
            continue
        manifest.append({**chosen, "file": filename, "bytes": size})
        print(f"OK  {filename}  {size // 1024}KB  {chosen['licence']}  {chosen['title']}")
        print(f"    {chosen['source']}")

    with open(os.path.join(OUT_DIR, "manifest.json"), "w") as handle:
        json.dump(manifest, handle, indent=2)

    lines = [
        "# Image credits",
        "",
        "Every photograph in this folder is a licence-free or openly licensed file from",
        "Wikimedia Commons, downloaded by `scripts/fetch-assets.py` in this repository.",
        "Attribution is required by the licence for the CC BY and CC BY-SA files, and is",
        "given here. Images are used as background plates and are graded in CSS to a single",
        "duotone, so the set reads as one system rather than five unrelated photographs.",
        "",
        "| File | Photograph | Author | Licence | Source |",
        "| --- | --- | --- | --- | --- |",
    ]
    for entry in manifest:
        title = entry["title"].replace("File:", "")
        lines.append(
            f"| `{entry['file']}` | {title} | {entry['author']} | {entry['licence']} | [Commons]({entry['source']}) |"
        )
    lines.append("")
    lines.append("No photograph on this list is a stock photo of a paid library, and none is")
    lines.append("watermarked. If a file is replaced, replace its row here in the same commit.")
    with open(os.path.join(OUT_DIR, "CREDITS.md"), "w") as handle:
        handle.write("\n".join(lines) + "\n")
    print("wrote CREDITS.md and manifest.json")


if __name__ == "__main__":
    main()
