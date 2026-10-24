from .common import L

ERRORS = {
    "bad_allocation_keys": L("Please fill in every category.", "कृपया हर श्रेणी भरें।"),
    "not_whole_number": L("{category}: enter a whole number.", "{category}: पूरी संख्या लिखें।"),
    "negative": L("{category} cannot be negative.", "{category} ऋणात्मक नहीं हो सकता।"),
    "below_minimum": L("{category} must be at least {minimum}.", "{category} कम से कम {minimum} होना चाहिए।"),
    "total_mismatch": L("The total must be exactly {income}. Right now it is {total}.",
                        "कुल रकम ठीक {income} होनी चाहिए। अभी यह {total} है।"),
    "unaffordable": L("You cannot afford this choice right now.", "अभी आप यह विकल्प नहीं चुन सकते।"),
    "already_handled": L("This event was already handled.", "यह घटना पहले ही निपट चुकी है।"),
    "unknown_choice": L("That choice is not available.", "यह विकल्प उपलब्ध नहीं है।"),
    "bad_decision": L("That decision is not valid.", "यह फ़ैसला सही नहीं है।"),
    "too_many_decisions": L("The simulation has only 3 rounds.", "सिमुलेशन में सिर्फ़ 3 राउंड हैं।"),
    "wrong_decision_type": L("That decision does not fit this round.", "यह फ़ैसला इस राउंड के लिए सही नहीं है।"),
}

REASONS = {
    "not_enough_savings": L("Not enough savings (you have {have}).", "बचत काफ़ी नहीं है (आपके पास {have} हैं)।"),
    "not_enough_other": L("Not enough other-spending money ({have} available).",
                          "अन्य खर्च का पैसा काफ़ी नहीं है ({have} उपलब्ध)।"),
    "not_enough_money": L("Cash and savings together are not enough ({have}).",
                          "नकद और बचत मिलाकर भी काफ़ी नहीं हैं ({have})।"),
}

# Budget findings -----------------------------------------------------------------------
BUDGET_WELL = {
    "bills_paid": L("You paid all your essential bills.", "आपने अपने सभी ज़रूरी बिल चुकाए।"),
    "no_debt": L("You avoided borrowing.", "आप उधार लेने से बचे।"),
    "reserve_ok": L("You still have {savings} in savings as a safety net.",
                    "सुरक्षा के लिए आपके पास अभी {savings} की बचत है।"),
    "saved_regularly": L("You set aside {amount} this month for savings.",
                         "आपने इस महीने बचत के लिए {amount} अलग रखे।"),
}
BUDGET_IMPROVE = {
    "reserve_zero": L("You have no savings left, so another surprise cost would be hard to cover.",
                      "आपकी बचत खत्म हो गई है, इसलिए अगला अचानक खर्च संभालना मुश्किल होगा।"),
    "reserve_low": L("Your savings ({savings}) are below the {target} safety target. Plan to rebuild them.",
                     "आपकी बचत ({savings}) {target} के सुरक्षा लक्ष्य से कम है। इसे दोबारा बनाने की योजना बनाएँ।"),
    "debt_due": L("You owe {repay} next month ({debt} plus 12% interest). That is {pct}% of your flexible money.",
                  "अगले महीने आपको {repay} चुकाने होंगे ({debt} और 12% ब्याज)। यह आपके लचीले पैसे का {pct}% है।"),
    "unpaid_bill": L("A bill of {unpaid} is unpaid, and a {fee} late fee applies.",
                     "{unpaid} का बिल बकाया है और {fee} की लेट फ़ीस लगेगी।"),
    "low_saving_plan": L("You planned to save only {amount}. Try to save at least 10% of income.",
                         "आपने सिर्फ़ {amount} बचाने की योजना बनाई। आमदनी का कम से कम 10% बचाने की कोशिश करें।"),
    "no_cash": L("You have no cash left for the rest of the month.",
                 "महीने के बाकी दिनों के लिए आपके पास नकद नहीं बचा।"),
}
BUDGET_TIPS = {
    "tip_delay": L("Paying the bill on time would have avoided the {fee} late fee.",
                   "बिल समय पर चुकाने से {fee} की लेट फ़ीस बच जाती।"),
    "tip_borrow": L("Using savings or trimming other spending would have saved the {interest} interest.",
                    "बचत इस्तेमाल करने या अन्य खर्च घटाने से {interest} का ब्याज बच जाता।"),
    "tip_savings": L("Using savings was fair. Now rebuild them by saving a fixed amount every month.",
                     "बचत इस्तेमाल करना ठीक था। अब हर महीने तय रकम बचाकर इसे दोबारा बनाएँ।"),
    "tip_default": L("Keep a small emergency fund so unexpected costs don't force you to borrow.",
                     "एक छोटा आपातकालीन फंड रखें ताकि अचानक खर्च पर उधार न लेना पड़े।"),
}
BUDGET_BANDS = {
    "high": {"headline": L("You managed it well", "आपने अच्छा संभाला"),
             "summary": L("Your essential bills were covered and your finances stayed steady.",
                          "आपके ज़रूरी बिल चुक गए और आपके पैसे स्थिर रहे।")},
    "mid": {"headline": L("You got through, with some risks", "आप संभल गए, पर कुछ जोखिम हैं"),
            "summary": L("You covered the emergency, but some risks remain.",
                         "आपने आपात खर्च संभाला, पर कुछ जोखिम बाकी हैं।")},
    "low": {"headline": L("A tough month. Let's learn from it", "मुश्किल महीना रहा। आइए इससे सीखें"),
            "summary": L("Your money was stretched thin. Check the tips below.",
                         "आपके पैसे पर बहुत दबाव रहा। नीचे दिए सुझाव देखें।")},
}
BUDGET_SNAPSHOT = [
    {"id": "cash", "label": L("Cash balance", "नकद शेष")},
    {"id": "savings", "label": L("Savings remaining", "बची हुई बचत")},
    {"id": "debt", "label": L("Outstanding debt", "बकाया कर्ज़")},
    {"id": "unpaid", "label": L("Unpaid expenses", "बकाया खर्च")},
    {"id": "due", "label": L("Due next month", "अगले महीने देय")},
]

# Scenario (UPI / Banking) findings ---------------------------------------------------------
SC_WELL = {
    "no_loss": L("You did not lose any money to fraud.", "धोखाधड़ी में आपका कोई पैसा नहीं गया।"),
    "no_risky": L("You avoided risky actions.", "आपने जोखिम भरे काम नहीं किए।"),
    "no_fees": L("You paid no extra charges.", "आपने कोई अतिरिक्त शुल्क नहीं दिया।"),
    "good_many": L("You made {n} of {total} safest choices.", "आपने {total} में से {n} सबसे सुरक्षित फ़ैसले लिए।"),
}
SC_IMPROVE = {
    "loss": L("You lost {lost} to fraud.", "धोखाधड़ी में आपके {lost} चले गए।"),
    "risky": L("You took {n} risky action(s) that put your money at risk.",
               "आपने {n} जोखिम भरे काम किए जिनसे आपका पैसा खतरे में पड़ा।"),
    "fees": L("You paid {fees} in charges that could be avoided.", "आपने {fees} का ऐसा शुल्क दिया जिससे बचा जा सकता था।"),
    "not_all_good": L("A safer option was available in {n} round(s).", "{n} राउंड में ज़्यादा सुरक्षित विकल्प मौजूद था।"),
}

HISTORY_ROUND = L("Round {n}", "राउंड {n}")
