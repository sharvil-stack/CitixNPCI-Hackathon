import pytest
from fastapi.testclient import TestClient

from app import tts
from app.engine.budget import DEFAULT_ALLOCATION
from app.engine.quiz import score_quiz
from app.main import app

client = TestClient(app)
QS = [{"id": "a", "options": [1, 2, 3, 4], "answer": 2}, {"id": "b", "options": [1, 2], "answer": 0}]


def test_quiz_scoring():
    assert score_quiz(QS, [2, 0])["score"] == 2
    assert score_quiz(QS, [1, 0])["score"] == 1
    r = score_quiz(QS, [None, 5])
    assert r["score"] == 0 and r["results"][1]["chosen"] is None
    with pytest.raises(ValueError):
        score_quiz(QS, [1])


def test_topics_and_lessons_both_languages():
    for lang in ("en", "hi"):
        t = client.get("/api/topics", params={"lang": lang}).json()
        assert len(t) == 6 and [x["active"] for x in t] == [True] * 3 + [False] * 3
    en = client.get("/api/topics/saving", params={"lang": "en"}).json()
    hi = client.get("/api/topics/saving", params={"lang": "hi"}).json()
    assert len(en["lessons"]) == 6 and en["lessons"][0]["title"] != hi["lessons"][0]["title"]
    assert en["lessons"][0]["id"] == hi["lessons"][0]["id"]
    assert client.get("/api/topics/loans").status_code == 404
    assert client.get("/api/topics/saving", params={"lang": "fr"}).status_code == 422


def test_quiz_endpoints():
    qs = client.get("/api/topics/upi/quiz", params={"lang": "hi"}).json()
    assert len(qs) == 5
    r = client.post("/api/topics/upi/quiz/score", json={"lang": "en", "answers": [q["answer"] for q in qs]}).json()
    assert r["score"] == 5 and r["total"] == 5 and all(x["explanation"] for x in r["results"])
    assert client.post("/api/topics/upi/quiz/score", json={"answers": [0]}).status_code == 422


def play(decisions, lang="en", topic="saving"):
    return client.post(f"/api/sim/{topic}/play", json={"lang": lang, "decisions": decisions})


def test_budget_flow_end_to_end():
    r1 = play([]).json()
    assert r1["kind"] == "allocate" and r1["allocation"]["income"] == 12_000 and len(r1["steps"]) == 3
    d = [{"allocation": DEFAULT_ALLOCATION}]
    r2 = play(d).json()
    assert r2["round"] == 2 and r2["event"]["amount"] == 2_000 and all(c["enabled"] for c in r2["choices"])
    r3 = play(d + [{"choice": "reduce"}]).json()
    assert r3["round"] == 3 and next(c for c in r3["choices"] if c["id"] == "reduce_spending")["enabled"] is False
    assert next(c for c in r3["choices"] if c["id"] == "reduce_spending")["reason"]
    done = play(d + [{"choice": "savings"}, {"choice": "pay_now"}]).json()
    rep = done["report"]
    assert done["kind"] == "done" and rep["score"] == 79 and len(rep["history"]) == 3
    assert [r["value"] for r in rep["snapshot"]] == [1_000, 500, 0, 0, 0]
    assert rep["went_well"] and rep["improve"] and rep["tip"]
    hi = play(d + [{"choice": "savings"}, {"choice": "pay_now"}], lang="hi").json()["report"]
    assert hi["score"] == rep["score"] and hi["headline"] != rep["headline"]


def test_budget_errors_are_localised_and_422():
    bad = {**DEFAULT_ALLOCATION, "other": 2_000}
    r = play([{"allocation": bad}], lang="hi")
    assert r.status_code == 422 and "12,000" in r.json()["detail"]["message"]
    assert r.json()["detail"]["code"] == "total_mismatch"
    r = play([{"allocation": DEFAULT_ALLOCATION}, {"choice": "reduce"}, {"choice": "reduce_spending"}])
    assert r.status_code == 422 and r.json()["detail"]["code"] == "unaffordable"


@pytest.mark.parametrize("topic", ["upi", "banking"])
def test_scenario_flow(topic):
    d = []
    for _ in range(3):
        r = play(d, topic=topic).json()
        assert r["kind"] == "choice" and len(r["choices"]) == 3
        d.append({"choice": r["choices"][-1]["id"] if topic == "upi" else r["choices"][0]["id"]})
    rep = play(d, topic=topic).json()["report"]
    assert 0 <= rep["score"] <= 100 and rep["snapshot"] and len(rep["history"]) == 3


def test_play_unknown_topic_404():
    assert play([], topic="loans").status_code == 404


def test_tts_endpoint_with_cache(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(tts, "CACHE_DIR", tmp_path)
    monkeypatch.setattr(tts, "_gtts_save", lambda text, lang, path: (calls.append(lang), path.write_bytes(b"ID3fake")))
    for _ in range(2):
        r = client.post("/api/tts", json={"text": "नमस्ते दुनिया", "lang": "hi"})
        assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg" and r.content == b"ID3fake"
    assert calls == ["hi"]


def test_tts_failure_is_503(tmp_path, monkeypatch):
    monkeypatch.setattr(tts, "CACHE_DIR", tmp_path)

    def boom(*a):
        raise OSError("offline")
    monkeypatch.setattr(tts, "_gtts_save", boom)
    assert client.post("/api/tts", json={"text": "hello", "lang": "en"}).status_code == 503
    assert client.post("/api/tts", json={"text": "   ", "lang": "en"}).status_code == 503
