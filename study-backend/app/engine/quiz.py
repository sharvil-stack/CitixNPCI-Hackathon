from __future__ import annotations


def score_quiz(questions: list[dict], answers: list) -> dict:
    """answers[i] is the chosen option index (or None). Pure function."""
    if len(answers) != len(questions):
        raise ValueError("answers length must match number of questions")
    results = []
    for q, a in zip(questions, answers):
        valid = isinstance(a, int) and not isinstance(a, bool) and 0 <= a < len(q["options"])
        results.append({"id": q["id"], "chosen": a if valid else None,
                        "correct_index": q["answer"], "correct": valid and a == q["answer"]})
    return {"score": sum(r["correct"] for r in results), "total": len(questions), "results": results}
