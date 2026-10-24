from .common import L

STEPS = [L("Plan budget", "बजट बनाएँ"), L("Unexpected expense", "अचानक खर्च"), L("Next decision", "अगला फ़ैसला")]

CATEGORIES = {
    "housing": {"label": L("Housing", "मकान"), "hint": L("rent, home expenses", "किराया, घर का खर्च"),
                "kind": "essential", "color": "#e0904a"},
    "food": {"label": L("Food", "खाना"), "hint": L("groceries, daily needs", "राशन, रोज़ की ज़रूरतें"),
             "kind": "essential", "color": "#3fcf8e"},
    "bills": {"label": L("Bills and transport", "बिल और यात्रा"), "hint": L("electricity, travel", "बिजली, आना-जाना"),
              "kind": "essential", "color": "#5b9bd5"},
    "other": {"label": L("Other spending", "अन्य खर्च"), "hint": L("shopping, leisure", "खरीदारी, मनोरंजन"),
              "kind": "flexible", "color": "#9b7fd1"},
    "savings": {"label": L("Savings", "बचत"), "hint": L("for future or emergencies", "भविष्य या आपात स्थिति के लिए"),
                "kind": "savings", "color": "#4cc98f"},
}

ROUND1 = {
    "title": L("Plan your monthly budget", "अपना मासिक बजट बनाएँ"),
    "description": L("You have a monthly income of {income}. Allocate it across different categories. The total must be {income}.",
                     "आपकी मासिक आमदनी {income} है। इसे अलग-अलग श्रेणियों में बाँटें। कुल जोड़ {income} होना चाहिए।"),
    "note": L("Housing, food and bills are needs (essential). Other spending is flexible. Savings are for emergencies and the future. Rent, food and bills have a minimum.",
              "मकान, खाना और बिल ज़रूरतें (अनिवार्य) हैं। अन्य खर्च लचीला है। बचत आपात स्थिति और भविष्य के लिए है। किराया, खाना और बिल की एक न्यूनतम रकम है।"),
}

ROUND2 = {
    "title": L("An unexpected expense", "एक अचानक खर्च"),
    "description": L("A family member needs medical treatment and you have an unexpected expense of {amount}. What will you do?",
                    "परिवार के किसी सदस्य को इलाज की ज़रूरत है और आपके सामने {amount} का अचानक खर्च आ गया है। आप क्या करेंगे?"),
    "event": L("Medical expense", "इलाज का खर्च"),
    "image": "sim-medical",
    "choices": {
        "savings": {"label": L("Use savings", "बचत इस्तेमाल करें"),
                    "description": L("Pay from your existing savings", "अपनी मौजूदा बचत से भुगतान करें")},
        "reduce": {"label": L("Reduce non-essential spending", "गैर-ज़रूरी खर्च घटाएँ"),
                   "description": L("Cut down on other expenses this month", "इस महीने अन्य खर्चों में कटौती करें")},
        "borrow": {"label": L("Borrow money", "उधार लें"),
                   "description": L("Take a short-term loan with 12% interest", "12% ब्याज पर अल्पकालिक कर्ज़ लें")},
    },
}

ROUND3 = {
    "title": L("A follow-up decision", "अगला फ़ैसला"),
    "description": L("Your electricity bill is higher than expected this month. You need to pay an extra {amount}. How will you handle this?",
                     "इस महीने आपका बिजली का बिल उम्मीद से ज़्यादा आया है। आपको {amount} अतिरिक्त चुकाने हैं। आप इसे कैसे संभालेंगे?"),
    "event": L("Electricity bill", "बिजली का बिल"),
    "image": "sim-bill",
    "notes": {
        "low_cash": L("Your cash is low ({cash}).", "आपका नकद कम है ({cash})।"),
        "has_debt": L("You also owe {repay} next month.", "अगले महीने आपको {repay} भी चुकाने हैं।"),
    },
    "choices": {
        "pay_now": {"label": L("Pay now from available cash", "उपलब्ध नकद से अभी भुगतान करें"),
                    "description": L("Keep up with essential bills (uses savings if cash runs short)",
                                    "ज़रूरी बिल समय पर भरें (नकद कम पड़े तो बचत इस्तेमाल होगी)")},
        "delay": {"label": L("Delay payment", "भुगतान टालें"),
                  "description": L("Pay next month (may include a late fee)", "अगले महीने भरें (लेट फ़ीस लग सकती है)")},
        "reduce_spending": {"label": L("Reduce other spending", "अन्य खर्च घटाएँ"),
                            "description": L("Adjust your non-essential expenses", "अपने गैर-ज़रूरी खर्च कम करें")},
    },
}

OUTCOMES = {
    2: {
        "savings": L("You paid {amount} from your savings.", "आपने बचत से {amount} चुकाए।"),
        "reduce": L("You paid {amount} by cutting other spending.", "आपने अन्य खर्च घटाकर {amount} चुकाए।"),
        "borrow": L("You borrowed {principal} and must repay {repay} next month (including {interest} interest).",
                    "आपने {principal} उधार लिए और अगले महीने {repay} चुकाने होंगे ({interest} ब्याज सहित)।"),
    },
    3: {
        "pay_now": L("You paid the bill: {from_cash} from cash and {from_savings} from savings.",
                     "आपने बिल चुकाया: {from_cash} नकद से और {from_savings} बचत से।"),
        "delay": L("You delayed the bill. It stays unpaid and a {fee} late fee is added to next month.",
                   "आपने बिल टाल दिया। वह बकाया रहेगा और अगले महीने {fee} की लेट फ़ीस जुड़ेगी।"),
        "reduce_spending": L("You paid the bill by cutting other spending.", "आपने अन्य खर्च घटाकर बिल चुकाया।"),
    },
}
ALLOCATION_OUTCOME = L("You planned: housing {housing}, food {food}, bills {bills}, other {other}, savings {savings}.",
                       "आपकी योजना: मकान {housing}, खाना {food}, बिल {bills}, अन्य {other}, बचत {savings}।")
STATUS = {"cash": L("Cash", "नकद"), "savings": L("Savings", "बचत"), "debt": L("Debt", "कर्ज़")}
