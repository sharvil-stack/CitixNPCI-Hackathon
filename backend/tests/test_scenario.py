import itertools

import pytest

from app.content.scenarios import SCENARIOS
from app.engine import scenario as sc
from app.engine.errors import SimError


def best_path(spec):
    return [{"choice": next(c["id"] for c in r["choices"] if c["effects"].get("good"))} for r in spec["rounds"]]


@pytest.mark.parametrize("name", SCENARIOS)
def test_best_path_scores_100_and_has_no_loss(name):
    spec = SCENARIOS[name]
    s, nxt, h = sc.replay(spec, best_path(spec))
    assert nxt == 4 and sc.score(spec, s) == 100 and s["lost"] == 0 and s["fees"] == 0 and s["good"] == 3
    ev = sc.evaluate(spec, s, h)
    assert not ev["improve"] and ev["tip"] is None


@pytest.mark.parametrize("name", SCENARIOS)
def test_every_path_is_valid_conserves_money_and_is_deterministic(name):
    spec = SCENARIOS[name]
    ids = [[c["id"] for c in r["choices"]] for r in spec["rounds"]]
    scores = set()
    for path in itertools.product(*ids):
        d = [{"choice": c} for c in path]
        s1, *_ = sc.replay(spec, d)
        s2, *_ = sc.replay(spec, d)
        assert s1 == s2
        assert s1["balance"] >= 0
        assert s1["balance"] + s1["cash"] + s1["lost"] + s1["fees"] == spec["start_balance"]
        assert 0 <= sc.score(spec, s1) <= 100
        scores.add(sc.score(spec, s1))
    assert len(scores) > 3


def test_upi_worst_path_loses_money_and_scores_low():
    spec = SCENARIOS["upi"]
    s, _, h = sc.replay(spec, [{"choice": "approve"}, {"choice": "share_otp"}, {"choice": "send_back"}])
    assert s["lost"] == 6_500 and s["balance"] == 0 or s["lost"] <= spec["start_balance"]
    assert sc.band(sc.score(spec, s)) == "low"
    ev = sc.evaluate(spec, s, h)
    assert {"loss", "risky", "not_all_good"} <= {c for c, _ in ev["improve"]}
    assert ev["tip"] is not None


def test_loss_cannot_exceed_balance():
    spec = SCENARIOS["upi"]
    s, *_ = sc.replay(spec, [{"choice": "approve"}, {"choice": "share_otp"}, {"choice": "send_back"}])
    assert s["balance"] == 0 and s["lost"] == 5_000


def test_banking_fee_paths():
    spec = SCENARIOS["banking"]
    s, *_ = sc.replay(spec, [{"choice": "current"}, {"choice": "other_small"}, {"choice": "block"}])
    assert s["fees"] == 392 and s["cash"] == 1_000


def test_invalid_input_rejected():
    spec = SCENARIOS["upi"]
    for bad in ([{"choice": "nope"}], [{"allocation": {}}], ["x"]):
        with pytest.raises(SimError):
            sc.replay(spec, bad)
    with pytest.raises(SimError):
        sc.replay(spec, [{"choice": "ignore"}] * 4)
