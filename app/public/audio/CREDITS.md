# Recording credits

Every file in this folder is synthetic speech generated from the scripts stored in
`app/src/content/listening`, by `scripts/generate-listening-audio.py`. No Cambridge,
IELTS or British Council recording is used, and no human recording is copied.

| Used for | Voice | Source | Licence |
| --- | --- | --- | --- |
| Australian English speakers | en_AU-librivox-medium (ten narrators) | [DataCraftsmanAustralia/piper-en_AU-librivox-medium](https://huggingface.co/DataCraftsmanAustralia/piper-en_AU-librivox-medium) | CC BY 4.0, trained on public domain LibriVox recordings |
| American English speakers | en_US-ryan-medium, en_US-amy-medium | [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) | as published in that collection |

Regenerate with: `VOICES_DIR=/path/to/voices ./scripts/generate-listening-audio.py`
