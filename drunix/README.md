# CardSaathi DRUNIX application-handoff workflow

This folder contains a Hyperledger Fabric-compatible chaincode contract and a Node.js Gateway API adapter intended to connect to a separately provisioned DRUNIX network. It does **not** install, provision, or run an NPCI/DRUNIX network by itself.

## What is recorded

After a user explicitly opts in on the Find My Path recommendation card, CardSaathi records a pseudonymous receipt with:

- random referral ID and random member reference;
- catalogue card ID and issuer code;
- the consent scope (`card_application_handoff`);
- consent and referral-status changes.

It does **not** send user income, age, credit history, spending, Aadhaar/PAN, name, account/card numbers, conversation text, or uploaded files to the ledger. The receipt is not a card application and does not send an application to the bank. It demonstrates a narrow auditable workflow, not bank integration.

## Modes (do not blur these in a demo)

### 1. Local prototype mode

In the app root `.env`:

```dotenv
DRUNIX_MODE=demo
```

This mode stores audit events in a local SQLite database. The UI explicitly labels it a simulation. It is not a blockchain and should not be presented to judges as a DRUNIX transaction.

### 2. Configured DRUNIX gateway mode

Before switching the app to `DRUNIX_MODE=drunix`, your team needs a DRUNIX test network, deployed chaincode, a valid channel/chaincode name, peer TLS details, and an enrolled client identity. Get the environment values/certificates from the organiser-provided DRUNIX environment; do not guess them.

1. Copy `drunix/gateway/.env.example` to `drunix/gateway/.env`.
2. Replace *all* peer, TLS certificate, identity key/certificate, MSP, channel, chaincode and token placeholders with environment-specific values.
3. From `drunix/gateway`, install dependencies and configure/start the Org1 gateway:

   ```bash
   npm install
   cp .env.example .env
   # Edit .env with actual Org1 network values before starting
   npm start
   ```

4. Configure a **separate Org2 gateway** for issuer-side status changes. Create `.env.org2` using the same template, but replace the identity certificate/key and `DRUNIX_MSP_ID=Org2MSP` with the real issuer-side test identity. Use `PORT=8091` and a distinct `DRUNIX_GATEWAY_TOKEN`, then start it in a second terminal:

   ```bash
   cp .env.example .env.org2
   # Edit .env.org2 using real Org2 identity values and a different token
   DOTENV_CONFIG_PATH=.env.org2 npm start
   ```

   The app must not pretend to be the issuer. Get both identities and network settings from the organiser; all certificate paths and MSP IDs in the template are placeholders.

5. In the app root `.env`, set:

   ```dotenv
   DRUNIX_MODE=drunix
   DRUNIX_GATEWAY_URL=http://127.0.0.1:8090
   DRUNIX_GATEWAY_TOKEN=the_org1_gateway_token
   DRUNIX_ISSUER_GATEWAY_URL=http://127.0.0.1:8091
   DRUNIX_ISSUER_GATEWAY_TOKEN=the_distinct_org2_gateway_token
   DRUNIX_ISSUER_CONSOLE_TOKEN=a_long_random_operator_secret
   ```

   Restart FastAPI after editing `.env`. The UI prompts the issuer/operator for the console token; the server uses the separately configured Org2 gateway. The token is a lightweight prototype guard, not production authentication.

6. Run `python scripts/drunix_smoke_test.py` from the project root for a no-write preflight. A ready response only means the gateway adapter loaded its identity/configuration. To verify the complete flow on a **development/test ledger only**, run `python scripts/drunix_smoke_test.py --write`. It verifies a synthetic receipt, creates several issuer status transitions through Org2, reads transaction history, revokes consent and checks final state. Before writing, the script checks that the Org2 gateway and console token are configured. It refuses to write in demo mode.

**Never use demo mode when claiming a live ledger integration.** In `drunix` mode, errors do not fall back to SQLite.

## Chaincode identity requirements

`chaincode-go/main.go` is a starter contract with placeholder MSP IDs:

- `CreateReferral` and `RevokeConsent` require `Org1MSP` (the CardSaathi side in this sample).
- `UpdateReferralStatus` requires `Org2MSP` (a participating-issuer side in this sample).

Therefore an actual cross-organisation demonstration needs a separate Org2 identity and gateway configuration to update referral status. Do not give Org1 credentials to the issuer. The sample gateway exposes `PATCH /referrals/:id/status`. The CardSaathi backend calls it only through the separately configured Org2 gateway and requires an issuer-console token. A local SQLite sandbox is useful for rehearsing the demo flow but is never reported as a blockchain transaction.

Change the sample MSP IDs and endorsement/access policies to match the actual network and have the organizers/security reviewer inspect them before a live demo. Protect gateway network access; the shared `x-api-token` is a prototype bearer token, not a production identity system.

## API overview

FastAPI (CardSaathi app):

- `GET /api/drunix/status` — shows simulation vs gateway state.
- `POST /api/referrals` with `{"card_id":"...", "consent":true}` — creates a pseudonymous receipt after explicit consent.
- `GET /api/referrals/{id}` — reads its latest status.
- `GET /api/referrals/{id}/history` — reads history.
- `POST /api/referrals/{id}/revoke` — submits a consent-revocation event.
- `PATCH /api/issuer/referrals/{id}/status` — validates an issuer status transition. Demo mode writes to SQLite simulation; live mode requires issuer-console authentication and the separate Org2 gateway.

Node gateway (configured separately):

- `GET /health`
- `POST /referrals`
- `GET /referrals/:id`
- `GET /referrals/:id/history`
- `POST /referrals/:id/revoke`
- `PATCH /referrals/:id/status` (must be run through an Org2 identity)

All gateway routes require `x-api-token`. Only use synthetic test data on a dev network. Revoking consent records a new event/status; it cannot erase records already seen by another participant.
