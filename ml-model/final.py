import re, sys, joblib
import pandas as pd
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (precision_score, recall_score, f1_score,
                             average_precision_score, confusion_matrix)

sys.stdout.reconfigure(encoding="utf-8")

# ---------- 1) Model B ----------
WORD_PATTERN = r"(?u)[\w\u0900-\u097F]+"

def build_model():
    return Pipeline([
        ("tfidf", FeatureUnion([
            ("word", TfidfVectorizer(token_pattern=WORD_PATTERN, ngram_range=(1, 2), min_df=2)),
            ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=2)),
        ])),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000)),
    ])

train = pd.read_csv("train.csv")
val = pd.read_csv("val.csv")
test = pd.read_csv("test.csv")

# Honest score: train on train+val, test ONCE
model = build_model()
tv = pd.concat([train, val])
model.fit(tv["text"], tv["label"])
pred = model.predict(test["text"])
prob = model.predict_proba(test["text"])[:, 1]
cm = confusion_matrix(test["label"], pred)
print("FINAL TEST RESULT (Model B)")
print("Precision:", round(precision_score(test["label"], pred), 4))
print("Recall:   ", round(recall_score(test["label"], pred), 4))
print("F1:       ", round(f1_score(test["label"], pred), 4))
print("PR-AUC:   ", round(average_precision_score(test["label"], prob), 4))
print("False alarms:", cm[0][1], "| Missed scams:", cm[1][0])

# Now retrain on everything for the app and save it
final_model = build_model()
everything = pd.concat([train, val, test])
final_model.fit(everything["text"], everything["label"])
joblib.dump(final_model, "scam_model.joblib")
print("\nSaved scam_model.joblib")

# ---------- 2) Rule engine ----------
URL_RE = re.compile(r"https?://\S+|www\.\S+|\b[\w-]+\.(?:com|in|xyz|top|live|site|online|info|cc|net|org|co\.in)\b\S*", re.I)
MONEY_RE = re.compile(r"(₹|rs\.?|inr)\s?[\d,]+|[\d,]+\s?(lakh|crore)|रुपये|रुपए", re.I)
PHONE_RE = re.compile(r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)")

KYC_WORDS = ["kyc", "केवाईसी", "aadhaar", "आधार", "pan ", "account blocked", "account suspended",
             "account will be blocked", "khata band", "खाता बंद", "verify", "सत्यापित", "पुष्टि", "sim will be blocked"]
SENSITIVE_WORDS = ["otp", "ओटीपी", "pin", "पिन", "password", "पासवर्ड", "cvv", "card number", "upi pin"]
REWARD_WORDS = ["won", "winner", "prize", "reward", "cashback", "lottery", "claim", "congratulations",
                "jeeta", "inaam", "जीता", "इनाम", "लॉटरी", "कैशबैक", "refund", "रिफंड"]
URGENCY_WORDS = ["urgent", "immediately", "act now", "last chance", "within 24", "expires today",
                 "will be blocked", "will be cut", "turant", "तुरंत", "abhi", "अभी", "jaldi", "जल्दी",
                 "foran", "अंतिम", "limited time", "tonight"]
SEND_MONEY_WORDS = ["send", "bhej", "भेज", "transfer", "paytm", "phonepe", "gpay", "pay now", "fee", "charge"]

def has_any(text, words):
    t = text.lower()
    return any(w in t for w in words)

def find_flags(text):
    flags = []
    if URL_RE.search(text):
        flags.append("External link in the message")
    if has_any(text, KYC_WORDS):
        flags.append("Account / KYC verification request")
    if has_any(text, SENSITIVE_WORDS):
        flags.append("Mentions OTP / PIN / password")
    if MONEY_RE.search(text) and has_any(text, REWARD_WORDS):
        flags.append("Unexpected money / reward claim")
    if has_any(text, URGENCY_WORDS):
        flags.append("Urgent or threatening language")
    if PHONE_RE.search(text) and has_any(text, SEND_MONEY_WORDS + ["call", "कॉल"]):
        flags.append("Asks you to call or pay a phone number")
    return flags

# ---------- 3) The function your app will call ----------
_model = None
def analyze(text):
    global _model
    if _model is None:
        _model = joblib.load("scam_model.joblib")
    score = round(float(_model.predict_proba([text])[0][1]) * 100)
    is_scam = score >= 50
    result = {"risk_score": score, "verdict": "Potential scam" if is_scam else "Looks legitimate",
              "reasons": [], "advice": ""}
    if is_scam:
        result["reasons"] = find_flags(text)      # rules only shown when the model says scam
        result["advice"] = "Do not click links. Never share OTP, PIN or password. Contact your bank using the number on your card."
    else:
        result["advice"] = ("Looks normal, but this is not a guarantee. "
                            "Never share OTP/PIN, and verify anything asking for money.")
    return result

# ---------- 4) Screenshot input (OCR) ----------
_reader = None
def analyze_image(path):
    global _reader
    import easyocr                                   # pip install easyocr
    if _reader is None:
        _reader = easyocr.Reader(["en", "hi"])       # first run downloads models
    text = " ".join(_reader.readtext(path, detail=0))
    result = analyze(text)
    result["ocr_text"] = text                        # show this so errors are visible
    return result

# ---------- 5) Quick demo ----------
if __name__ == "__main__":
    demos = [
        "Congratulations! Aapne ₹1,00,000 jeeta hai. KYC complete karein immediately: https://xyz-claim.top/verify",
        "Your OTP for SBI login is 483921. Do not share it with anyone.",
        "SBI: ₹2,500 debited from a/c XX1234. Avl bal ₹14,200. Call 1800-1234 if not you.",
        "Aapka account block ho jayega. Turant KYC update karein: sbi-kyc.live",
        "Mummy, main aaj shaam 8 baje ghar aa jaunga.",
    ]
    for d in demos:
        print("\n" + "-" * 60)
        print(d)
        print(analyze(d))
