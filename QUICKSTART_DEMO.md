# CardSaathi quick start — no Docker required

CardSaathi itself does not need Docker. The heavy Docker/YugabyteDB download happened because we tried to run NPCI Drunix's separate local test network. You can stop that path; it is not required to run the app or prepare the repository for GitHub.

## Run the app

```bash
# From the CardSaathi_v3 project root
source .venv/bin/activate  # if your virtual environment already exists
python -m pip install -r requirements.txt
cp .env.example .env       # only if .env does not already exist
```

Edit `.env` locally and set your Groq key:

```dotenv
LLM_PROVIDER=groq
GROQ_API_KEY=your_real_key_here
GROQ_MODEL=openai/gpt-oss-20b
DRUNIX_MODE=demo
```

Never commit `.env` or paste API keys into chat. Then run:

```bash
uvicorn backend.app:app --reload
```

Open http://127.0.0.1:8000. Find My Path → choose a card → explicitly consent → Create journey receipt. In demo mode the receipt/audit workflow is stored in local SQLite and clearly labelled as a simulation, not a blockchain.

## Real Drunix without Docker on this Mac

A real ledger operation still requires a reachable Drunix peer network, deployed `cardsaathi` chaincode, TLS details and a valid enrolled identity. If the organiser provides a hosted network, run the Node gateway from `drunix/gateway` and point it at that remote peer. The gateway uses Node + gRPC and doesn't launch Docker. Follow `drunix/README.md` for the exact environment variables and two-identity setup. Without those real network details, no local code can create a genuine Drunix transaction; do not label SQLite demo receipts as blockchain.

## Tests

```bash
python -m unittest discover -s tests -v
node --check drunix/gateway/server.mjs
node --check frontend/app.js
```
