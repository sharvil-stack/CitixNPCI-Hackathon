import json, re, sys
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")
pd.set_option("display.max_colwidth", 120)
pd.set_option("display.width", 200)

FILE = "eval_set.jsonl"   # <- your combined file

# ---------- 1) Read the file ----------
rows, bad_lines, all_keys = [], 0, set()
for i, line in enumerate(open(FILE, encoding="utf-8")):
    line = line.strip()
    if not line:
        continue
    try:
        d = json.loads(line)
        all_keys.update(d.keys())

        user = d["messages"][1]["content"]            # "sender: ...\nmessage: ..."
        sender = user.split("\n")[0].replace("sender:", "").strip()
        text = user.split("message:", 1)[1].strip()

        answer = json.loads(d["messages"][2]["content"])   # the JSON the model answers with
        rows.append({
            "text": text,
            "sender": sender,
            "verdict": d.get("verdict"),
            "category": d.get("category"),
            "bucket": d.get("_bucket"),
            "scam_type": answer.get("scam_type"),
            "risk": answer.get("risk"),
        })
    except Exception as e:
        bad_lines += 1
        print(f"Could not read line {i}: {e}")

df = pd.DataFrame(rows)
print("Keys found in the file:", sorted(all_keys))
print("Lines that failed to read:", bad_lines)

# ---------- 2) Overview ----------
print("\n" + "=" * 60)
print("OVERVIEW")
print("=" * 60)
print("Rows, columns:", df.shape)
print("Column names:", list(df.columns))
print("\nMissing values:\n", df.isna().sum())

# ---------- 3) Each column ----------
print("\n" + "=" * 60)
print("EACH COLUMN")
print("=" * 60)
for col in ["verdict", "category", "scam_type"]:
    print(f"\n--- {col} ---")
    print(df[col].value_counts(dropna=False))

print("\n--- risk (0-100) ---")
print(df["risk"].describe())

print("\n--- bucket (first 15 kinds) ---")
print(df["bucket"].value_counts().head(15))
if df["bucket"].notna().any():
    df["lang_tag"] = df["bucket"].str.split("|").str[-1]
    print("\nLast part of bucket (probably language/type):")
    print(df["lang_tag"].value_counts())

print("\n--- sender ---")
print("Unique senders:", df["sender"].nunique())
print(df["sender"].value_counts().head(10))

# ---------- 4) Text checks ----------
print("\n" + "=" * 60)
print("TEXT CHECKS")
print("=" * 60)
df["length"] = df["text"].str.len()
print("Text length (characters):\n", df["length"].describe())
print("\nAverage length by verdict:\n", df.groupby("verdict")["length"].mean().round(1))

def clean_key(s):
    s = s.lower()
    s = re.sub(r"\d", "0", s)          # all digits become 0
    return re.sub(r"\s+", " ", s).strip()

df["key"] = df["text"].map(clean_key)
print("\nExact duplicate texts:", df["text"].duplicated().sum())
print("Duplicates after ignoring numbers/case:", df["key"].duplicated().sum())

conflict = df.groupby("key")["verdict"].nunique()
print("Same text with different verdicts:", int((conflict > 1).sum()))

# ---------- 5) Samples ----------
print("\n" + "=" * 60)
print("RANDOM SAMPLES (read these with your own eyes)")
print("=" * 60)
for v in df["verdict"].dropna().unique():
    print(f"\n--- 8 samples where verdict = {v} ---")
    for t in df[df["verdict"] == v]["text"].sample(min(8, (df["verdict"] == v).sum()), random_state=1):
        print("  -", t[:160].replace("\n", " "))

print("\n--- the last 10 rows of the file (probably your 700 new ones) ---")
for t in df["text"].tail(10):
    print("  -", t[:160].replace("\n", " "))