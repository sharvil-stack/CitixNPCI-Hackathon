"""Loads dataset/dataset.csv (re-reads automatically when the file changes) and matches a user profile against it."""
import csv, io, re
from pathlib import Path

CSV = Path(__file__).resolve().parent.parent / "dataset" / "dataset.csv"
_c = {"m": None, "rows": []}

HINTS = {
    "bpl": "Needed: BPL / poor-household card (ask your ration office)",
    "disability": "Needed: disability certificate from a government hospital",
    "widow": "Needed: proof of widow status (spouse's death certificate)",
    "owns_land": "Needed: land records in your name (7/12 extract)",
    "minority": "Needed: minority community certificate",
}
NEED_LABEL = {"bpl": "BPL / poor household", "disability": "Person with disability", "widow": "Widow",
              "owns_land": "Owns agricultural land", "minority": "Minority community"}
LAB = {"gender": "Gender", "area": "Area", "occupation": "Occupation", "caste": "Category"}


def lst(s, sep=";"):
    return [x.strip() for x in (s or "").split(sep) if x.strip()]


def rng(v):
    m = re.fullmatch(r"\s*(\d*)\s*-\s*(\d*)\s*", v)
    if not m:
        return None, None
    return (int(m[1]) if m[1] else None), (int(m[2]) if m[2] else None)


def parse_rules(s):
    out = {}
    for part in lst(s):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip().lower()] = v.strip().lower()
    return out


def build(r):
    name = (r.get("name") or "").strip()
    cash = re.sub(r"[^\d.]", "", r.get("cash_per_year") or "")
    return {
        "id": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
        "name": name,
        "level": (r.get("level") or "").strip(),
        "category": (r.get("category") or "").strip(),
        "benefit": (r.get("benefit") or "").strip(),
        "cash": float(cash) if cash else None,
        "rules": parse_rules(r.get("rules")),
        "other_conditions": lst(r.get("other_conditions")),
        "documents": lst(r.get("documents")),
        "steps": lst(r.get("apply_steps")),
        "url": (r.get("url") or "").strip(),
    }


def load():
    m = CSV.stat().st_mtime
    if _c["m"] != m:
        try:
            text = CSV.read_text(encoding="utf-8-sig")
        except UnicodeDecodeError:
            text = CSV.read_text(encoding="cp1252")
        rows = [build(r) for r in csv.DictReader(io.StringIO(text)) if (r.get("name") or "").strip()]
        _c.update(m=m, rows=rows)
    return _c["rows"]


def check(rules, p):
    out = []

    def add(status, text, hint=None):
        out.append({"status": status, "text": text, "hint": hint})

    for k, v in rules.items():
        if k == "age":
            lo, hi = rng(v)
            t = "Age " + (f"{lo}–{hi}" if lo and hi else f"{lo} and above" if lo else f"up to {hi}")
            a = p.get("age")
            if a is None:
                add("unknown", t)
                continue
            gap = (lo - a) if lo is not None and a < lo else (a - hi) if hi is not None and a > hi else 0
            if gap > 0:
                add("fail", t, "You are just outside the age limit" if gap <= 3 else None)
            else:
                add("pass", t)
        elif k in LAB:
            opts = [x.strip() for x in v.split("|")]
            u = p.get(k)
            t = f"{LAB[k]}: " + " / ".join(o.replace("_", " ") for o in opts)
            add("unknown" if not u else "pass" if u in opts else "fail", t)
        elif k == "income_max_annual":
            try:
                lim = float(re.sub(r"[^\d.]", "", v))
            except ValueError:
                continue
            t = f"Household income up to ₹{int(lim):,} per year"
            lo, hi = p.get("income_low"), p.get("income_high")
            if lo is None and hi is None:
                add("unknown", t)
            elif hi is not None and hi * 12 <= lim:
                add("pass", t)
            elif lo is not None and lo * 12 > lim:
                add("fail", t, "Your income is slightly above the limit" if lo * 12 <= lim * 1.25 else None)
            else:
                add("unknown", t)
        elif k == "needs":
            have = p.get("needs") or {}
            for n in v.split("|"):
                n = n.strip()
                a = have.get(n)
                add("unknown" if a not in ("yes", "no") else "pass" if a == "yes" else "fail",
                    NEED_LABEL.get(n, n), HINTS.get(n))
    return out


def classify(res):
    f = [x for x in res if x["status"] == "fail"]
    u = [x for x in res if x["status"] == "unknown"]
    if not f:
        return "eligible" if not u else "need_info"
    if len(f) <= 2 and all(x["hint"] for x in f):
        return "almost"
    return None


def run(p):
    out = {"eligible": [], "almost": [], "need_info": []}
    state = (p.get("state") or "Maharashtra").lower()
    for s in load():
        if s["level"].lower() not in ("central", state):
            continue
        res = check(s["rules"], p)
        st = classify(res)
        if not st:
            continue
        out[st].append({**s, "status": st,
                        "passed": [x["text"] for x in res if x["status"] == "pass"],
                        "failed": [{"text": x["text"], "hint": x["hint"]} for x in res if x["status"] == "fail"],
                        "unknown": [x["text"] for x in res if x["status"] == "unknown"]})
    for k in ("eligible", "almost", "need_info"):
        out[k].sort(key=lambda s: -(s["cash"] or 0))
    out["cash_total"] = sum(s["cash"] or 0 for s in out["eligible"])
    return out
