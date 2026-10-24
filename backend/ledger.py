"""Privacy-minimised application-handoff ledger adapter.

DEMO mode uses SQLite and is explicitly NOT a blockchain. DRUNIX mode calls a
separately deployed API gateway. Only a pseudonymous referral and workflow
metadata are sent to that gateway; never pass user profiles or identity data.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "backend" / "cache" / "referrals_demo.sqlite"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _mode() -> str:
    value = os.getenv("DRUNIX_MODE", "demo").strip().lower()
    if value not in {"demo", "drunix"}:
        raise HTTPException(status_code=500, detail="Invalid DRUNIX_MODE. Use 'demo' or 'drunix'; mode will not silently fall back.")
    return value


def _validate_referral_id(referral_id: str) -> str:
    if not isinstance(referral_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{4,100}", referral_id):
        raise HTTPException(status_code=400, detail="Invalid referral ID.")
    return referral_id


def _db_path() -> Path:
    custom = os.getenv("DRUNIX_DEMO_DB", "").strip()
    p = Path(custom).expanduser() if custom else DEFAULT_DB
    if not p.is_absolute():
        p = ROOT / p
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


@contextmanager
def _connect():
    """Yield a demo SQLite connection and always commit/rollback/close it."""
    conn = sqlite3.connect(_db_path(), timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA journal_mode=WAL")
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS referrals (
            referral_id TEXT PRIMARY KEY,
            member_ref TEXT NOT NULL,
            card_id TEXT NOT NULL,
            issuer_code TEXT NOT NULL,
            consent_scope TEXT NOT NULL,
            status TEXT NOT NULL,
            mode TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS referral_events (
            event_no INTEGER PRIMARY KEY AUTOINCREMENT,
            referral_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            status TEXT NOT NULL,
            actor TEXT NOT NULL,
            transaction_ref TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            FOREIGN KEY(referral_id) REFERENCES referrals(referral_id)
        );
        """)
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _public_record(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def _record_event(conn: sqlite3.Connection, referral_id: str, event_type: str, status: str, actor: str) -> str:
    tx_ref = "DEMO-" + uuid.uuid4().hex[:16].upper()
    conn.execute(
        "INSERT INTO referral_events(referral_id,event_type,status,actor,transaction_ref,occurred_at) VALUES(?,?,?,?,?,?)",
        (referral_id, event_type, status, actor, tx_ref, _now()),
    )
    return tx_ref


def _demo_status() -> dict[str, Any]:
    return {
        "mode": "demo_simulated",
        "is_live": False,
        "ready": True,
        "label": "DRUNIX demo ledger (SQLite simulation)",
        "notice": "This local audit trail is a demo simulation, not a DRUNIX blockchain transaction.",
    }


async def ledger_status() -> dict[str, Any]:
    mode = _mode()
    if mode == "demo":
        return _demo_status()
    base = os.getenv("DRUNIX_GATEWAY_URL", "").strip().rstrip("/")
    token = os.getenv("DRUNIX_GATEWAY_TOKEN", "").strip()
    if not base or not token:
        return {"mode": "drunix_unconfigured", "is_live": False, "ready": False,
                "label": "DRUNIX gateway not configured",
                "notice": "Set DRUNIX_GATEWAY_URL and DRUNIX_GATEWAY_TOKEN; no demo fallback occurs in DRUNIX mode."}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(4.0, connect=2.0)) as client:
            resp = await client.get(base + "/health", headers={"x-api-token": token})
        if resp.status_code == 200:
            body = resp.json()
            return {"mode": "drunix_gateway", "is_live": True, "ready": bool(body.get("ready")),
                    "label": "DRUNIX gateway connected" if body.get("ready") else "DRUNIX gateway not ready",
                    "notice": body.get("notice", "Successful writes are still required to confirm ledger operation.")}
        return {"mode": "drunix_gateway_unavailable", "is_live": False, "ready": False,
                "label": "DRUNIX gateway unavailable", "notice": "The configured gateway did not confirm readiness."}
    except (httpx.HTTPError, ValueError):
        return {"mode": "drunix_gateway_unavailable", "is_live": False, "ready": False,
                "label": "DRUNIX gateway unavailable", "notice": "Could not reach the configured gateway. No demo fallback occurs."}


async def create_referral(*, card_id: str, issuer_code: str, consent: bool) -> dict[str, Any]:
    if consent is not True:
        raise HTTPException(status_code=400, detail="Explicit consent is required before recording the application handoff.")
    referral_id = "ref-" + uuid.uuid4().hex
    member_ref = "member-" + secrets.token_hex(18)  # lowercase hex satisfies the gateway/chaincode slug contract
    payload = {
        "referral_id": referral_id,
        "member_ref": member_ref,
        "card_id": card_id,
        "issuer_code": issuer_code,
        "consent_scope": "card_application_handoff",
    }
    if _mode() == "drunix":
        base = os.getenv("DRUNIX_GATEWAY_URL", "").strip().rstrip("/")
        token = os.getenv("DRUNIX_GATEWAY_TOKEN", "").strip()
        if not base or not token:
            raise HTTPException(status_code=503, detail="DRUNIX mode is selected but the gateway URL/token is not configured. No simulated ledger record was created.")
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=3.0)) as client:
                resp = await client.post(base + "/referrals", json=payload, headers={"x-api-token": token})
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="The DRUNIX gateway rejected the handoff record. No fallback record was created.")
            out = resp.json()
            # The gateway must confirm a VALID commit and a successful read-after-write.
            # Do not label a mere HTTP response or endorsement as a ledger success.
            if (out.get("mode") != "drunix_gateway" or out.get("ledger_verified") is not True
                    or out.get("commit_status") != "VALID" or not out.get("transaction_id")):
                raise HTTPException(status_code=502, detail="The DRUNIX gateway did not return a verified committed transaction. No demo fallback record was created.")
            out.setdefault("referral_id", referral_id)
            out["ledger_verified"] = True
            out["verification"] = "committed_and_read_back"
            out.setdefault("is_live", True)
            return out
        except HTTPException:
            raise
        except (httpx.HTTPError, ValueError):
            raise HTTPException(status_code=503, detail="Could not reach DRUNIX. No demo fallback record was created.")

    created = _now()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO referrals(referral_id,member_ref,card_id,issuer_code,consent_scope,status,mode,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",
            (referral_id, member_ref, card_id, issuer_code, payload["consent_scope"], "CONSENTED", "demo_simulated", created, created),
        )
        tx_ref = _record_event(conn, referral_id, "CONSENT_RECORDED", "CONSENTED", "user_consent")
        row = conn.execute("SELECT * FROM referrals WHERE referral_id=?", (referral_id,)).fetchone()
        events = conn.execute("SELECT event_type,status,actor,transaction_ref,occurred_at FROM referral_events WHERE referral_id=? ORDER BY event_no", (referral_id,)).fetchall()
    result = _public_record(row)
    result["transaction_ref"] = tx_ref
    result["events"] = [dict(e) for e in events]
    result["notice"] = _demo_status()["notice"]
    return result


async def get_referral(referral_id: str) -> dict[str, Any]:
    referral_id = _validate_referral_id(referral_id)
    if _mode() == "drunix":
        base = os.getenv("DRUNIX_GATEWAY_URL", "").strip().rstrip("/")
        token = os.getenv("DRUNIX_GATEWAY_TOKEN", "").strip()
        if not base or not token:
            raise HTTPException(status_code=503, detail="DRUNIX gateway is not configured.")
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
                resp = await client.get(base + "/referrals/" + referral_id, headers={"x-api-token": token})
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Referral not found.")
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="DRUNIX gateway could not read the referral.")
            return resp.json()
        except HTTPException:
            raise
        except (httpx.HTTPError, ValueError):
            raise HTTPException(status_code=503, detail="Could not reach DRUNIX gateway.")
    with _connect() as conn:
        row = conn.execute("SELECT * FROM referrals WHERE referral_id=?", (referral_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Referral not found.")
        result = _public_record(row)
        result["events"] = [dict(e) for e in conn.execute("SELECT event_type,status,actor,transaction_ref,occurred_at FROM referral_events WHERE referral_id=? ORDER BY event_no", (referral_id,)).fetchall()]
        result["notice"] = _demo_status()["notice"]
        return result


async def get_referral_history(referral_id: str) -> dict[str, Any]:
    referral_id = _validate_referral_id(referral_id)
    if _mode() == "drunix":
        base = os.getenv("DRUNIX_GATEWAY_URL", "").strip().rstrip("/")
        token = os.getenv("DRUNIX_GATEWAY_TOKEN", "").strip()
        if not base or not token:
            raise HTTPException(status_code=503, detail="DRUNIX gateway is not configured.")
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
                resp = await client.get(base + "/referrals/" + referral_id + "/history", headers={"x-api-token": token})
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Referral not found.")
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="DRUNIX gateway could not read referral history.")
            return {"referral_id": referral_id, "mode": "drunix_gateway", "history": resp.json(),
                    "notice": "History came from the configured DRUNIX gateway; verify network and channel configuration before demoing."}
        except HTTPException:
            raise
        except (httpx.HTTPError, ValueError):
            raise HTTPException(status_code=503, detail="Could not reach DRUNIX gateway.")
    with _connect() as conn:
        row = conn.execute("SELECT referral_id FROM referrals WHERE referral_id=?", (referral_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Referral not found.")
        events = [dict(e) for e in conn.execute(
            "SELECT event_type,status,actor,transaction_ref,occurred_at FROM referral_events WHERE referral_id=? ORDER BY event_no",
            (referral_id,),
        ).fetchall()]
    return {"referral_id": referral_id, "mode": "demo_simulated", "is_live": False, "history": events,
            "notice": _demo_status()["notice"]}


# Issuer-side progression is intentionally narrow and auditable. In demo mode the
# transitions are local simulations; in DRUNIX mode they must be committed by a
# separately configured Org2 gateway, never by reusing the CardSaathi/Org1 identity.
VALID_ISSUER_STATUSES = {"ACKNOWLEDGED", "UNDER_REVIEW", "ACTION_REQUIRED", "COMPLETED", "REJECTED"}
ALLOWED_STATUS_TRANSITIONS = {
    "CONSENTED": {"ACKNOWLEDGED"},
    "ACKNOWLEDGED": {"UNDER_REVIEW"},
    "UNDER_REVIEW": {"ACTION_REQUIRED", "COMPLETED", "REJECTED"},
    "ACTION_REQUIRED": {"UNDER_REVIEW", "COMPLETED", "REJECTED"},
}


async def update_referral_status(referral_id: str, status: str) -> dict[str, Any]:
    """Record an issuer-side progression, requiring a distinct Org2 gateway in live mode."""
    referral_id = _validate_referral_id(referral_id)
    status = str(status or "").upper()
    if status not in VALID_ISSUER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid issuer status.")

    if _mode() == "drunix":
        # Read the existing state as CardSaathi/Org1 first, so clients cannot select
        # an issuer code or update a referral belonging to a different issuer.
        current = await get_referral(referral_id)
        issuer_code = str(current.get("issuer_code", ""))
        if current.get("consent_status") != "GRANTED":
            raise HTTPException(status_code=409, detail="Consent is not active; issuer status cannot be changed.")
        if status not in ALLOWED_STATUS_TRANSITIONS.get(str(current.get("status")), set()):
            raise HTTPException(status_code=409, detail=f"Status transition {current.get('status')} → {status} is not allowed.")

        base = os.getenv("DRUNIX_ISSUER_GATEWAY_URL", "").strip().rstrip("/")
        token = os.getenv("DRUNIX_ISSUER_GATEWAY_TOKEN", "").strip()
        if not base or not token:
            raise HTTPException(status_code=503, detail=(
                "Issuer status updates need a separately configured DRUNIX Org2 gateway. "
                "Set DRUNIX_ISSUER_GATEWAY_URL and DRUNIX_ISSUER_GATEWAY_TOKEN; the Org1 identity is not reused."
            ))
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=3.0)) as client:
                resp = await client.patch(
                    base + "/referrals/" + referral_id + "/status",
                    json={"status": status, "issuer_code": issuer_code},
                    headers={"x-api-token": token},
                )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Referral not found in the issuer ledger gateway.")
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="Org2 DRUNIX gateway rejected the status update.")
            result = resp.json()
            if (result.get("mode") != "drunix_gateway" or result.get("ledger_verified") is not True
                    or result.get("commit_status") != "VALID" or not result.get("transaction_id")
                    or result.get("status") != status):
                raise HTTPException(status_code=502, detail="The issuer gateway did not prove commit and read-back for the status update.")
            result["notice"] = "Issuer status committed through the separate Org2 gateway and verified by ledger read-back. This is workflow tracking, not a bank decision feed."
            result["is_live"] = True
            result["verification"] = "committed_and_read_back"
            return result
        except HTTPException:
            raise
        except (httpx.HTTPError, ValueError):
            raise HTTPException(status_code=503, detail="Could not reach the separate Org2 DRUNIX gateway.")

    with _connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT * FROM referrals WHERE referral_id=?", (referral_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Referral not found.")
        if row["status"] == "CONSENT_REVOKED":
            raise HTTPException(status_code=409, detail="Consent was revoked; issuer status cannot be changed.")
        if status not in ALLOWED_STATUS_TRANSITIONS.get(row["status"], set()):
            raise HTTPException(status_code=409, detail=f"Status transition {row['status']} → {status} is not allowed.")
        now = _now()
        conn.execute("UPDATE referrals SET status=?,updated_at=? WHERE referral_id=?", (status, now, referral_id))
        tx_ref = _record_event(conn, referral_id, "ISSUER_STATUS_CHANGED", status, "issuer_sandbox_simulation")
        updated = conn.execute("SELECT * FROM referrals WHERE referral_id=?", (referral_id,)).fetchone()
        events = [dict(e) for e in conn.execute(
            "SELECT event_type,status,actor,transaction_ref,occurred_at FROM referral_events WHERE referral_id=? ORDER BY event_no",
            (referral_id,),
        ).fetchall()]
    result = _public_record(updated)
    result.update({
        "mode": "demo_simulated", "is_live": False, "transaction_ref": tx_ref,
        "events": events, "notice": "Issuer-side status update simulated locally in SQLite; this is NOT a DRUNIX transaction or a real issuer/bank update.",
    })
    return result


async def revoke_referral(referral_id: str) -> dict[str, Any]:
    referral_id = _validate_referral_id(referral_id)
    if _mode() == "drunix":
        base = os.getenv("DRUNIX_GATEWAY_URL", "").strip().rstrip("/")
        token = os.getenv("DRUNIX_GATEWAY_TOKEN", "").strip()
        if not base or not token:
            raise HTTPException(status_code=503, detail="DRUNIX gateway is not configured.")
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=3.0)) as client:
                resp = await client.post(base + "/referrals/" + referral_id + "/revoke", headers={"x-api-token": token})
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Referral not found.")
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="DRUNIX gateway could not revoke consent.")
            result = resp.json()
            if (result.get("mode") != "drunix_gateway" or result.get("ledger_verified") is not True
                    or result.get("commit_status") != "VALID" or not result.get("transaction_id")):
                raise HTTPException(status_code=502, detail="The DRUNIX gateway did not return a verified consent-revocation transaction.")
            result["notice"] = "Consent revocation was committed and read back from the configured DRUNIX ledger. It cannot erase records already viewed by another organisation."
            return result
        except HTTPException:
            raise
        except (httpx.HTTPError, ValueError):
            raise HTTPException(status_code=503, detail="Could not reach DRUNIX gateway.")
    with _connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute("SELECT * FROM referrals WHERE referral_id=?", (referral_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Referral not found.")
        if row["status"] != "CONSENT_REVOKED":
            now = _now()
            conn.execute("UPDATE referrals SET status=?, updated_at=? WHERE referral_id=?", ("CONSENT_REVOKED", now, referral_id))
            tx_ref = _record_event(conn, referral_id, "CONSENT_REVOKED", "CONSENT_REVOKED", "user_revoke")
        else:
            tx_ref = None
        updated = conn.execute("SELECT * FROM referrals WHERE referral_id=?", (referral_id,)).fetchone()
        events = [dict(e) for e in conn.execute("SELECT event_type,status,actor,transaction_ref,occurred_at FROM referral_events WHERE referral_id=? ORDER BY event_no", (referral_id,)).fetchall()]
    result = _public_record(updated)
    result.update({"mode": "demo_simulated", "is_live": False, "transaction_ref": tx_ref, "events": events, "notice": _demo_status()["notice"]})
    return result
