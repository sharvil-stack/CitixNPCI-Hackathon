# FINORA frontend (finora-app)

React + Vite + TypeScript. Only runtime dependencies are `react` and `react-dom`; routing, icons and animation are hand-written (see `src/lib`).
The old `finora-web/` and `frontend/` folders are **not used** and can be deleted; the backends are untouched.

## Run
```bash
# 1) backends (from repo root; install each service's requirements first)
pip install -r requirements.txt -r govtscheme/backend/requirements.txt -r study-backend/requirements.txt -r ml-model/requirements.txt
cp .env.example .env          # add GROQ_API_KEY (CardWise chat) ; govtscheme/backend/.env also needs a Groq key
bash scripts/start-backends.sh # needs Java 17+ for Spring Boot (ScamShield)

# 2) frontend
cd finora-app && npm install && cp .env.example .env && npm run dev   # http://localhost:5173
npm run build && npm run preview                                       # production build
```

## Services and ports
| Service | Port | Used for | Languages |
|---|---|---|---|
| CardWise `backend/app.py` | 8000 | cards, recommend, chat, parse-profile, lessons, resources, TTS, DRUNIX referrals (adapter) | en, hi, mr |
| SchemeSathi `govtscheme/backend` | 8001 | match, voice/document extraction, explain, audio | en, hi |
| MoneyMentor `study-backend` | 8002 | topics, lessons, simulations, quizzes, TTS | en, hi |
| ML model `ml-model/api.py` | 8003 | called by Spring Boot only | – |
| ScamShield Spring Boot | 8080 | `/api/scams/analyze`, `/analyze-image`, `/examples` | en |

## Environment variables (finora-app/.env)
`CARDWISE_URL`, `SCHEMES_URL`, `STUDY_URL`, `SCAM_URL` – dev/preview proxy targets (default the ports above).
`VITE_CARDWISE_URL`, `VITE_SCHEMES_URL`, `VITE_STUDY_URL`, `VITE_SCAM_URL` – optional direct URLs; if set, those services must allow CORS for your origin (CardWise and Spring Boot currently do not). By default the browser calls `/svc/<name>` and Vite proxies it. Secrets (Groq key, DRUNIX tokens) stay in the backends' `.env`.

## Structure
`src/lib` router, icons, strings, image helper · `src/services` one typed API module per backend + `http.ts` · `src/context` language · `src/hooks` · `src/components/{layout,ui}` · `src/pages` · `src/features/{schemes,scamshield,moneymentor,cardwise,drunix}` · `src/styles/global.css` (design tokens).

## Notes
- No Login/Sign Up: the backends have no authentication.
- SchemeSathi has no catalogue endpoint, so "Browse" calls `/api/match` with an empty profile.
- ScamShield uses only Spring Boot (no direct ML fallback). Screenshots over ~900 KB are compressed in the browser because Spring's default upload limit is 1 MB.
- Interface language: EN/हिंदी/मराठी. Backend content follows each service's supported languages; unsupported ones show English with a notice.
## Spring Boot auth (register / login / JWT)

The Spring Boot service (port 8080) now provides account auth. Users live in a local H2 file DB (`./data/finora`)
by default; set `SPRING_DATASOURCE_*` to use Postgres/MySQL. Set `FINORA_JWT_SECRET` (32+ chars) outside local dev.

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `{fullName, email, password}` | 201 + tokens. Password 8-72 chars, letter + number |
| POST | `/api/auth/login` | `{email, password}` | 5 failed attempts lock the account for 15 min (429) |
| POST | `/api/auth/refresh` | `{refreshToken}` | Rotates the refresh token; replaying an old one revokes all sessions |
| POST | `/api/auth/logout` | `{refreshToken}` | 204, idempotent |
| GET | `/api/auth/me` | - | Needs `Authorization: Bearer <accessToken>` |

Access tokens last 15 min (HS256 JWT); refresh tokens last 14 days and are stored hashed. `/api/scams/**` stays
public by default (`finora.security.public-paths`); every other route requires a token. Through the Vite proxy the
frontend reaches these as `/svc/scam/api/auth/...`.

```bash
curl -s localhost:8080/api/auth/register -H 'Content-Type: application/json' \
  -d '{"fullName":"Asha","email":"asha@example.com","password":"Passw0rdOK"}'
```

### Frontend login / signup

`finora-app` has `/login` and `/signup` pages (English, Hindi, Marathi), Log in / Sign Up buttons in the navbar, and a
name + Log out control once signed in. Sessions persist across reloads: tokens are kept in `localStorage`, the
access token is attached only to requests for the Spring Boot service, and an expired access token is refreshed
once automatically. `?next=/some/path` sends the user back after login (same-site paths only).
Start the Spring Boot service on port 8080, then `npm run dev` in `finora-app`.
