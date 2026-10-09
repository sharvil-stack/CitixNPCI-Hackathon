
import json, re, sys
import pandas as pd
from sklearn.model_selection import train_test_split

sys.stdout.reconfigure(encoding="utf-8")
FILE = "eval_set.jsonl"   # your combined file

def clean_key(s):
    s = s.lower()
    s = re.sub(r"https?://\S+|www\.\S+", " url ", s)
    s = re.sub(r"\d", "0", s)
    return re.sub(r"\s+", " ", s).strip()

# 1) read
rows = []
for line in open(FILE, encoding="utf-8"):
    if not line.strip():
        continue
    d = json.loads(line)
    user = d["messages"][1]["content"]
    text = user.split("message:", 1)[1].strip()
    answer = json.loads(d["messages"][2]["content"])
    rows.append({"text": text, "verdict": d["verdict"], "category": d["category"],
                 "scam_type": answer.get("scam_type"),
                 "lang": d["_bucket"].split("|")[-1]})
df = pd.DataFrame(rows)
df = df[df["lang"] != "twin"]
print("Start:", len(df))

# 2) drop 'suspicious', make label
df = df[df["verdict"] != "suspicious"].copy()
df["label"] = (df["verdict"] == "dangerous").astype(int)
print("After dropping suspicious:", len(df))

# 3) drop texts that have both labels
df["key"] = df["text"].map(clean_key)
both = df.groupby("key")["label"].nunique()
conflicts = both[both > 1].index
df = df[~df["key"].isin(conflicts)]
print("Conflicting texts removed:", len(conflicts))

# 4) drop duplicates
n = len(df)
df = df.drop_duplicates("key")
print("Duplicates removed:", n - len(df))

df = df[["text", "label", "lang", "category", "scam_type"]].reset_index(drop=True)
print("\nFINAL ROWS:", len(df))
print("\nLabel counts:\n", df["label"].value_counts())
print("\nLabel by language:\n", pd.crosstab(df["lang"], df["label"]))
print("\nSafe messages by category:\n", df[df["label"] == 0]["category"].value_counts())

# 5) split 70 / 15 / 15, same label ratio in each part
train, rest = train_test_split(df, test_size=0.30, stratify=df["label"], random_state=42)
val, test = train_test_split(rest, test_size=0.50, stratify=rest["label"], random_state=42)

df = df[df["lang"] != "twin"]

df.to_csv("master.csv", index=False, encoding="utf-8")
train.to_csv("train.csv", index=False, encoding="utf-8")
val.to_csv("val.csv", index=False, encoding="utf-8")
test.to_csv("test.csv", index=False, encoding="utf-8")
print("\nSaved -> train:", len(train), " val:", len(val), " test:", len(test))