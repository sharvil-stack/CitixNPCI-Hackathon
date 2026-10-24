import re

from app.content.common import is_loc
from app.content.quiz import QUIZ
from app.content.scenarios import SCENARIOS
from app.content import budget, report_text, topics, videos

DEVANAGARI = re.compile(r"[\u0900-\u097F]")


def walk(x, path=""):
    if is_loc(x):
        yield path, x
    elif isinstance(x, dict):
        for k, v in x.items():
            yield from walk(v, f"{path}.{k}")
    elif isinstance(x, (list, tuple)):
        for i, v in enumerate(x):
            yield from walk(v, f"{path}[{i}]")


def test_every_string_has_english_and_hindi():
    everything = [topics.TOPICS, videos.VIDEOS, QUIZ, SCENARIOS, vars(budget), vars(report_text)]
    count = 0
    for root in everything:
        for path, loc in walk(root):
            if path.endswith(".intro") and loc["en"] == "" and loc["hi"] == "":
                continue  # coming-soon topics have no intro
            assert loc["en"].strip() and loc["hi"].strip(), path
            count += 1
    assert count > 300


def test_hindi_strings_contain_devanagari_unless_pure_symbols():
    for root in (QUIZ, SCENARIOS, videos.VIDEOS):
        for path, loc in walk(root):
            assert DEVANAGARI.search(loc["hi"]), path


def test_placeholders_match_between_languages():
    field = re.compile(r"\{(\w+)\}")
    for root in (budget.ROUND2, budget.ROUND3, budget.ROUND1, report_text.BUDGET_WELL, report_text.BUDGET_IMPROVE,
                 report_text.BUDGET_TIPS, report_text.ERRORS, report_text.REASONS, budget.OUTCOMES):
        for path, loc in walk(root):
            assert set(field.findall(loc["en"])) == set(field.findall(loc["hi"])), path


def test_catalogue_shape():
    assert topics.ACTIVE_IDS == ["saving", "upi", "banking"]
    for tid in topics.ACTIVE_IDS:
        lessons = videos.VIDEOS[tid]
        assert len(lessons) == 6 and len({v["id"] for v in lessons}) == 6
        assert 3 <= len(QUIZ[tid]) <= 5
        for v in lessons:
            assert v["spoken"] in ("en", "hi") and len(v["points"]) == 3
            assert v["youtube_id"] is None or re.fullmatch(r"[\w-]{11}", v["youtube_id"]), v["id"]


def test_quiz_answers_valid_and_options_unique():
    for tid, qs in QUIZ.items():
        for q in qs:
            assert 0 <= q["answer"] < len(q["options"]) == 4
            assert len({o["en"] for o in q["options"]}) == 4
