#!/usr/bin/env python3
"""
generate_vectors.py - makes /contracts/test-vectors.json for Finora.

What it does, in plain words:
  1. Creates two TEST key pairs: one for the issuer, one for a payer device.
  2. Builds an allowance certificate and signs it with the issuer key.
  3. Builds 5 receipts (valid, bad signature, counter gap, duplicate counter,
     expired allowance) and signs them with the device key.
  4. Writes everything (public keys only) to test-vectors.json.
  5. Re-checks its own output with a small reference verifier and prints a table.

Every team (Flutter, Go, Java, JS) should write a verifier that reproduces the
"expected" result for each vector.

TEST DATA ONLY. These keys are thrown away after the run. Nothing here is real.

Usage:
  pip install cryptography
  python generate_vectors.py            # refuses to overwrite an existing file
  python generate_vectors.py --force    # overwrite (only for the planned v1.1 revision!)
"""

import base64
import hashlib
import json
import os
import sys
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

OUT_FILE = Path(__file__).parent / "test-vectors.json"

# Fixed times so the file is easy to read. 1797897600 = 2026-12-22 00:00:00 UTC.
BASE_TS = 1797897600
EXPIRY_TS = BASE_TS + 30 * 86400          # allowance valid for 30 days
ZERO_HASH = "0" * 64                      # prevHash of counter 1


# ---------------------------------------------------------------------------
# Canonical JSON + hashing + signing (these are THE rules in README.md)
# ---------------------------------------------------------------------------

def canonical_json(obj: dict) -> bytes:
    """Keys sorted, no whitespace, UTF-8. Numbers here are always plain integers."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def without(obj: dict, field: str) -> dict:
    """Copy of obj without one field (the signature field is never signed)."""
    return {k: v for k, v in obj.items() if k != field}


def digest_hex(obj_without_sig: dict) -> str:
    """SHA-256 of the canonical JSON, as lowercase hex."""
    return hashlib.sha256(canonical_json(obj_without_sig)).hexdigest()


def sign(private_key, obj_without_sig: dict) -> str:
    """ECDSA P-256 over the canonical JSON bytes, SHA-256 applied ONCE.
    The library hashes the message for us, so this equals 'sign SHA-256(canonical JSON)'.
    Result is DER-encoded, then base64."""
    der_sig = private_key.sign(canonical_json(obj_without_sig), ec.ECDSA(hashes.SHA256()))
    return base64.b64encode(der_sig).decode("ascii")


def public_key_b64(private_key) -> str:
    """Public key as DER SubjectPublicKeyInfo, base64."""
    der = private_key.public_key().public_bytes(
        serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return base64.b64encode(der).decode("ascii")


def load_public_key(spki_b64: str):
    return serialization.load_der_public_key(base64.b64decode(spki_b64))


def signature_ok(pub, sig_b64: str, obj_without_sig: dict) -> bool:
    try:
        pub.verify(base64.b64decode(sig_b64), canonical_json(obj_without_sig), ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError):
        return False


# ---------------------------------------------------------------------------
# Reference verifier: returns a result code. Order of checks matters!
# ---------------------------------------------------------------------------

def verify_receipt(receipt, cert, issuer_pub_b64, device_pub_b64, ctx):
    issuer_pub = load_public_key(issuer_pub_b64)
    device_pub = load_public_key(device_pub_b64)

    # 1. Certificate must be genuine and match the device key.
    device_hash = hashlib.sha256(base64.b64decode(device_pub_b64)).hexdigest()
    if not signature_ok(issuer_pub, cert["issuerSignature"], without(cert, "issuerSignature")) \
            or device_hash != cert["deviceKeyHash"] or receipt["allowanceId"] != cert["allowanceId"]:
        return "BAD_CERTIFICATE"
    # 2. Expiry: the receipt time and the verifier's own clock must both be inside the window.
    if receipt["ts"] > cert["expiry"] or ctx["nowTs"] > cert["expiry"]:
        return "ALLOWANCE_EXPIRED"
    # 3. Receipt signature.
    if not signature_ok(device_pub, receipt["sig"], without(receipt, "sig")):
        return "BAD_SIGNATURE"
    # 4. Counter rules. Next counter must be exactly lastAcceptedCounter + 1.
    if receipt["counter"] <= ctx["lastAcceptedCounter"]:
        return "DUPLICATE_COUNTER"
    if receipt["counter"] > ctx["lastAcceptedCounter"] + 1:
        return "COUNTER_GAP"
    # 5. Chain link.
    if receipt["prevHash"] != ctx["lastAcceptedDigest"]:
        return "PREV_HASH_MISMATCH"
    # 6. Limits.
    if receipt["amountPaise"] > cert["perTxCapPaise"]:
        return "OVER_TX_CAP"
    if ctx["spentSoFarPaise"] + receipt["amountPaise"] > cert["ceilingPaise"]:
        return "OVER_CEILING"
    return "OK"


# ---------------------------------------------------------------------------
# Build the vectors
# ---------------------------------------------------------------------------

def make_receipt(device_key, allowance_id, counter, amount, payee, ts, prev_hash):
    """Build a receipt and sign it."""
    body = {
        "allowanceId": allowance_id,
        "counter": counter,
        "amountPaise": amount,
        "payeeId": payee,
        "nonce": os.urandom(16).hex(),   # 32 hex chars
        "ts": ts,
        "prevHash": prev_hash,
    }
    return {**body, "sig": sign(device_key, body)}


def main():
    force = "--force" in sys.argv
    if OUT_FILE.exists() and not force:
        print(f"{OUT_FILE.name} already exists and /contracts is frozen. "
              "Run with --force only for the planned v1.1 revision.")
        sys.exit(1)

    # Two throw-away test keys. Private keys are never written to disk.
    issuer_key = ec.generate_private_key(ec.SECP256R1())
    device_key = ec.generate_private_key(ec.SECP256R1())
    issuer_pub_b64 = public_key_b64(issuer_key)
    device_pub_b64 = public_key_b64(device_key)

    allowance_id = "alw_TEST000001"

    # Allowance certificate, signed by the issuer.
    cert_body = {
        "allowanceId": allowance_id,
        "deviceKeyHash": hashlib.sha256(base64.b64decode(device_pub_b64)).hexdigest(),
        "ceilingPaise": 500000,       # Rs 5,000
        "perTxCapPaise": 100000,      # Rs 1,000
        "expiry": EXPIRY_TS,
        "trustTier": "TIER_1",
        "issuerId": "iss_sim_bank",
    }
    cert = {**cert_body, "issuerSignature": sign(issuer_key, cert_body)}

    # Receipt 1 is already accepted. It is the starting state for all five vectors.
    r1 = make_receipt(device_key, allowance_id, 1, 25000, "mrc_4421", BASE_TS + 60, ZERO_HASH)
    r1_digest = digest_hex(without(r1, "sig"))

    # State the verifier holds before it sees the receipt under test.
    state_after_r1 = {
        "nowTs": BASE_TS + 3600,
        "lastAcceptedCounter": 1,
        "lastAcceptedDigest": r1_digest,
        "spentSoFarPaise": 25000,
    }

    cases = []

    # 1. valid
    v = make_receipt(device_key, allowance_id, 2, 15000, "mrc_4421", BASE_TS + 120, r1_digest)
    cases.append(("valid", "Correct next receipt: counter 2, chained to receipt 1, good signature.", v, state_after_r1, "OK"))

    # 2. bad signature: sign 15000, then change the amount to 95000 afterwards
    t = make_receipt(device_key, allowance_id, 2, 15000, "mrc_4421", BASE_TS + 120, r1_digest)
    t["amountPaise"] = 95000
    cases.append(("bad-signature", "Amount was changed after signing, so the signature no longer matches.", t, state_after_r1, "BAD_SIGNATURE"))

    # 3. counter gap: counter 4 arrives but the last accepted was 1 (2 and 3 missing)
    g = make_receipt(device_key, allowance_id, 4, 10000, "mrc_4421", BASE_TS + 240, r1_digest)
    cases.append(("counter-gap", "Counter jumps from 1 to 4. Counters 2 and 3 are missing.", g, state_after_r1, "COUNTER_GAP"))

    # 4. duplicate counter: a second, different receipt re-using counter 1 (double-spend attempt)
    d = make_receipt(device_key, allowance_id, 1, 25000, "mrc_9908", BASE_TS + 90, ZERO_HASH)
    cases.append(("duplicate-counter", "Counter 1 is already used by receipt 1 (different payee). Double-spend attempt.", d, state_after_r1, "DUPLICATE_COUNTER"))

    # 5. expired allowance: validly signed, but ts is after the certificate expiry
    e_ctx = {**state_after_r1, "nowTs": EXPIRY_TS + 120}
    e = make_receipt(device_key, allowance_id, 2, 15000, "mrc_4421", EXPIRY_TS + 60, r1_digest)
    cases.append(("expired-allowance", "Signature is good, but the receipt time is after the allowance expiry.", e, e_ctx, "ALLOWANCE_EXPIRED"))

    vectors = []
    for vid, desc, receipt, ctx, expected in cases:
        body = without(receipt, "sig")
        vectors.append({
            "id": vid,
            "description": desc,
            "receipt": receipt,
            # What every verifier must reproduce from the receipt fields:
            "canonicalJson": canonical_json(body).decode("utf-8"),
            "digestSha256Hex": hashlib.sha256(canonical_json(body)).hexdigest(),
            "context": ctx,
            "expected": {"valid": expected == "OK", "code": expected},
        })

    out = {
        "version": "1.0",
        "warning": "TEST DATA ONLY. Keys were generated for this file and discarded. Never use in production.",
        "rules": "See contracts/README.md. Check order: certificate, expiry, signature, counter, prevHash, limits.",
        "issuerPublicKeySpkiB64": issuer_pub_b64,
        "devicePublicKeySpkiB64": device_pub_b64,
        "certificate": cert,
        "priorReceipts": [r1],
        "vectors": vectors,
    }
    OUT_FILE.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_FILE}\n")

    # Self-check: run the reference verifier on every vector.
    print(f"{'vector':<20} {'expected':<20} {'got':<20} result")
    all_good = True
    for vec in vectors:
        got = verify_receipt(vec["receipt"], cert, issuer_pub_b64, device_pub_b64, vec["context"])
        ok = got == vec["expected"]["code"]
        all_good &= ok
        print(f"{vec['id']:<20} {vec['expected']['code']:<20} {got:<20} {'PASS' if ok else 'FAIL'}")
    if not all_good:
        sys.exit(2)
    print("\nAll 5 vectors verified.")


if __name__ == "__main__":
    main()
