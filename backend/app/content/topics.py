from .common import L

# icon = lucide-react icon name, image = file in frontend/public/images (without .jpg)
TOPICS = [
    {"id": "saving", "active": True, "icon": "BarChart3", "image": "topic-saving",
     "title": L("Saving and Budgeting", "बचत और बजट"),
     "desc": L("Plan your money, handle expenses and build savings.",
               "अपने पैसे की योजना बनाएँ, खर्चे संभालें और बचत करें।"),
     "intro": L("Learn how to manage your income, plan your expenses and build a safety net for the future.",
                "अपनी आमदनी संभालना, खर्च की योजना बनाना और भविष्य के लिए सुरक्षा कवच बनाना सीखें।")},
    {"id": "upi", "active": True, "icon": "ShieldCheck", "image": "topic-upi",
     "title": L("UPI and Fraud Prevention", "UPI और धोखाधड़ी से बचाव"),
     "desc": L("Stay safe while making digital payments.", "डिजिटल पेमेंट करते समय सुरक्षित रहें।"),
     "intro": L("Learn how UPI works, how scammers trick people and what to do if something goes wrong.",
                "जानें UPI कैसे काम करता है, ठग लोगों को कैसे फँसाते हैं और गड़बड़ होने पर क्या करें।")},
    {"id": "banking", "active": True, "icon": "Landmark", "image": "topic-banking",
     "title": L("Banking Basics", "बैंकिंग की बुनियादी बातें"),
     "desc": L("Understand accounts, cards and common services.", "खाते, कार्ड और आम सेवाओं को समझें।"),
     "intro": L("Understand bank accounts, cards, statements and charges so you can bank with confidence.",
                "बैंक खाते, कार्ड, स्टेटमेंट और शुल्क समझें ताकि आप भरोसे से बैंकिंग कर सकें।")},
    {"id": "loans", "active": False, "icon": "FileText", "image": "locked-loans",
     "title": L("Loans and Interest", "लोन और ब्याज"),
     "desc": L("Learn about loans, EMIs and interest.", "लोन, EMI और ब्याज के बारे में जानें।"),
     "intro": L("", "")},
    {"id": "insurance", "active": False, "icon": "ShieldCheck", "image": "locked-insurance",
     "title": L("Insurance and Emergencies", "बीमा और आपात स्थिति"),
     "desc": L("Protect yourself and your family from unexpected costs.",
               "अचानक आने वाले खर्चों से खुद को और परिवार को बचाएँ।"),
     "intro": L("", "")},
    {"id": "schemes", "active": False, "icon": "Landmark", "image": "locked-schemes",
     "title": L("Government Schemes and Financial Rights", "सरकारी योजनाएँ और वित्तीय अधिकार"),
     "desc": L("Find schemes you may be eligible for and know your rights.",
               "जानें किन योजनाओं के लिए आप पात्र हो सकते हैं और अपने अधिकार समझें।"),
     "intro": L("", "")},
]

TOPIC_BY_ID = {t["id"]: t for t in TOPICS}
ACTIVE_IDS = [t["id"] for t in TOPICS if t["active"]]
