"""Checks test-vectors.json against the Finora receipt rules.
Run:  python verify_vectors.py
Needs: pip install cryptography
Optional: pip install jsonschema  (also checks the JSON schemas)
"""
import base64, hashlib, json, sys
from pathlib import Path
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.exceptions import InvalidSignature

HERE = Path(__file__).parent

def canonical(obj, drop):
    d = {k: v for k, v in obj.items() if k != drop}
    return json.dumps(d, sort_keys=True, separators=(",", ":"), ensure_ascii=True)

def load_pub(b64):
    return serialization.load_der_public_key(base64.b64decode(b64))

def sig_ok(pub, sig_b64, text):
    try:
        pub.verify(base64.b64decode(sig_b64), text.encode(), ec.ECDSA(hashes.SHA256()))
        return True
    except InvalidSignature:
        return False

def verify(doc, v):
    cert, r, ctx = doc["certificate"], v["receipt"], v["context"]
    issuer = load_pub(doc["issuerPublicKeySpkiB64"])
    device = load_pub(doc["devicePublicKeySpkiB64"])
    # 1 certificate
    if not sig_ok(issuer, cert["issuerSignature"], canonical(cert, "issuerSignature")):
        return "BAD_CERTIFICATE"
    spki = base64.b64decode(doc["devicePublicKeySpkiB64"])
    if hashlib.sha256(spki).hexdigest() != cert["deviceKeyHash"]:
        return "BAD_CERTIFICATE"
    if r["allowanceId"] != cert["allowanceId"]:
        return "BAD_CERTIFICATE"
    # 2 expiry
    if r["ts"] > cert["expiry"] or ctx["nowTs"] > cert["expiry"]:
        return "ALLOWANCE_EXPIRED"
    # 3 signature
    if not sig_ok(device, r["sig"], canonical(r, "sig")):
        return "BAD_SIGNATURE"
    # 4 counter
    last = ctx["lastAcceptedCounter"]
    if r["counter"] <= last:
        return "DUPLICATE_COUNTER"
    if r["counter"] > last + 1:
        return "COUNTER_GAP"
    # 5 prevHash
    if r["prevHash"] != ctx["lastAcceptedDigest"]:
        return "PREV_HASH_MISMATCH"
    # 6 limits
    if r["amountPaise"] > cert["perTxCapPaise"]:
        return "OVER_TX_CAP"
    if ctx["spentSoFarPaise"] + r["amountPaise"] > cert["ceilingPaise"]:
        return "OVER_CEILING"
    return "OK"

def main():
    doc = json.loads((HERE / "test-vectors.json").read_text())
    bad = 0
    # extra: prior receipt digest must equal the "lastAcceptedDigest" used by the vectors
    prior = doc["priorReceipts"][0]
    prior_digest = hashlib.sha256(canonical(prior, "sig").encode()).hexdigest()
    print(f"prior receipt digest: {prior_digest}")
    for v in doc["vectors"]:
        canon = canonical(v["receipt"], "sig")
        digest_ok = hashlib.sha256(canon.encode()).hexdigest() == v["digestSha256Hex"]
        canon_ok = canon == v["canonicalJson"]
        got = verify(doc, v)
        exp = v["expected"]["code"]
        ok = got == exp and digest_ok and canon_ok
        bad += not ok
        print(f"{v['id']:20} {exp:18} {got:18} canon={'ok' if canon_ok else 'DIFF'} digest={'ok' if digest_ok else 'DIFF'}  {'PASS' if ok else 'FAIL'}")
    if prior_digest != doc["vectors"][0]["context"]["lastAcceptedDigest"]:
        print("WARNING: prior receipt digest != lastAcceptedDigest in context"); bad += 1
    try:
        import jsonschema
        rs = json.loads((HERE / "receipt.schema.json").read_text())
        for rec in [prior] + [v["receipt"] for v in doc["vectors"]]:
            jsonschema.validate(rec, rs)
        cs = json.loads((HERE / "allowance-cert.schema.json").read_text())
        jsonschema.validate(doc["certificate"], cs)
        print("JSON schemas: all receipts + certificate valid")
    except ImportError:
        print("(jsonschema not installed, schema check skipped)")
    print("\nAll vectors verified." if not bad else f"\n{bad} problem(s) found.")
    sys.exit(1 if bad else 0)

main()
