"""Generic 3-round decision scenarios (UPI safety, Banking basics). Deterministic, data-driven.

A choice carries numeric `effects`:
  lose      money taken by fraud: balance -> lost (never below zero balance)
  fee       bank charge: balance -> fees
  withdraw  cash taken out: balance -> cash
  risky     +1 risky action
  good      +1 safe/best choice
"""
from __future__ import annotations

import copy

from .errors import SimError

ROUNDS = 3


def initial_state(spec: dict) -> dict:
    return {"balance": spec["start_balance"], "cash": 0, "lost": 0, "fees": 0, "risky": 0, "good": 0}


def _move(state: dict, target: str, amount: int) -> None:
    moved = min(amount, state["balance"])
    state["balance"] -= moved
    state[target] += moved


def apply_choice(spec: dict, state: dict, round_index: int, choice_id) -> tuple[dict, dict]:
    choices = {c["id"]: c for c in spec["rounds"][round_index]["choices"]}
    if choice_id not in choices:
        raise SimError("unknown_choice")
    s = copy.deepcopy(state)
    fx = choices[choice_id]["effects"]
    if "lose" in fx:
        _move(s, "lost", fx["lose"])
    if "fee" in fx:
        _move(s, "fees", fx["fee"])
    if "withdraw" in fx:
        _move(s, "cash", fx["withdraw"])
    s["risky"] += fx.get("risky", 0)
    s["good"] += fx.get("good", 0)
    return s, {}


def replay(spec: dict, decisions: list) -> tuple[dict, int, list]:
    if not isinstance(decisions, list):
        raise SimError("bad_decision")
    if len(decisions) > ROUNDS:
        raise SimError("too_many_decisions")
    state = initial_state(spec)
    history = []
    for i, d in enumerate(decisions):
        if not isinstance(d, dict) or "choice" not in d:
            raise SimError("wrong_decision_type")
        state, params = apply_choice(spec, state, i, d["choice"])
        history.append({"round": i + 1, "choice": d["choice"], "params": params})
    return state, len(decisions) + 1, history


def score(spec: dict, s: dict) -> int:
    kept = max(0.0, 1 - (s["lost"] + s["fees"]) / spec["start_balance"])
    safe = 1 - min(s["risky"], ROUNDS) / ROUNDS
    good = min(s["good"], ROUNDS) / ROUNDS
    return round(50 * kept + 30 * safe + 20 * good)


def band(points: int) -> str:
    return "high" if points >= 75 else "mid" if points >= 50 else "low"


def evaluate(spec: dict, s: dict, history: list[dict]) -> dict:
    well, improve = [], []
    if s["lost"] == 0:
        well.append(("no_loss", {}))
    else:
        improve.append(("loss", {"lost": s["lost"]}))
    if s["risky"] == 0:
        well.append(("no_risky", {}))
    else:
        improve.append(("risky", {"n": s["risky"]}))
    if spec.get("tracks_fees"):
        if s["fees"] == 0:
            well.append(("no_fees", {}))
        else:
            improve.append(("fees", {"fees": s["fees"]}))
    if s["good"] >= 2:
        well.append(("good_many", {"n": s["good"], "total": ROUNDS}))
    if s["good"] < ROUNDS:
        improve.append(("not_all_good", {"n": ROUNDS - s["good"]}))

    tip = None
    for h in history:
        choice = next(c for c in spec["rounds"][h["round"] - 1]["choices"] if c["id"] == h["choice"])
        if choice.get("tip"):
            tip = choice["tip"]
            break
    pts = score(spec, s)
    return {"score": pts, "band": band(pts), "went_well": well, "improve": improve, "tip": tip}
