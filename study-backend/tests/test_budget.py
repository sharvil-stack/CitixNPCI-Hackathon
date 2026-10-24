import pytest

from app.engine import budget as b
from app.engine.errors import SimError

D = b.DEFAULT_ALLOCATION


def run(*choices, alloc=None):
    decisions = [{"allocation": alloc or D}] + [{"choice": c} for c in choices]
    return b.replay(decisions)


def code(fn, *a):
    with pytest.raises(SimError) as e:
        fn(*a)
    return e.value.code


# ---- round 1 validation
def test_default_allocation_is_valid_and_sums_to_income():
    assert sum(D.values()) == b.INCOME
    b.validate_allocation(D)


def test_total_must_equal_income():
    assert code(b.validate_allocation, {**D, "other": 2_400}) == "total_mismatch"
    assert code(b.validate_allocation, {**D, "other": 2_600}) == "total_mismatch"


def test_negative_and_non_integer_rejected():
    assert code(b.validate_allocation, {**D, "other": -100, "savings": 4_100}) == "negative"
    assert code(b.validate_allocation, {**D, "other": 2_500.5}) == "not_whole_number"
    assert code(b.validate_allocation, {**D, "other": True}) == "not_whole_number"
    assert code(b.validate_allocation, {"housing": 1}) == "bad_allocation_keys"


def test_essential_minimums_enforced():
    assert code(b.validate_allocation, {**D, "housing": 1_000, "other": 5_000}) == "below_minimum"


def test_start_state_separates_savings_and_cash():
    s = b.start_state(D)
    assert s.savings == b.STARTING_SAVINGS + 1_500 and s.cash == 2_500
    assert s.debt == s.repayments == s.unpaid == 0


# ---- round 2
def test_use_savings():
    s, *_ = run("savings")
    assert (s.savings, s.cash, s.debt) == (500, 2_500, 0)


def test_reduce_spending_uses_cash_once():
    s, *_ = run("reduce")
    assert (s.savings, s.cash, s.other_reduced) == (2_500, 500, 2_000)


def test_borrow_creates_debt_and_repayment_without_creating_money():
    s, *_ = run("borrow")
    assert s.cash == 2_500          # loan in, expense out
    assert s.debt == 2_000 and s.repayments == 2_240
    assert s.savings == 2_500


def test_savings_unaffordable_with_zero_monthly_saving():
    alloc = {**D, "savings": 0, "other": 4_000}
    state = b.start_state(alloc)
    assert state.savings == 1_000
    assert code(b.apply_round2, state, "savings") == "unaffordable"


def test_expense_larger_than_cash_rejected():
    alloc = {**D, "other": 500, "food": 5_000}
    state = b.start_state(alloc)
    assert code(b.apply_round2, state, "reduce") == "unaffordable"


def test_borrow_always_allowed():
    alloc = {"housing": 3_500, "food": 2_500, "bills": 1_500, "other": 0, "savings": 4_500}
    s, _ = b.apply_round2(b.start_state({**alloc, "savings": 0, "other": 4_500}), "borrow")
    assert s.debt == 2_000


# ---- round 3
def test_pay_now_uses_cash_first_then_savings():
    s, *_ = run("reduce", "pay_now")      # cash 500, savings 2500 -> 500 cash + 1000 savings
    assert (s.cash, s.savings, s.unpaid) == (0, 1_500, 0)


def test_pay_now_from_cash_only_when_enough():
    s, *_ = run("savings", "pay_now")
    assert (s.cash, s.savings) == (1_000, 500)


def test_delay_creates_unpaid_and_late_fee_once():
    s, *_ = run("savings", "delay")
    assert s.unpaid == 1_500 and s.repayments == b.LATE_FEE


def test_reduce_spending_requires_cash():
    state, *_ = run("reduce")
    assert code(b.apply_round3, state, "reduce_spending") == "unaffordable"


def test_pay_now_unaffordable_when_cash_plus_savings_short():
    alloc = {"housing": 3_500, "food": 2_500, "bills": 1_500, "other": 0, "savings": 0}
    alloc["food"] += 4_500
    state, _ = b.apply_round2(b.start_state(alloc), "borrow")   # cash 0, savings 1000
    assert code(b.apply_round3, state, "pay_now") == "unaffordable"


def test_same_event_cannot_be_paid_twice():
    state, *_ = run("savings")
    state, _ = b.apply_round3(state, "pay_now")
    assert code(b.apply_round3, state, "pay_now") == "already_handled"


def test_too_many_or_wrong_decisions_rejected():
    assert code(b.replay, [{"allocation": D}, {"choice": "savings"}, {"choice": "pay_now"}, {"choice": "x"}]) == "too_many_decisions"
    assert code(b.replay, [{"choice": "savings"}]) == "wrong_decision_type"
    assert code(b.replay, [{"allocation": D}, {"allocation": D}]) == "wrong_decision_type"
    assert code(b.replay, ["nope"]) == "bad_decision"
    assert code(b.replay, [{"allocation": D}, {"choice": "steal"}]) == "unknown_choice"


# ---- determinism, scoring, findings
def test_same_decisions_same_result():
    a = run("borrow", "pay_now")
    c = run("borrow", "pay_now")
    assert a[0] == c[0] and b.evaluate(a[0], a[2]) == b.evaluate(c[0], c[2])


def test_money_is_conserved():
    # Final net position = starting position - events paid + loans; check every path.
    start = b.start_state(D)
    base = start.savings + start.cash
    for r2 in ("savings", "reduce", "borrow"):
        for r3 in ("pay_now", "delay"):
            s, *_ = run(r2, r3)
            spent = b.MEDICAL_EXPENSE + (b.BILL_AMOUNT if r3 == "pay_now" else 0)
            borrowed = b.MEDICAL_EXPENSE if r2 == "borrow" else 0
            assert s.savings + s.cash == base - spent + borrowed


def test_score_prefers_reduce_over_savings_over_borrow_and_penalises_delay():
    sc = {r2: b.score(run(r2, "pay_now")[0]) for r2 in ("savings", "reduce", "borrow")}
    assert sc["reduce"] > sc["savings"] > sc["borrow"]
    assert b.score(run("savings", "delay")[0]) < sc["borrow"]


def test_findings_can_be_mixed():
    s, _, h = run("savings", "pay_now")
    ev = b.evaluate(s, h)
    went = {c for c, _ in ev["went_well"]}
    improve = {c for c, _ in ev["improve"]}
    assert {"bills_paid", "no_debt"} <= went and "reserve_low" in improve
    assert ev["tip"][0] == "tip_savings"


def test_borrow_and_delay_tips_and_findings():
    s, _, h = run("borrow", "delay")
    ev = b.evaluate(s, h)
    assert ev["tip"][0] == "tip_delay"
    assert {"debt_due", "unpaid_bill"} <= {c for c, _ in ev["improve"]}
    assert 0 <= ev["score"] <= 100
