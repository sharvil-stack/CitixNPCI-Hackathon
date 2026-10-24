"""Text-to-speech via gTTS (Hindi + English). Results are cached on disk by hash."""
from __future__ import annotations

import hashlib
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parent.parent / ".tts_cache"
MAX_CHARS = 1500
LANGS = {"en": {"lang": "en", "tld": "co.in"}, "hi": {"lang": "hi", "tld": "co.in"}}


class TTSError(Exception):
    pass


def _gtts_save(text: str, lang: str, path: Path) -> None:
    from gtts import gTTS  # imported lazily so tests and imports work offline
    gTTS(text=text, **LANGS[lang]).save(str(path))


def synthesize(text: str, lang: str) -> Path:
    if lang not in LANGS:
        raise TTSError("unsupported language")
    text = " ".join(text.split())
    if not text:
        raise TTSError("empty text")
    if len(text) > MAX_CHARS:
        cut = text[:MAX_CHARS]
        end = max(cut.rfind("."), cut.rfind("।"))
        text = cut[: end + 1] if end > 200 else cut
    CACHE_DIR.mkdir(exist_ok=True)
    path = CACHE_DIR / (hashlib.sha1(f"{lang}:{text}".encode("utf-8")).hexdigest() + ".mp3")
    if not path.exists():
        tmp = path.with_suffix(".tmp")
        try:
            _gtts_save(text, lang, tmp)
            tmp.replace(path)
        except Exception as exc:  # network down, rate limited, ...
            tmp.unlink(missing_ok=True)
            raise TTSError(str(exc)) from exc
    return path
