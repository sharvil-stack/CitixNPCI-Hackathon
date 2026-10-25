import re
import joblib

# ============ 1) Load the saved model (no training here) ============
MODEL_PATH = "scam_model.joblib"
THRESHOLD = 50          # risk score at or above this = "Potential scam"

_model = None
def get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model

# ============ 2) Rules (only used to explain a scam verdict) ============
URL_RE = re.compile(r"https?://\S+|www\.\S+|\b[\w-]+\.(?:com|in|xyz|top|live|site|online|info|cc|net|org|co\.in)\b\S*", re.I)
MONEY_RE = re.compile(r"(₹|rs\.?|inr)\s?[\d,]+|[\d,]+\s?(lakh|crore)|रुपये|रुपए", re.I)
PHONE_RE = re.compile(r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)")

KYC_WORDS = ["kyc", "केवाईसी", "aadhaar", "आधार", "account blocked", "account suspended",
             "account will be blocked", "khata band", "खाता बंद", "verify", "सत्यापित",
             "पुष्टि", "sim will be blocked"]
SENSITIVE_WORDS = ["otp", "ओटीपी", "pin", "पिन", "password", "पासवर्ड", "cvv", "card number"]
REWARD_WORDS = ["won", "winner", "prize", "reward", "cashback", "lottery", "claim", "congratulations",
                "jeeta", "inaam", "जीता", "इनाम", "लॉटरी", "कैशबैक", "refund", "रिफंड"]
URGENCY_WORDS = ["urgent", "immediately", "act now", "last chance", "within 24", "expires today",
                 "will be blocked", "will be cut", "turant", "तुरंत", "abhi", "अभी", "jaldi",
                 "जल्दी", "अंतिम", "limited time", "tonight"]
SEND_MONEY_WORDS = ["send", "bhej", "भेज", "transfer", "paytm", "phonepe", "gpay", "pay now",
                    "fee", "charge", "call", "कॉल"]

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
    if PHONE_RE.search(text) and has_any(text, SEND_MONEY_WORDS):
        flags.append("Asks you to call or pay a phone number")
    return flags

# ============ 3) Text analysis ============
def analyze(text):
    text = (text or "").strip()
    if not text:
        return {"risk_score": 0, "verdict": "No text found", "reasons": [],
                "advice": "Nothing to analyze. Paste a message or upload a clearer screenshot.",
                "is_scam": False}

    score = round(float(get_model().predict_proba([text])[0][1]) * 100)
    is_scam = score >= THRESHOLD

    if is_scam:
        reasons = find_flags(text)      # rules shown only when the model says scam
        advice = ("Do not click any links. Never share your OTP, PIN or password. "
                  "Contact your bank using the number on your card or official app.")
    else:
        reasons = []
        advice = ("This looks normal, but it is not a guarantee. Never share OTP/PIN, "
                  "and double-check anything that asks for money.")

    return {"risk_score": score,
            "verdict": "Potential scam" if is_scam else "Looks legitimate",
            "reasons": reasons, "advice": advice, "is_scam": is_scam}

# ============ 4) Screenshot analysis (OCR) ============
_reader = None
def get_reader():
    global _reader
    if _reader is None:
        import easyocr                              # loads once, first time is slow
        _reader = easyocr.Reader(["en", "hi"])
    return _reader

def extract_text(image):
    """image can be a file path or raw bytes (what Streamlit's uploader gives you)."""
    lines = get_reader().readtext(image, detail=0)
    return "\n".join(lines)

def analyze_image(image):
    text = extract_text(image)
    result = analyze(text)
    result["ocr_text"] = text                       # shown to the user so OCR errors are visible
    return result

# ============ 5) Quick check ============
if __name__ == "__main__":
    print(analyze("Aapka account block ho jayega. Turant KYC update karein: sbi-kyc.live"))
    print(analyze("Your OTP for SBI login is 483921. Do not share it with anyone."))
    # print(analyze_image("screenshot.png"))