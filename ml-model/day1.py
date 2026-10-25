import sys
import pandas as pd
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (precision_score, recall_score, f1_score,
                             average_precision_score, confusion_matrix)

sys.stdout.reconfigure(encoding="utf-8")   # so Hindi prints properly on Windows
pd.set_option("display.max_colwidth", 140)
pd.set_option("display.width", 200)

# ---------- 1) Load data ----------
train = pd.read_csv("train.csv")
val = pd.read_csv("val.csv")

X_train, y_train = train["text"], train["label"]   # model input and answer
X_val, y_val = val["text"], val["label"]
print("Train rows:", len(train), " Val rows:", len(val))

# ---------- 2) Build two models ----------
# This pattern keeps whole Hindi words together (the default one splits them)
WORD_PATTERN = r"(?u)[\w\u0900-\u097F]+"

# Model A: TF-IDF on words + Logistic Regression
word_vec = TfidfVectorizer(token_pattern=WORD_PATTERN, ngram_range=(1, 2), min_df=2)
model_a = Pipeline([
    ("tfidf", word_vec),
    # class_weight="balanced" = pay more attention to the smaller class (legit)
    ("clf", LogisticRegression(class_weight="balanced", max_iter=1000)),
])

# Model B: words + character pieces (helps with spellings like aapka/apka/aapkaa)
model_b = Pipeline([
    ("tfidf", FeatureUnion([
        ("word", TfidfVectorizer(token_pattern=WORD_PATTERN, ngram_range=(1, 2), min_df=2)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2)),
    ])),
    ("clf", LogisticRegression(class_weight="balanced", max_iter=1000)),
])

# ---------- 3) Train and check both on val ----------
def evaluate(name, model):
    model.fit(X_train, y_train)                    # learn from train
    pred = model.predict(X_val)                    # predict 0 or 1
    prob = model.predict_proba(X_val)[:, 1]        # scam score between 0 and 1
    print("\n" + "=" * 60)
    print(name)
    print("=" * 60)
    print("Precision:", round(precision_score(y_val, pred), 4),
          "(of messages flagged scam, how many really were)")
    print("Recall:   ", round(recall_score(y_val, pred), 4),
          "(of real scams, how many we caught)")
    print("F1:       ", round(f1_score(y_val, pred), 4))
    print("PR-AUC:   ", round(average_precision_score(y_val, prob), 4))
    print("Confusion matrix (rows = real, cols = predicted):")
    print("           pred_legit  pred_scam")
    cm = confusion_matrix(y_val, pred)
    print("real_legit", cm[0])
    print("real_scam ", cm[1])
    return pred

pred_a = evaluate("MODEL A: word TF-IDF + LogReg", model_a)
pred_b = evaluate("MODEL B: word + char TF-IDF + LogReg", model_b)

# Pick the model with the better F1 for the rest of the analysis
best_name, best_model, best_pred = (
    ("A", model_a, pred_a) if f1_score(y_val, pred_a) >= f1_score(y_val, pred_b)
    else ("B", model_b, pred_b))
print("\nBetter model on val (by F1): Model", best_name)

# ---------- 4) Scores by language and by category ----------
val = val.copy()
val["pred"] = best_pred
val["correct"] = (val["pred"] == val["label"])

print("\nAccuracy by language (ignore 'twin', it is not a language):")
print(val.groupby("lang")["correct"].agg(["mean", "count"]).round(3))

print("\nAccuracy by category (the legit ones are the important check):")
print(val.groupby("category")["correct"].agg(["mean", "count"]).round(3))

print("\nLegit messages wrongly flagged as scam, by category:")
wrong_legit = val[(val["label"] == 0) & (val["pred"] == 1)]
print(wrong_legit["category"].value_counts() if len(wrong_legit) else "none")

# ---------- 5) What did the model learn? (from Model A, easy to read) ----------
model_a.fit(X_train, y_train)
words = model_a.named_steps["tfidf"].get_feature_names_out()
coefs = model_a.named_steps["clf"].coef_[0]    # positive = scam, negative = legit
coef_df = pd.DataFrame({"word": words, "weight": coefs}).sort_values("weight")

print("\nTop 15 words pointing to SCAM:")
print(coef_df.tail(15).iloc[::-1].to_string(index=False))
print("\nTop 15 words pointing to LEGIT:")
print(coef_df.head(15).to_string(index=False))

# ---------- 6) Read the mistakes ----------
mistakes = val[val["correct"] == False]
print("\n" + "=" * 60)
print(f"MISTAKES: {len(mistakes)} out of {len(val)}")
print("=" * 60)
for _, row in mistakes.head(25).iterrows():
    real = "SCAM" if row["label"] == 1 else "LEGIT"
    guess = "SCAM" if row["pred"] == 1 else "LEGIT"
    print(f"[real={real} | model said={guess} | {row['category']}] {row['text'][:150]}")