import os
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from . import service, tts
from .engine.errors import SimError

app = FastAPI(title="Financial Learning API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

Lang = Literal["en", "hi"]


class PlayBody(BaseModel):
    lang: Lang = "en"
    decisions: list[dict] = Field(default_factory=list)


class QuizBody(BaseModel):
    lang: Lang = "en"
    answers: list[int | None]


class TTSBody(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    lang: Lang = "en"


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/topics")
def topics(lang: Lang = Query("en")):
    return service.list_topics(lang)


@app.get("/api/topics/{topic_id}")
def topic(topic_id: str, lang: Lang = Query("en")):
    try:
        return service.topic_detail(topic_id, lang)
    except service.NotFound:
        raise HTTPException(404, "Topic not available")


@app.post("/api/sim/{topic_id}/play")
def play(topic_id: str, body: PlayBody):
    try:
        return service.play(topic_id, body.lang, body.decisions)
    except service.NotFound:
        raise HTTPException(404, "Simulation not available")
    except SimError as e:
        raise HTTPException(422, {"code": e.code, "message": service.error_message(e, body.lang)})


@app.get("/api/topics/{topic_id}/quiz")
def quiz(topic_id: str, lang: Lang = Query("en")):
    try:
        return service.quiz_for(topic_id, lang)
    except service.NotFound:
        raise HTTPException(404, "Quiz not available")


@app.post("/api/topics/{topic_id}/quiz/score")
def quiz_score(topic_id: str, body: QuizBody):
    try:
        return service.quiz_score(topic_id, body.lang, body.answers)
    except service.NotFound:
        raise HTTPException(404, "Quiz not available")
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/api/tts")
def speak(body: TTSBody):
    try:
        path = tts.synthesize(body.text, body.lang)
    except tts.TTSError as e:
        raise HTTPException(503, f"Voice unavailable: {e}")
    return FileResponse(path, media_type="audio/mpeg")
