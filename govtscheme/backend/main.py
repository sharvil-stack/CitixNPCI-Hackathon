import re
from typing import Dict, Optional

from dotenv import load_dotenv

load_dotenv(override=True)  # backend/.env

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import ai
import engine
import ocr

app = FastAPI(title="Scheme Finder")
app.add_middleware(CORSMiddleware,
                   allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])


def fail(msg, code=500):
    raise HTTPException(status_code=code, detail=str(msg))


class Profile(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    state: str = "Maharashtra"
    area: Optional[str] = None
    income_low: Optional[int] = None    # monthly household income range
    income_high: Optional[int] = None
    occupation: Optional[str] = None
    caste: Optional[str] = None
    needs: Dict[str, str] = {}          # {"disability": "yes"|"no", "bpl": ...}


class ExplainReq(BaseModel):
    scheme: dict
    lang: str = "en"


@app.post("/api/match")
def match(p: Profile):
    return engine.run(p.model_dump())


@app.post("/api/extract/voice")
async def extract_voice(file: UploadFile = File(...)):
    try:
        text = ai.transcribe(await file.read(), file.filename or "speech.webm")
        return {"transcript": text, "profile": ai.extract_profile(text) if text.strip() else {}}
    except Exception as e:
        fail(e)


@app.post("/api/extract/document")
async def extract_document(file: UploadFile = File(...)):
    try:
        raw = ocr.read_text(await file.read())
    except RuntimeError as e:
        fail(e, 501)
    except Exception as e:
        fail("Could not read this image: " + str(e), 400)
    try:
        return {"profile": ai.extract_profile(ai.mask(raw)) if raw.strip() else {}}
    except Exception as e:
        fail(e)


@app.post("/api/explain")
def explain(r: ExplainReq):
    lang = "hi" if r.lang == "hi" else "en"
    try:
        text = ai.explain(r.scheme, lang)
        return {"text": text, "audio_url": f"/api/audio/{ai.tts(text, lang)}.mp3"}
    except Exception as e:
        fail(e)


@app.get("/api/audio/{name}.mp3")
def audio(name: str):
    p = ai.AUDIO_DIR / f"{name}.mp3"
    if not re.fullmatch(r"[a-f0-9]{20}", name) or not p.exists():
        raise HTTPException(status_code=404)
    return FileResponse(p, media_type="audio/mpeg")


@app.get("/api/health")
def health():
    return {"schemes_loaded": len(engine.load())}
