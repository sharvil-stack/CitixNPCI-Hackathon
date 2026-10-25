"""Groq (speech-to-text, extraction, explanations) + gTTS (voice output). The LLM never decides eligibility."""
import datetime, hashlib, json, os, re
from pathlib import Path

AUDIO_DIR = Path(__file__).resolve().parent / "audio_cache"
OCC = ["farmer", "farm_labourer", "fisherman", "artisan", "street_vendor", "construction_worker",
       "daily_wage_worker", "self_employed", "student", "homemaker", "salaried", "unemployed"]
NEEDS = ["disability", "bpl", "widow", "owns_land", "minority"]
_client = None


def _env(name, default):
    return os.getenv(name) or default


def client():
    global _client
    if _client is None:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise RuntimeError("GROQ_API_KEY is missing in backend/.env")
        from groq import Groq
        _client = Groq(api_key=key)
    return _client


def chat(system, user, json_mode=False):
    kw = {"response_format": {"type": "json_object"}} if json_mode else {}
    r = client().chat.completions.create(
        model=_env("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile"), temperature=0,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}], **kw)
    return r.choices[0].message.content.strip()


def transcribe(data, filename="speech.webm"):
    r = client().audio.transcriptions.create(
        file=(filename, data), model=_env("GROQ_STT_MODEL", "whisper-large-v3-turbo"), temperature=0)
    return r.text


def mask(text):
    """Strip ID numbers and phone numbers before any text leaves this machine."""
    text = re.sub(r"\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b", "[ID]", text)
    text = re.sub(r"\b\d{4}\s?\d{4}\s?\d{4}\b", "[ID]", text)
    return re.sub(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)", "[PHONE]", text)


EXTRACT_SYS = f"""You extract a person's details for an Indian government-scheme eligibility form.
Return ONLY a JSON object with these keys:
age (integer or null), birth_year (integer or null), gender ("female" | "male" | null), state (string or null),
area ("rural" | "urban" | null), monthly_income (number, rupees per month, or null),
occupation (one of {OCC} or null), caste ("general" | "obc" | "sc" | "st" | null),
needs (object with keys {NEEDS}; each "yes" | "no" | null).
Rules: use null for anything not clearly stated and never guess. The text may be Hindi, Marathi, English or mixed
(speech transcript or OCR of an ID document). "hazaar"=1000, "lakh"=100000. Daily wage: multiply by 26 for a month.
Yearly income: divide by 12. kisan/shetkari=farmer, mazdoor/majdoor=daily_wage_worker, dukandar/business=self_employed,
thela/pherivala=street_vendor. For ID documents, take birth_year from date of birth or year of birth; ignore ID numbers."""


def _pick(v, ok):
    v = str(v).strip().lower() if v else None
    return v if v in ok else None


def clean(d):
    year = datetime.date.today().year
    try:
        age = int(d.get("age")) if d.get("age") is not None else None
    except (TypeError, ValueError):
        age = None
    try:
        by = int(d.get("birth_year")) if d.get("birth_year") is not None else None
    except (TypeError, ValueError):
        by = None
    if age is None and by and 1900 < by <= year:
        age = year - by
    if age is not None and not 0 <= age <= 120:
        age = None
    try:
        inc = float(d.get("monthly_income")) if d.get("monthly_income") is not None else None
    except (TypeError, ValueError):
        inc = None
    st = str(d.get("state") or "").lower()
    needs = {k: _pick((d.get("needs") or {}).get(k), {"yes", "no"}) for k in NEEDS}
    out = {"age": age, "gender": _pick(d.get("gender"), {"female", "male"}),
           "state": "Maharashtra" if "maharashtra" in st else ("Other" if st else None),
           "area": _pick(d.get("area"), {"rural", "urban"}), "monthly_income": inc,
           "occupation": _pick(d.get("occupation"), set(OCC)), "caste": _pick(d.get("caste"), {"general", "obc", "sc", "st"}),
           "needs": {k: v for k, v in needs.items() if v}}
    return {k: v for k, v in out.items() if v not in (None, {})}


def extract_profile(text):
    return clean(json.loads(chat(EXTRACT_SYS, text[:4000], json_mode=True)))


LANG = {"en": "simple English", "hi": "simple Hindi in Devanagari script"}
_cache = {}


def explain(s, lang):
    facts = {k: s.get(k) for k in ("name", "benefit", "status", "passed", "failed", "unknown",
                                   "other_conditions", "documents", "steps")}
    key = hashlib.sha1((lang + json.dumps(facts, sort_keys=True, ensure_ascii=False)).encode()).hexdigest()
    if key not in _cache:
        sys = (f"You help low-income Indian citizens understand a government scheme. Write in {LANG[lang]}, "
               "4 to 6 short spoken sentences, no markdown, no lists, no emojis. Use ONLY the facts provided; never add "
               "amounts, dates or conditions. Say what they get; then, depending on status, why they qualify, what is missing, "
               "or what we still need to know; then the main documents; then one or two steps to apply. "
               "Keep scheme and document names in their original language if translating would confuse.")
        _cache[key] = chat(sys, json.dumps(facts, ensure_ascii=False))
    return _cache[key]


def tts(text, lang):
    AUDIO_DIR.mkdir(exist_ok=True)
    h = hashlib.sha1(f"{lang}:{text}".encode()).hexdigest()[:20]
    p = AUDIO_DIR / f"{h}.mp3"
    if not p.exists():
        from gtts import gTTS
        gTTS(text=text, lang=lang).save(str(p))
    return h
