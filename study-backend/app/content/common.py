"""Bilingual helpers. Every user-facing string is L(english, hindi)."""
from typing import Any


def L(en: str, hi: str) -> dict:
    return {"en": en, "hi": hi}


def is_loc(x: Any) -> bool:
    return isinstance(x, dict) and set(x.keys()) == {"en", "hi"}


def resolve(x: Any, lang: str) -> Any:
    """Recursively replace every L(...) by its text in `lang`."""
    if is_loc(x):
        return x[lang]
    if isinstance(x, dict):
        return {k: resolve(v, lang) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [resolve(v, lang) for v in x]
    return x


def fmt(x: dict, lang: str, **params: Any) -> str:
    return x[lang].format(**params)


def inr(n: int) -> str:
    return f"₹{n:,}"
