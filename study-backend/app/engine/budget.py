"""Household budget simulation. Pure, deterministic functions: no I/O, no randomness, no AI.

Accounting rules
- Income (12,000) is divided across 5 categories; the split never creates extra money.
- Existing savings (1,000) are separate from the monthly savings contribution.
  Savings balance = existing savings + the contribution chosen in round 1.
- Cash balance = the "other spending" allocation, i.e. the only flexible money that is
  not already committed to housing, food, bills or savings.
- Every expense is deducted exactly once (each event is recorded in `handled`).
- Borrowing: cash +principal, debt +principal, repayment due next month = principal + 12%,
  then the expense is paid from that cash.
- Reducing other spending pays from cash; it never creates money.
"""
from __future__ import annotations

import copy
from dataclasses import dataclass, field

from .errors import SimError

INCOME = 12_000
STARTING_SAVINGS = 1_000
CATEGORIES = ("housing", "food", "bills", "other", "savings")
MINIMUMS = {"housing": 3_500, "food": 2_500, "bills": 1_500, "other": 0, "savings": 0}
DEFAULT_ALLOCATION = {"housing": 3_500, "food": 3_000, "bills": 1_500, "other": 2_500, "savings": 1_500}

MEDICAL_EXPENSE = 2_000
LOAN_RATE_PCT = 12
BILL_AMOUNT = 1_500
LATE_FEE = 150
RESERVE_TARGET = 2_500   # savings considered a healthy reserve
NET_TARGET = 3_000       # net position (savings + cash - dues) considered healthy
SAVING_GOAL = 1_200      # 10% of income


@dataclass
class State:
    income: int
    allocations: dict
    savings: int
    cash: int
    debt: int = 0
    repayments: int = 0          # due next month (loan + interest, late fees)
    unpaid: int = 0              # bills not paid yet
    other_reduced: int = 0       # other-spending money used to pay expenses
    handled: list = field(default_factory=list)


def loan_repayment(principal: int) -> int:
    return principal + principal * LOAN_RATE_PCT // 100


def validate_allocation(alloc) -> None:
    if not isinstance(alloc, dict) or set(alloc) != set(CATEGORIES):
        raise SimError("bad_allocation_keys")
    for k in CATEGORIES:
        v = alloc[k]
        if isinstance(v, bool) or not isinstance(v, int):
            raise SimError("not_whole_number", category=k)
        if v < 0:
            raise SimError("negative", category=k)
    for k in CATEGORIES:
        if alloc[k] < MINIMUMS[k]:
            raise SimError("below_minimum", category=k, minimum=MINIMUMS[k])
    total = sum(alloc.values())
    if total != INCOME:
        raise SimError("total_mismatch", total=total, income=INCOME)


def start_state(alloc: dict) -> State:
    validate_allocation(alloc)
    return State(income=INCOME, allocations=dict(alloc),
                 savings=STARTING_SAVINGS + alloc["savings"], cash=alloc["other"])


def round2_options(s: State) -> list[dict]:
    return [
        {"id": "savings", "enabled": s.savings >= MEDICAL_EXPENSE,
         "reason": ("not_enough_savings", {"have": s.savings})},
        {"id": "reduce", "enabled": s.cash >= MEDICAL_EXPENSE,
         "reason": ("not_enough_other", {"have": s.cash})},
        {"id": "borrow", "enabled": True, "reason": None},
    ]


def round3_options(s: State) -> list[dict]:
    return [
        {"id": "pay_now", "enabled": s.cash + s.savings >= BILL_AMOUNT,
         "reason": ("not_enough_money", {"have": s.cash + s.savings})},
        {"id": "delay", "enabled": True, "reason": None},
        {"id": "reduce_spending", "enabled": s.cash >= BILL_AMOUNT,
         "reason": ("not_enough_other", {"have": s.cash})},
    ]


def _check(options: list[dict], choice) -> None:
    match = [o for o in options if o["id"] == choice]
    if not match:
        raise SimError("unknown_choice")
    if not match[0]["enabled"]:
        raise SimError("unaffordable")


def _handle_once(s: State, event_id: str) -> None:
    if event_id in s.handled:
        raise SimError("already_handled")
    s.handled.append(event_id)


def apply_round2(state: State, choice) -> tuple[State, dict]:
    _check(round2_options(state), choice)
    s = copy.deepcopy(state)
    _handle_once(s, "medical")
    params: dict = {}
    if choice == "savings":
        s.savings -= MEDICAL_EXPENSE
    elif choice == "reduce":
        s.cash -= MEDICAL_EXPENSE
        s.other_reduced += MEDICAL_EXPENSE
    else:  # borrow
        s.cash += MEDICAL_EXPENSE            # loan arrives
        s.debt += MEDICAL_EXPENSE
        s.repayments += loan_repayment(MEDICAL_EXPENSE)
        s.cash -= MEDICAL_EXPENSE            # expense paid once
        params = {"principal": MEDICAL_EXPENSE, "repay": loan_repayment(MEDICAL_EXPENSE),
                  "interest": loan_repayment(MEDICAL_EXPENSE) - MEDICAL_EXPENSE}
    return s, params


def apply_round3(state: State, choice) -> tuple[State, dict]:
    _check(round3_options(state), choice)
    s = copy.deepcopy(state)
    _handle_once(s, "bill")
    params: dict = {}
    if choice == "pay_now":
        from_cash = min(s.cash, BILL_AMOUNT)
        from_savings = BILL_AMOUNT - from_cash
        s.cash -= from_cash
        s.savings -= from_savings
        params = {"from_cash": from_cash, "from_savings": from_savings}
    elif choice == "delay":
        s.unpaid += BILL_AMOUNT
        s.repayments += LATE_FEE
        params = {"fee": LATE_FEE}
    else:  # reduce_spending
        s.cash -= BILL_AMOUNT
        s.other_reduced += BILL_AMOUNT
    return s, params


def replay(decisions: list) -> tuple[State | None, int, list]:
    """Rebuild the run from the decisions list. Returns (state, next_round, history)."""
    if not isinstance(decisions, list):
        raise SimError("bad_decision")
    if len(decisions) > 3:
        raise SimError("too_many_decisions")
    state = None
    history: list[dict] = []
    for i, d in enumerate(decisions):
        if not isinstance(d, dict):
            raise SimError("bad_decision")
        if i == 0:
            if "allocation" not in d:
                raise SimError("wrong_decision_type")
            state = start_state(d["allocation"])
            history.append({"round": 1, "choice": "allocation", "params": {}})
        else:
            if "choice" not in d:
                raise SimError("wrong_decision_type")
            fn = apply_round2 if i == 1 else apply_round3
            state, params = fn(state, d["choice"])
            history.append({"round": i + 1, "choice": d["choice"], "params": params})
    return state, len(decisions) + 1, history


def score(s: State) -> int:
    bills = 30 if s.unpaid == 0 else 0
    no_debt = 20 if s.debt == 0 else 0
    reserve = round(20 * min(s.savings, RESERVE_TARGET) / RESERVE_TARGET)
    net = s.savings + s.cash - s.repayments - s.unpaid
    net_pts = round(10 * max(0, min(net, NET_TARGET)) / NET_TARGET)
    budget = round(20 * min(s.allocations["savings"], SAVING_GOAL) / SAVING_GOAL)
    return bills + no_debt + reserve + net_pts + budget


def band(points: int) -> str:
    return "high" if points >= 75 else "mid" if points >= 50 else "low"


def evaluate(s: State, history: list[dict]) -> dict:
    """Condition-based findings. Several can be true at once."""
    well, improve = [], []
    if s.unpaid == 0:
        well.append(("bills_paid", {}))
    if s.debt == 0:
        well.append(("no_debt", {}))
    if s.savings >= 2_000:
        well.append(("reserve_ok", {"savings": s.savings}))
    if s.allocations["savings"] >= SAVING_GOAL:
        well.append(("saved_regularly", {"amount": s.allocations["savings"]}))

    if s.savings == 0:
        improve.append(("reserve_zero", {}))
    elif s.savings < 2_000:
        improve.append(("reserve_low", {"savings": s.savings, "target": 2_000}))
    if s.debt > 0:
        flexible = s.allocations["other"] + s.allocations["savings"]
        pct = round(100 * s.repayments / flexible) if flexible else 100
        improve.append(("debt_due", {"repay": s.repayments, "debt": s.debt, "pct": pct}))
    if s.unpaid > 0:
        improve.append(("unpaid_bill", {"unpaid": s.unpaid, "fee": LATE_FEE}))
    if s.allocations["savings"] < SAVING_GOAL:
        improve.append(("low_saving_plan", {"amount": s.allocations["savings"]}))
    if s.cash == 0:
        improve.append(("no_cash", {}))

    chosen = {h["round"]: h["choice"] for h in history}
    if chosen.get(3) == "delay":
        tip = ("tip_delay", {"fee": LATE_FEE})
    elif chosen.get(2) == "borrow":
        tip = ("tip_borrow", {"interest": loan_repayment(MEDICAL_EXPENSE) - MEDICAL_EXPENSE})
    elif chosen.get(2) == "savings" and s.savings < RESERVE_TARGET:
        tip = ("tip_savings", {})
    else:
        tip = ("tip_default", {})
    pts = score(s)
    return {"score": pts, "band": band(pts), "went_well": well, "improve": improve, "tip": tip}
