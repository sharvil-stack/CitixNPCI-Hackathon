# FINORA frontend (Vite + React)

Home page + Government Schemes (`/schemes`) wired to the FastAPI backend in `../backend`.

## Run
1. Backend: `cd ../backend && pip install -r requirements.txt && uvicorn main:app --port 8000`
   (add `GROQ_API_KEY` to `backend/.env` for voice input, ID-photo reading and "Explain this scheme";
   `pip install -r requirements-ocr.txt` for ID-photo reading).
2. Frontend: `cp .env.example .env && npm install && npm run dev` → http://localhost:5173
   (port 5173 is the only origin the backend's CORS allows).

## Backend endpoints used
POST /api/match · POST /api/explain · POST /api/extract/voice · POST /api/extract/document · GET /api/audio/{name}.mp3
