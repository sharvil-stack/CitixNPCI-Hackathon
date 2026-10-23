"""Builds API payloads from engines + bilingual content. No business rules live here."""
from __future__ import annotations

from .content import budget as BT
from .content import report_text as RT
from .content.common import fmt, inr, resolve
from .content.quiz import QUIZ
from .content.scenarios import SCENARIOS
from .content.topics import ACTIVE_IDS, TOPICS, TOPIC_BY_ID
from .content.videos import VIDEOS
from .engine import budget as BE
from .engine import scenario as SE
from .engine.errors import SimError
from .engine.quiz import score_quiz


class NotFound(Exception):
    pass


# ---------- topics / lessons / quiz ----------------------------------------------------
def list_topics(lang: str) -> list[dict]:
    out = []
    for t in TOPICS:
        item = {"id": t["id"], "active": t["active"], "icon": t["icon"], "image": t["image"],
                "title": t["title"][lang], "desc": t["desc"][lang],
                "lesson_ids": [v["id"] for v in VIDEOS.get(t["id"], [])]}
        out.append(item)
    return out


def topic_detail(topic_id: str, lang: str) -> dict:
    if topic_id not in ACTIVE_IDS:
        raise NotFound(topic_id)
    t = TOPIC_BY_ID[topic_id]
    lessons = []
    for i, v in enumerate(VIDEOS[topic_id], start=1):
        lessons.append({"id": v["id"], "index": i, "title": v["title"][lang], "desc": v["desc"][lang],
                        "points": [p[lang] for p in v["points"]], "spoken": v["spoken"],
                        "youtube_id": v["youtube_id"], "placeholder": v["youtube_id"] is None,
                        "search_query": v["search_query"]})
    return {"topic": {"id": t["id"], "icon": t["icon"], "image": t["image"], "title": t["title"][lang],
                      "desc": t["desc"][lang], "intro": t["intro"][lang]},
            "lessons": lessons}


def quiz_for(topic_id: str, lang: str) -> list[dict]:
    if topic_id not in QUIZ:
        raise NotFound(topic_id)
    return [{"id": q["id"], "question": q["question"][lang], "options": [o[lang] for o in q["options"]],
             "answer": q["answer"], "explanation": q["explanation"][lang]} for q in QUIZ[topic_id]]


def quiz_score(topic_id: str, lang: str, answers: list) -> dict:
    if topic_id not in QUIZ:
        raise NotFound(topic_id)
    res = score_quiz(QUIZ[topic_id], answers)
    by_id = {q["id"]: q for q in QUIZ[topic_id]}
    for r in res["results"]:
        r["explanation"] = by_id[r["id"]]["explanation"][lang]
    return res


# ---------- errors -------------------------------------------------------------------------
def error_message(e: SimError, lang: str) -> str:
    p = dict(e.params)
    if "category" in p:
        p["category"] = BT.CATEGORIES[p["category"]]["label"][lang]
    for k in ("minimum", "total", "income"):
        if k in p:
            p[k] = inr(p[k])
    return fmt(RT.ERRORS[e.code], lang, **p)


# ---------- simulation ---------------------------------------------------------------------
def play(topic_id: str, lang: str, decisions: list) -> dict:
    if topic_id == "saving":
        return _play_budget(lang, decisions)
    if topic_id in SCENARIOS:
        return _play_scenario(topic_id, lang, decisions)
    raise NotFound(topic_id)


def _reasons(opt: dict, lang: str) -> str | None:
    if opt["enabled"] or not opt["reason"]:
        return None
    code, params = opt["reason"]
    return fmt(RT.REASONS[code], lang, **{k: inr(v) for k, v in params.items()})


def _words(items, table, lang):
    return [fmt(table[code], lang, **{k: (inr(v) if isinstance(v, int) and k not in ("pct", "n", "total") else v)
                                      for k, v in params.items()}) for code, params in items]


def _play_budget(lang: str, decisions: list) -> dict:
    state, nxt, history = BE.replay(decisions)
    base = {"topic": "saving", "total_rounds": 3, "steps": [s[lang] for s in BT.STEPS]}
    if nxt == 1:
        cats = [{"id": c, "label": BT.CATEGORIES[c]["label"][lang], "hint": BT.CATEGORIES[c]["hint"][lang],
                 "kind": BT.CATEGORIES[c]["kind"], "color": BT.CATEGORIES[c]["color"],
                 "min": BE.MINIMUMS[c], "default": BE.DEFAULT_ALLOCATION[c]} for c in BE.CATEGORIES]
        return {**base, "round": 1, "kind": "allocate", "title": BT.ROUND1["title"][lang],
                "description": fmt(BT.ROUND1["description"], lang, income=inr(BE.INCOME)),
                "image": None, "event": None, "history": [],
                "allocation": {"income": BE.INCOME, "categories": cats, "note": BT.ROUND1["note"][lang]}}
    if nxt in (2, 3):
        spec, opts = (BT.ROUND2, BE.round2_options(state)) if nxt == 2 else (BT.ROUND3, BE.round3_options(state))
        amount = BE.MEDICAL_EXPENSE if nxt == 2 else BE.BILL_AMOUNT
        notes = []
        if nxt == 3:
            if state.cash < BE.BILL_AMOUNT:
                notes.append(fmt(spec["notes"]["low_cash"], lang, cash=inr(state.cash)))
            if state.debt > 0:
                notes.append(fmt(spec["notes"]["has_debt"], lang, repay=inr(state.repayments)))
        choices = [{"id": o["id"], "label": spec["choices"][o["id"]]["label"][lang],
                    "description": spec["choices"][o["id"]]["description"][lang],
                    "enabled": o["enabled"], "reason": _reasons(o, lang)} for o in opts]
        return {**base, "round": nxt, "kind": "choice", "title": spec["title"][lang],
                "description": fmt(spec["description"], lang, amount=inr(amount)),
                "notes": notes, "image": spec["image"],
                "event": {"label": spec["event"][lang], "amount": amount},
                "choices": choices,
                "status": [{"label": BT.STATUS[k][lang], "value": v}
                           for k, v in (("cash", state.cash), ("savings", state.savings), ("debt", state.debt))],
                "history": _budget_history(history, lang)}
    return {**base, "round": 4, "kind": "done", "report": _budget_report(state, history, lang)}


def _budget_history(history: list, lang: str) -> list:
    out = []
    for h in history:
        if h["round"] == 1:
            continue
        spec = BT.ROUND2 if h["round"] == 2 else BT.ROUND3
        params = dict(h["params"])
        if h["round"] == 2:
            params.setdefault("amount", BE.MEDICAL_EXPENSE)
        params = {k: inr(v) for k, v in params.items()}
        out.append({"round": h["round"], "title": spec["title"][lang],
                    "choice": spec["choices"][h["choice"]]["label"][lang],
                    "outcome": fmt(BT.OUTCOMES[h["round"]][h["choice"]], lang, **params)})
    return out


def _budget_report(s: BE.State, history: list, lang: str) -> dict:
    ev = BE.evaluate(s, history)
    band = RT.BUDGET_BANDS[ev["band"]]
    values = {"cash": s.cash, "savings": s.savings, "debt": s.debt, "unpaid": s.unpaid, "due": s.repayments}
    alloc_line = fmt(BT.ALLOCATION_OUTCOME, lang, **{k: inr(v) for k, v in s.allocations.items()})
    hist = [{"round": 1, "title": BT.ROUND1["title"][lang],
             "choice": "", "outcome": alloc_line}] + _budget_history(history, lang)
    code, params = ev["tip"]
    return {"score": ev["score"], "band": ev["band"], "headline": band["headline"][lang],
            "summary": band["summary"][lang],
            "snapshot": [{"id": r["id"], "label": r["label"][lang], "value": values[r["id"]], "format": "money"}
                         for r in RT.BUDGET_SNAPSHOT],
            "history": hist,
            "went_well": _words(ev["went_well"], RT.BUDGET_WELL, lang),
            "improve": _words(ev["improve"], RT.BUDGET_IMPROVE, lang),
            "tip": _words([(code, params)], RT.BUDGET_TIPS, lang)[0]}


def _play_scenario(topic_id: str, lang: str, decisions: list) -> dict:
    spec = SCENARIOS[topic_id]
    state, nxt, history = SE.replay(spec, decisions)
    base = {"topic": topic_id, "total_rounds": SE.ROUNDS, "steps": [s[lang] for s in spec["steps"]]}
    if nxt <= SE.ROUNDS:
        r = spec["rounds"][nxt - 1]
        ev = r["event"]
        return {**base, "round": nxt, "kind": "choice", "title": r["title"][lang],
                "description": r["description"][lang], "notes": [], "image": spec["image"],
                "event": {"label": ev["label"][lang], "amount": ev["amount"]},
                "choices": [{"id": c["id"], "label": c["label"][lang], "description": c["description"][lang],
                             "enabled": True, "reason": None} for c in r["choices"]],
                "status": [{"label": spec["snapshot"][0]["label"][lang], "value": state["balance"]}],
                "history": _scenario_history(spec, history, lang)}
    return {**base, "round": SE.ROUNDS + 1, "kind": "done", "report": _scenario_report(spec, state, history, lang)}


def _scenario_history(spec: dict, history: list, lang: str) -> list:
    out = []
    for h in history:
        r = spec["rounds"][h["round"] - 1]
        c = next(c for c in r["choices"] if c["id"] == h["choice"])
        out.append({"round": h["round"], "title": r["title"][lang], "choice": c["label"][lang],
                    "outcome": c["outcome"][lang]})
    return out


def _scenario_report(spec: dict, s: dict, history: list, lang: str) -> dict:
    ev = SE.evaluate(spec, s, history)
    band = spec["bands"][ev["band"]]
    rows = []
    for r in spec["snapshot"]:
        v = s[r["id"]]
        if r["format"] == "fraction":
            v = f"{v}/{SE.ROUNDS}"
        rows.append({"id": r["id"], "label": r["label"][lang], "value": v, "format": r["format"]})
    tip = (ev["tip"] or spec["all_good_tip"])[lang]
    return {"score": ev["score"], "band": ev["band"], "headline": band["headline"][lang],
            "summary": band["summary"][lang], "snapshot": rows,
            "history": _scenario_history(spec, history, lang),
            "went_well": _words(ev["went_well"], RT.SC_WELL, lang),
            "improve": _words(ev["improve"], RT.SC_IMPROVE, lang), "tip": tip}
