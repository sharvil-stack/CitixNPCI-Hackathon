from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

import scam_core

app = FastAPI(title="Scam Detection ML Service")


class AnalyzeRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)


@app.on_event("startup")
def warm_up():
    scam_core.get_model()  # load the joblib model once at startup


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    return scam_core.analyze(req.message)


@app.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty image")
    return scam_core.analyze_image(data)