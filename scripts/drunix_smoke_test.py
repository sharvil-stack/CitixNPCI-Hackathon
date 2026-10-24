#!/usr/bin/env python3
"""Verify the real two-organisation CardSaathi -> DRUNIX workflow.

Start CardSaathi with DRUNIX_MODE=drunix and configure both Org1 and Org2
Gateways first. This script never writes in SQLite demo mode. Use only on a
development/test ledger: --write creates a synthetic receipt, performs issuer
status updates, checks ledger history, revokes consent, and verifies final state.
"""
from __future__ import annotations

import argparse
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from dotenv import load_dotenv
import os

# Load project-local configuration when the caller launches this script from the repo.
load_dotenv()


def request_json(base_url: str, path: str, *, method: str = "GET", body: dict | None = None,
                 headers: dict[str, str] | None = None) -> dict | list:
    data = None if body is None else json.dumps(body).encode("utf-8")
    request_headers = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        request_headers["Content-Type"] = "application/json"
    req = Request(base_url.rstrip("/") + path, data=data, headers=request_headers, method=method)
    try:
        with urlopen(req, timeout=20) as resp:
            payload = resp.read().decode("utf-8")
            return json.loads(payload) if payload else {}
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:600]
        raise RuntimeError(f"{method} {path} returned HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"Could not connect to CardSaathi at {base_url}: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{method} {path} did not return valid JSON") from exc


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="CardSaathi FastAPI base URL")
    parser.add_argument("--write", action="store_true", help="Exercise consent, Org2 status transitions, history and revoke on the configured DRUNIX test ledger")
    args = parser.parse_args()

    status = request_json(args.base_url, "/api/drunix/status")
    print("CardSaathi ledger status:")
    print(json.dumps(status, indent=2))
    if status.get("mode") != "drunix_gateway" or not status.get("ready") or not status.get("is_live"):
        print("\nSTOP: CardSaathi is not connected to a configured DRUNIX gateway. No write was attempted.", file=sys.stderr)
        print("Set DRUNIX_MODE=drunix and configure the real gateway URL/token and gateway certificates, then restart both services.", file=sys.stderr)
        return 2
    if not args.write:
        print("\nPreflight passed. To verify a real commit plus read-back, rerun with --write (test network only).")
        return 0

    issuer_url = os.getenv("DRUNIX_ISSUER_GATEWAY_URL", "").strip()
    issuer_token = os.getenv("DRUNIX_ISSUER_GATEWAY_TOKEN", "").strip()
    console_token = os.getenv("DRUNIX_ISSUER_CONSOLE_TOKEN", "").strip()
    if not issuer_url or not issuer_token or not console_token:
        print("\nSTOP: a live end-to-end workflow needs DRUNIX_ISSUER_GATEWAY_URL, DRUNIX_ISSUER_GATEWAY_TOKEN, and DRUNIX_ISSUER_CONSOLE_TOKEN configured before writing.", file=sys.stderr)
        print("No receipt was created. Configure the separate Org2 gateway and rerun.", file=sys.stderr)
        return 2

    issuer_headers = {"x-issuer-console-token": console_token}
    print("\nCreating a synthetic consent receipt (no personal or card-account data)...")
    receipt = request_json(args.base_url, "/api/referrals", method="POST", body={"card_id": "idfc-first-wow", "consent": True})
    referral_id = receipt.get("referral_id")
    tx_id = receipt.get("transaction_id")
    if receipt.get("mode") != "drunix_gateway" or receipt.get("ledger_verified") is not True or receipt.get("commit_status") != "VALID" or not tx_id or not referral_id:
        raise RuntimeError("Create response did not prove a committed DRUNIX transaction. Stop and inspect the gateway logs.")
    print(f"PASS create: committed transaction {tx_id}")

    saved = request_json(args.base_url, f"/api/referrals/{referral_id}")
    if saved.get("referral_id") != referral_id or saved.get("status") != "CONSENTED":
        raise RuntimeError("Read-after-write did not return the expected CONSENTED referral state.")
    print("PASS read-back: referral exists in ledger state")

    # Exercise the distinct issuer-side (Org2) transaction path and the enforced state machine.
    for next_status in ("ACKNOWLEDGED", "UNDER_REVIEW", "ACTION_REQUIRED", "UNDER_REVIEW", "COMPLETED"):
        updated = request_json(
            args.base_url,
            f"/api/issuer/referrals/{referral_id}/status",
            method="PATCH",
            body={"status": next_status},
            headers=issuer_headers,
        )
        if (updated.get("status") != next_status or updated.get("mode") != "drunix_gateway"
                or updated.get("ledger_verified") is not True or updated.get("commit_status") != "VALID"
                or not updated.get("transaction_id")):
            raise RuntimeError(f"Issuer transition {next_status} did not prove a committed transaction and read-back.")
        print(f"PASS issuer transition {next_status}: committed transaction {updated['transaction_id']}")

    history = request_json(args.base_url, f"/api/referrals/{referral_id}/history")
    if not isinstance(history, dict) or not history.get("history") or len(history["history"]) < 6:
        raise RuntimeError("Ledger history did not include create plus all issuer status transitions.")
    print(f"PASS history: {len(history['history'])} ledger history row(s)")

    revoked = request_json(args.base_url, f"/api/referrals/{referral_id}/revoke", method="POST", body={})
    revoke_tx = revoked.get("transaction_id")
    if revoked.get("status") != "CONSENT_REVOKED" or revoked.get("ledger_verified") is not True or revoked.get("commit_status") != "VALID" or not revoke_tx:
        raise RuntimeError("Revoke response did not prove a committed DRUNIX transaction.")
    final = request_json(args.base_url, f"/api/referrals/{referral_id}")
    if final.get("status") != "CONSENT_REVOKED" or final.get("consent_status") != "REVOKED":
        raise RuntimeError("Consent-revocation state could not be read back from the ledger.")
    print(f"PASS revoke: committed transaction {revoke_tx}")
    print("\nSUCCESS: consent -> commit/read-back -> Org2 issuer status transitions -> ledger history -> consent revocation -> final read-back all passed on the configured DRUNIX path.")
    print("Keep these transaction IDs for the demo evidence; this test receipt is synthetic.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
