# CardSaathi — multilingual credit-card companion

CardSaathi is a voice-friendly educational prototype for people in India who are new to credit, have limited income or no credit history, or want to understand an existing credit card. It supports English, Hindi and Marathi, with a structure that makes additional language packs straightforward to add.

## Important: CardSaathi does not require Docker

Run the CardSaathi web app with Python/FastAPI and Groq; Docker is not part of the app's runtime. The separate `~/drunix` checkout is NPCI's **local blockchain test network**, not a CardSaathi dependency. Its sample network defaults to YugabyteDB, which is why it tried to download a large database image and exhausted the remaining Mac storage. Do not push the separate Drunix source checkout into this repository.

**No-Docker development:** keep `DRUNIX_MODE=demo` for UI/workflow development; this uses SQLite and is explicitly labelled a simulation. **Real ledger without Docker on this Mac:** point CardSaathi's gateway adapter at a separately hosted/reachable Drunix peer network with a deployed chaincode and valid network credentials. The app and Node gateway can run locally without Docker, but a real transaction cannot occur until that external network is available. Never present SQLite mode as blockchain.

## What this repaired version includes

- A real Groq-backed chat endpoint (`POST /api/chat`) for open-ended questions. The API key stays in the backend `.env`; it is never sent to the browser.
- English, Hindi and Marathi UI copy, lessons, glossary and resource cards.
- Voice input through the browser Web Speech API when supported (Chrome/Edge generally work best).
- Read-aloud: uses a matching browser speech voice when available, otherwise falls back to server TTS with gTTS. Server TTS requires internet and sends the answer text to the speech provider; avoid reading or entering sensitive personal details.
- FD-backed/secured card path, RuPay-on-UPI limitations, minimum-due warning, card-safety advice, glossary, comparison prototype and links to trustworthy learning resources.
- A 21-product sample card catalogue spanning FD-backed, cashback, online shopping, UPI/RuPay, bills, everyday rewards, lifestyle, travel and fuel use cases. It includes Axis Bank ATLAS, HDFC Regalia Gold and BPCL SBI Card OCTANE to broaden travel/fuel matches. Each card carries benefits, risks, official product/fee links, a verification date and a data-status note. Source pages were checked for the newly added products on 21 October 2026, but issuer terms, fees, eligibility and reward rules can change and must be rechecked before applying. ICICI Platinum Chip remains flagged for re-verification. This is a curated sample, not a market-wide database.
- A test suite for the recommendation path, localized guidance, FD requirements, sensitive-data guard, and source fields.
- A Hugging Face QLoRA/LoRA fine-tuning pipeline using Qwen3-1.7B, plus a separate held-out evaluation set and manual evaluation output generator. The adapter is **not pre-trained or included**; training needs a compatible CUDA GPU, such as a Google Colab T4.

## Setup on macOS / Linux

1. Extract the folder and open it in VS Code.
2. Create and activate a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install packages:

   ```bash
   python -m pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and put your **newly rotated** Groq API key in the local `.env` file:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` so it contains lines like:

   ```dotenv
   GROQ_API_KEY=your_new_key_here
   GROQ_MODEL=openai/gpt-oss-20b
   ```

   Do not add quote marks unless your secret contains spaces, never commit `.env`, and never paste the key into the frontend or a chat. If Groq reports the selected model is unavailable for your account, choose an active model shown in the current Groq model catalog. `qwen/qwen3.8-27b` is a currently documented multilingual option where account access permits it.

5. Start the app from the **project root**:

   ```bash
   uvicorn backend.app:app --reload
   ```

6. Open `http://127.0.0.1:8000` in your browser.

If you change `.env`, stop the server with `Ctrl+C` and start it again. Do not paste API keys into the chat or source code.


## DRUNIX integration: consent-based application-handoff receipt

The **Create journey receipt** action records only a pseudonymous application-handoff workflow after explicit consent. It is not a bank application and does not submit user data to an issuer. The repo contains the chaincode and a Node.js Fabric-Gateway-compatible adapter; it does not contain a hosted ledger or organiser-issued credentials.

### Path A — run CardSaathi locally without Docker

1. Use the regular app setup above. Keep `DRUNIX_MODE=demo` in `.env` while developing UI or rehearsing the flow. The UI says this is an SQLite simulation; no blockchain transaction is claimed.
2. You do **not** need `docker`, the separate `~/drunix` source tree, YugabyteDB, or a local network to run the app. This is also the lightweight path for checking the project and pushing it to GitHub.

### Path B — genuine DRUNIX integration without local Docker

Use this path only when you have access to a remote/hosted Drunix test network. Required inputs are a reachable peer endpoint, TLS root certificate, client certificate/private key, MSP ID, channel, deployed `cardsaathi` chaincode, and (for the issuer workflow) a distinct Org2 identity. The gateway adapter connects over gRPC directly to that peer; it does not start or manage Docker containers. Get these network values and identities from the organiser/network operator. Do not guess them.

1. In the project root, copy `.env.example` to `.env`. Keep `LLM_PROVIDER=groq`, set your own `GROQ_API_KEY`, and select a model enabled for your Groq account. Do not commit `.env`.
2. In `drunix/gateway`, copy `.env.example` to `.env` and fill in the **remote** network endpoint, TLS certificate path, Org1 client certificate/private key path, MSP ID, channel and chaincode name. Set `DRUNIX_GATEWAY_TOKEN` to a long random secret. The certificate/key files stay outside Git and must be provided by your network operator.
3. In the root `.env`, set `DRUNIX_MODE=drunix`, `DRUNIX_GATEWAY_URL=http://127.0.0.1:8090` and `DRUNIX_GATEWAY_TOKEN` to match the local Node gateway token.
4. From `drunix/gateway`, run `npm install` and `npm start` in one terminal. In a second terminal, from the project root, run `uvicorn backend.app:app --reload`. This uses Python and Node only; **no Docker is required on this Mac** when the target peer network already exists elsewhere.
5. For issuer-side status changes, configure a second gateway using the distinct real Org2 identity. Use `PORT=8091`, a different `DRUNIX_GATEWAY_TOKEN`, and in the root `.env` set `DRUNIX_ISSUER_GATEWAY_URL=http://127.0.0.1:8091`, matching `DRUNIX_ISSUER_GATEWAY_TOKEN`, and a separate `DRUNIX_ISSUER_CONSOLE_TOKEN`. Never reuse Org1 identity/token for issuer actions.
6. Run `python scripts/drunix_smoke_test.py` first. Proceed with `python scripts/drunix_smoke_test.py --write` **only on a development/test ledger** and only when you are ready to append synthetic transactions. A live write is accepted only if the gateway returns a valid commit status, transaction ID, and read-after-write verification. A gateway `/health` response is not proof of a ledger transaction.

If a remote network and its certificates are not available, live mode cannot be completed yet; local demo mode is the only standalone option. In `DRUNIX_MODE=drunix`, missing gateway configuration or failed requests fail closed and do not silently fall back to SQLite.

### What is and is not on-chain

No user name, income, age, credit history, spending, PAN/Aadhaar, card/account number, chat text or uploaded file is sent to the ledger. The receipt is a minimal workflow audit record, not a bank application. Consent revocation appends a new event; it cannot erase records already seen by another participant.

The sample chaincode expects `Org1MSP` for creation/revocation and `Org2MSP` for issuer updates. A genuine two-party demo needs separately authorised identities. Adapt MSP IDs and endorsement/access policies to the target network and have the network owner review them before use. The shared gateway token is a prototype guard, not production authentication.

## API endpoints

- `GET /api/health` — reports whether an API key is configured and which model is selected (never returns the key).
- `GET /api/config` — language registry.
- `GET /api/cards` — sample card data. Check each item's `verified_on` and `data_status`; this small catalogue is not comprehensive and any terms must be rechecked with the issuer before applying.
- `GET /api/lessons?lang=en|hi|mr` — lessons and glossary.
- `GET /api/resources?lang=en|hi|mr` — financial-education references.
- `POST /api/chat` — model-backed conversation.
- `POST /api/recommend` — illustrative rule-based comparison.
- `POST /api/tts` — cached text-to-speech audio, with a browser-voice fallback in the frontend.
- `GET /api/drunix/status`, `POST /api/referrals`, `GET /api/referrals/{id}`, `GET /api/referrals/{id}/history`, `POST /api/referrals/{id}/revoke`, `PATCH /api/issuer/referrals/{id}/status` — consent, issuer workflow progression, audit history and revocation; simulated vs. real DRUNIX mode is always distinguished.

## Important accuracy safeguards

- Card-specific pricing, fee waivers, reward rates and eligibility in `backend/data/cards.json` are a reference snapshot for a prototype, not live bank data. A `verified_on` date means a source page was checked; it does not guarantee every promotion, exclusion or eligibility condition remains unchanged. Confirm figures and exact URLs with issuers before a public demo or application. `data_status` flags entries needing re-verification.
- A recommendation does not establish bank eligibility or guarantee approval.
- FD-backed card terms differ by issuer. A deposit may be under lien and may not be freely withdrawable while securing the card. Timely repayments may contribute to credit history but do not guarantee a score or a specific timeline.
- RuPay credit-card-on-UPI applies only to eligible cards, issuers/apps and permitted merchant transactions. NPCI lists transaction-type exclusions; do not imply every QR or person-to-person transfer is supported.
- Paying only the minimum due can cause unpaid balances to accrue interest and extend repayment. Paying the full statement balance by the due date is generally the safer habit where affordable.
- Never ask a user for an OTP, CVV, PIN, password, full card number, Aadhaar or PAN. Avoid logging conversations and add rate limits, cost caps, consent and a privacy review before deployment.

## Trusted learning links used in the app

- RBI credit-card directions: https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12300
- NPCI RuPay credit card on UPI: https://www.npci.org.in/product/rupay/credit-card-on-upi
- National Centre for Financial Education (NCFE) e-learning: https://ncfe.org.in/e-lms/
- NCFE e-library: https://ncfe.org.in/e-library/
- TransUnion CIBIL credit-score and loan basics: https://www.cibil.com/faq/credit-score-and-loan-basics
- Zerodha Varsity personal-finance resources: https://zerodha.com/varsity/category/personal-finance/

Zerodha Varsity is general personal-finance/investing education; use the card issuer's official page for card-specific product terms.

## Hugging Face fine-tuning (optional, not performed in this package)

The app does not need a fine-tuned model to run: Groq is the default provider. If you want a local Hugging Face model, the repository includes a reproducible QLoRA/LoRA pipeline:

- Base model: `Qwen/Qwen3-1.7B`.
- Reviewed starter training data: `training/data/cardsaathi_sft.jsonl` (67 seed examples across English, Hindi and Marathi).
- Separate held-out evaluation prompts: `training/data/cardsaathi_eval.jsonl` (12 examples).
- Training: `training/train_lora.py`; review outputs from `training/evaluate_model.py` after training.

Run training in Google Colab with a CUDA GPU. Follow `training/README.md` or open `training/CardSaathi_Finetune_Colab_v2.ipynb`; don't assume this starter dataset is enough for production-quality financial answers. Fine-tune answer style and safe behavior, **not changing card prices**. Live product terms belong in the structured catalogue and verified sources. After training, download the adapter folder and set `LLM_PROVIDER=local_hf`, `HF_BASE_MODEL=Qwen/Qwen3-1.7B`, and `HF_ADAPTER_PATH=models/cardsaathi-qwen3-1.7b-lora` in your local `.env`. Install local inference dependencies only when you need this mode using `pip install -r requirements-hf.txt`. A Mac can be slow with local inference; the training recipe is designed for CUDA.

## Rebuild / evaluation safeguards

- `Find My Path` returns one primary card to explore plus a small set of alternatives using transparent goal/profile rules and issuer diversity. For thin/no history with income but without an FD, unsecured cards are labelled exploratory, not an approval claim. This score is never a bank approval probability.
- Voice form fill uses browser speech recognition (Chrome/Edge support varies by platform) and asks the LLM to extract only known fields. Review the generated fields before submitting.
- The server has a basic sensitive-data guard to avoid forwarding detected OTP/CVV/PIN/password/long ID-like values to the model provider. Do not rely on regex protection alone; do not enter sensitive data into the app.

## Adding another language

Add a locale entry to `LANGS` in `backend/app.py`, then add complete translated UI strings, `prompt` strings, lesson-title labels and glossary labels in `frontend/app.js`. Add translated lesson/glossary text to `LESSONS` and `GLOSSARY`. Review translations with a fluent speaker before release, especially in financial-safety content.

## Run tests

```bash
python -m unittest discover -s tests -v
```
