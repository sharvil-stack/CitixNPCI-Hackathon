import os, re, time, base64
import html as html_lib
import streamlit as st
import streamlit.components.v1 as components

os.chdir(os.path.dirname(os.path.abspath(__file__)))   # so scam_model.joblib and imgg.png are found
import scam_core

st.set_page_config(page_title="Scam Message Checker", page_icon="🛡️", layout="wide",
                   initial_sidebar_state="collapsed")

# ---------------- text in 3 languages ----------------
EN = dict(
    title1="Is this message", title2="safe or ", accent="a scam?",
    sub="Paste a message or upload a screenshot. We'll check it and explain the risks in simple words.",
    tab_text="📄 Paste Text", tab_img="🖼️ Upload Image", ph="Paste your message here...",
    check="Check Message", priv="Your data stays private. We do not store your messages.",
    e_text="Please paste a message first.", e_img="Please upload a screenshot first.",
    e_none="We could not read any text. Try a clearer screenshot.", busy="Checking the message...",
    back="Check another message", done="Analysis completed", msg="MESSAGE ANALYSED",
    lang="Detected language", chars="Characters", link="Contains a link", yes="Yes", no="No",
    why="WHY THIS LOOKS SUSPICIOUS", todo="WHAT SHOULD YOU DO?",
    scam="Likely Scam", safe="Looks Safe",
    scam_s="This message shows several strong indicators of fraud and looks suspicious.",
    safe_s="We did not find strong signs of a scam in this message.",
    hi="HIGH RISK", me="MEDIUM RISK", lo="LOW RISK", High="High", Medium="Medium",
    d1="Do not click the link.", d2="Do not reply or share details.", d3="Stay careful.",
    adv_s="Do not share OTP, PIN, or banking details. If you are unsure, contact your bank using the official helpline.",
    adv_ok="Never share your OTP or PIN, and double-check anything that asks for money.",
    t1="Avoid clicking any links", t2="Do not share sensitive information", t3="Verify directly with your bank",
    ocr="Text read from your screenshot",
    gen=("Looks like known scam messages", "The wording is similar to scams the model has seen."),
    safe_note="No strong scam patterns found. This is not a guarantee.",
    foot="The risk score is a model estimate, not a guarantee. Trained on generated data.",
    dev="Hindi / Marathi", hg="Hinglish", en_n="English")
HI = dict(
    title1="क्या यह संदेश", title2="सुरक्षित है या ", accent="स्कैम?",
    sub="संदेश पेस्ट करें या स्क्रीनशॉट अपलोड करें। हम इसे जाँचकर जोखिम सरल शब्दों में समझाएँगे।",
    tab_text="📄 टेक्स्ट पेस्ट करें", tab_img="🖼️ इमेज अपलोड करें", ph="अपना संदेश यहाँ पेस्ट करें...",
    check="संदेश जाँचें", priv="आपका डेटा निजी रहता है। हम आपके संदेश सेव नहीं करते।",
    e_text="पहले कोई संदेश पेस्ट करें।", e_img="पहले स्क्रीनशॉट अपलोड करें।",
    e_none="कोई टेक्स्ट नहीं पढ़ा जा सका। साफ़ स्क्रीनशॉट आज़माएँ।", busy="संदेश जाँचा जा रहा है...",
    back="दूसरा संदेश जाँचें", done="जाँच पूरी हुई", msg="जाँचा गया संदेश",
    lang="पहचानी गई भाषा", chars="अक्षर", link="लिंक है", yes="हाँ", no="नहीं",
    why="यह संदेश संदिग्ध क्यों लगता है", todo="आपको क्या करना चाहिए?",
    scam="स्कैम की संभावना", safe="सुरक्षित लगता है",
    scam_s="इस संदेश में धोखाधड़ी के कई मज़बूत संकेत हैं और यह संदिग्ध लगता है।",
    safe_s="इस संदेश में स्कैम के मज़बूत संकेत नहीं मिले।",
    hi="उच्च जोखिम", me="मध्यम जोखिम", lo="कम जोखिम", High="उच्च", Medium="मध्यम",
    d1="लिंक पर क्लिक न करें।", d2="जवाब न दें और जानकारी साझा न करें।", d3="सतर्क रहें।",
    adv_s="OTP, PIN या बैंकिंग जानकारी साझा न करें। संदेह हो तो बैंक की आधिकारिक हेल्पलाइन पर संपर्क करें।",
    adv_ok="OTP या PIN कभी साझा न करें, और पैसे माँगने वाले हर संदेश की दोबारा जाँच करें।",
    t1="किसी भी लिंक पर क्लिक न करें", t2="संवेदनशील जानकारी साझा न करें", t3="सीधे अपने बैंक से पुष्टि करें",
    ocr="स्क्रीनशॉट से पढ़ा गया टेक्स्ट",
    gen=("जाने-पहचाने स्कैम जैसा संदेश", "भाषा उन स्कैम संदेशों से मिलती है जो मॉडल ने देखे हैं।"),
    safe_note="स्कैम के मज़बूत पैटर्न नहीं मिले। यह गारंटी नहीं है।",
    foot="जोखिम स्कोर मॉडल का अनुमान है, गारंटी नहीं। मॉडल जनरेट किए गए डेटा पर प्रशिक्षित है।",
    dev="हिंदी / मराठी", hg="हिंग्लिश", en_n="अंग्रेज़ी")
MR = dict(
    title1="हा संदेश", title2="सुरक्षित आहे की ", accent="स्कॅम?",
    sub="संदेश पेस्ट करा किंवा स्क्रीनशॉट अपलोड करा. आम्ही तो तपासून धोके सोप्या शब्दांत सांगू.",
    tab_text="📄 मजकूर पेस्ट करा", tab_img="🖼️ इमेज अपलोड करा", ph="तुमचा संदेश इथे पेस्ट करा...",
    check="संदेश तपासा", priv="तुमचा डेटा खाजगी राहतो. आम्ही तुमचे संदेश साठवत नाही.",
    e_text="आधी एक संदेश पेस्ट करा.", e_img="आधी स्क्रीनशॉट अपलोड करा.",
    e_none="मजकूर वाचता आला नाही. अधिक स्पष्ट स्क्रीनशॉट वापरून पहा.", busy="संदेश तपासला जात आहे...",
    back="दुसरा संदेश तपासा", done="तपासणी पूर्ण", msg="तपासलेला संदेश",
    lang="ओळखलेली भाषा", chars="अक्षरे", link="लिंक आहे", yes="होय", no="नाही",
    why="हा संदेश संशयास्पद का वाटतो", todo="तुम्ही काय करावे?",
    scam="स्कॅम असण्याची शक्यता", safe="सुरक्षित वाटतो",
    scam_s="या संदेशात फसवणुकीची अनेक ठळक चिन्हे आहेत आणि तो संशयास्पद वाटतो.",
    safe_s="या संदेशात स्कॅमची ठळक चिन्हे आढळली नाहीत.",
    hi="जास्त धोका", me="मध्यम धोका", lo="कमी धोका", High="जास्त", Medium="मध्यम",
    d1="लिंकवर क्लिक करू नका.", d2="उत्तर देऊ नका, माहिती शेअर करू नका.", d3="सावध राहा.",
    adv_s="OTP, PIN किंवा बँकिंग माहिती शेअर करू नका. शंका असल्यास बँकेच्या अधिकृत हेल्पलाइनवर संपर्क साधा.",
    adv_ok="OTP किंवा PIN कधीही शेअर करू नका आणि पैसे मागणाऱ्या प्रत्येक संदेशाची पुन्हा खात्री करा.",
    t1="कोणत्याही लिंकवर क्लिक करू नका", t2="संवेदनशील माहिती शेअर करू नका", t3="थेट तुमच्या बँकेकडे खात्री करा",
    ocr="स्क्रीनशॉटमधून वाचलेला मजकूर",
    gen=("ओळखीच्या स्कॅमसारखा संदेश", "भाषा मॉडेलने पाहिलेल्या स्कॅम संदेशांसारखी आहे."),
    safe_note="स्कॅमचे ठळक नमुने आढळले नाहीत. ही हमी नाही.",
    foot="जोखीम स्कोअर हा मॉडेलचा अंदाज आहे, हमी नाही. मॉडेल जनरेट केलेल्या डेटावर प्रशिक्षित आहे.",
    dev="हिंदी / मराठी", hg="हिंग्लिश", en_n="इंग्रजी")
TR = {"en": EN, "hi": {**EN, **HI}, "mr": {**EN, **MR}}

FL = {  # reason key -> (title, description)
    "en": dict(urgent=("Creates urgency", "Tries to scare you into taking quick action."),
               link=("Contains a suspicious link", "The link may not be an official website."),
               kyc=("Asks to verify your account", "Banks do not ask for KYC or verification through message links."),
               otp=("Asks for OTP, PIN or password", "Genuine senders never ask you to share these."),
               reward=("Promises unexpected money", "Prizes and refunds you did not ask for are a common trick."),
               phone=("Asks you to call or pay a number", "Scammers push you to contact or pay them directly.")),
    "hi": dict(urgent=("जल्दबाज़ी कराता है", "डराकर आपसे तुरंत कदम उठवाने की कोशिश।"),
               link=("संदिग्ध लिंक है", "यह लिंक आधिकारिक वेबसाइट का नहीं हो सकता।"),
               kyc=("खाता सत्यापित करने को कहता है", "बैंक संदेश के लिंक से KYC या सत्यापन नहीं माँगते।"),
               otp=("OTP, PIN या पासवर्ड माँगता है", "असली भेजने वाले ये कभी साझा करने को नहीं कहते।"),
               reward=("अचानक पैसे का वादा", "बिना माँगे इनाम या रिफंड एक आम चाल है।"),
               phone=("नंबर पर कॉल या भुगतान को कहता है", "ठग सीधे संपर्क या भुगतान के लिए दबाव डालते हैं।")),
    "mr": dict(urgent=("घाई करायला लावतो", "घाबरवून तुमच्याकडून लगेच कृती करून घेण्याचा प्रयत्न."),
               link=("संशयास्पद लिंक आहे", "ही लिंक अधिकृत वेबसाइटची नसू शकते."),
               kyc=("खाते पडताळायला सांगतो", "बँका संदेशातील लिंकवरून KYC किंवा पडताळणी मागत नाहीत."),
               otp=("OTP, PIN किंवा पासवर्ड मागतो", "खरे पाठवणारे हे कधीच शेअर करायला सांगत नाहीत."),
               reward=("अनपेक्षित पैशांचे आमिष", "न मागता मिळणारे बक्षीस किंवा रिफंड ही सामान्य युक्ती आहे."),
               phone=("नंबरवर कॉल किंवा पेमेंट करायला सांगतो", "ठग थेट संपर्क किंवा पेमेंटसाठी दबाव आणतात.")),
}
FMAP = {"External link in the message": "link", "Account / KYC verification request": "kyc",
        "Mentions OTP / PIN / password": "otp", "Unexpected money / reward claim": "reward",
        "Urgent or threatening language": "urgent", "Asks you to call or pay a phone number": "phone"}
ORDER = ["urgent", "link", "kyc", "otp", "reward", "phone"]
HIGH = {"urgent", "link", "kyc", "otp"}
HGL = set("hai hain aap aapka aapki aapke ka ki ke ko ho hoga karein kijiye kare nahi turant abhi mein par yeh jaldi karo".split())

def detect(t):
    L = [c for c in t if c.isalpha()]
    if L and sum("\u0900" <= c <= "\u097F" for c in L) / len(L) > 0.3:
        return "dev"
    return "hg" if len(set(re.findall(r"[a-z]+", t.lower())) & HGL) >= 2 else "en_n"

# ---------------- state ----------------
S = st.session_state
S.setdefault("page", "home"); S.setdefault("thm", "dark"); S.setdefault("lc", "en"); S.setdefault("n", 0); S.setdefault("mode", "text")

@st.cache_resource
def bg_image():
    try:
        import io
        from PIL import Image
        im = Image.open("imgg.png").convert("RGB"); im.thumbnail((1920, 1080))
        buf = io.BytesIO(); im.save(buf, "JPEG", quality=84)
        return "url(data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode() + ")"
    except Exception:
        try:
            return "url(data:image/png;base64," + base64.b64encode(open("imgg.png", "rb").read()).decode() + ")"
        except Exception:
            return "radial-gradient(circle at 85% 95%,#4a1a16,#0b0b10 60%)"

DARK = dict(tx="#f2f2f4", mu="#9a9ca6", card="rgba(20,20,24,.72)", bd="rgba(255,255,255,.09)",
            fd="rgba(255,255,255,.04)", ov="linear-gradient(rgba(8,8,10,.5),rgba(8,8,10,.78))", ac="#ef6f68")
LIGHT = dict(tx="#1b1c20", mu="#5d606b", card="rgba(255,255,255,.74)", bd="rgba(0,0,0,.1)",
             fd="rgba(0,0,0,.04)", ov="linear-gradient(rgba(250,246,244,.72),rgba(250,246,244,.8))", ac="#e0524b")

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html,body,.stApp,.stApp *{font-family:'Inter',sans-serif}
#MainMenu,header,footer,[data-testid=stToolbar],[data-testid=stDecoration],[data-testid=stHeader]{display:none!important}
.stApp,[data-testid=stMain],.stMain{background:transparent!important}
[data-testid=stAppViewContainer]{background:var(--ov),BGIMG center/cover no-repeat!important}
.stApp,.stApp p,.stApp label,.stMarkdown{color:var(--tx)}
.block-container{max-width:min(94vw,@1500)!important;padding:@12 @24 0!important}
[data-testid=stVerticalBlock]{gap:@9!important}
[data-testid=stHorizontalBlock]{gap:@16!important}
.st-key-card,.st-key-rcard{background:var(--card);border:1px solid var(--bd);border-radius:@26;backdrop-filter:blur(18px);margin:@4 auto}
.st-key-card{width:min(66vw,@1000);max-width:none;padding:@26 @48!important}
.st-key-rcard{width:min(90vw,@1320);max-width:none;padding:@16 @36!important}
.ttl{text-align:center;font-size:@50;font-weight:800;line-height:1.1;letter-spacing:-.02em;margin:@4 0 @10}
.ttl b,.big b{color:var(--ac)}
.sub{text-align:center;color:var(--mu);font-size:@17;max-width:@620;margin:0 auto @6;line-height:1.45}
[class*=st-key-tab_],[class*=st-key-tab_] [data-testid=stButton],.st-key-check,.st-key-check [data-testid=stButton]{width:100%!important}
.st-key-tab_text button,.st-key-tab_image button,[class*=st-key-lang_] button,.st-key-theme button{background:var(--fd);border:1px solid var(--bd);color:var(--tx);min-height:0}
.st-key-tab_text button,.st-key-tab_image button{width:100%;height:@56;border-radius:@16}
.st-key-tab_text button p,.st-key-tab_image button p{font-size:@18;font-weight:600;color:var(--tx)}
[class*=st-key-lang_] button{width:100%;height:@40;border-radius:999px;padding:0 @6}
[class*=st-key-lang_] button p{font-size:@15;font-weight:600;color:var(--tx)}
.st-key-theme{display:flex;justify-content:flex-end}
.st-key-theme button{width:@44;height:@44;border-radius:50%;padding:0}
.st-key-card textarea{height:@140!important;min-height:@140!important;background:transparent!important;color:var(--tx)!important;font-size:@16}
.st-key-card [data-baseweb=textarea],.st-key-card [data-baseweb=base-input]{background:var(--fd)!important;border:1px solid var(--bd)!important;border-radius:@18!important}
[data-testid=stFileUploaderDropzone]{background:var(--fd);border:1px dashed var(--bd);border-radius:@18;min-height:@140;justify-content:center}
[data-testid=stFileUploaderDropzone] *{color:var(--mu)!important}
.st-key-check button{width:100%;height:@62;border:none;border-radius:999px;position:relative;padding:0 @80;background:linear-gradient(100deg,#fbe9e4,#e9e7ee 55%,#f6dfd8);box-shadow:0 0 40px rgba(239,111,104,.25)}
.st-key-check button p{color:#111!important;font-size:@19;font-weight:700}
.st-key-check button:after{content:"→";position:absolute;right:@7;top:@7;width:@48;height:@48;border-radius:@15;background:#14151a;color:#fff;font-size:@22;display:flex;align-items:center;justify-content:center}
.priv{text-align:center;color:var(--mu);font-size:@14}
.priv svg{vertical-align:-3px;margin-right:8px}
.st-key-back button{background:none!important;border:none!important;padding:0;box-shadow:none;min-height:0}
.st-key-back button p{font-size:@16;color:var(--tx)}
.done{text-align:right;color:var(--mu);font-size:@14;padding-top:@6}
.gw{position:relative;width:@180;height:@205}
.gw svg{display:block;width:@180!important;height:@180!important}
.arc{animation:arc 1.1s ease-out}
@keyframes arc{from{stroke-dashoffset:628.3}}
.gn{position:absolute;top:@52;left:0;width:@180;text-align:center}
.gn b{display:block;font-size:@56;font-weight:600;line-height:1}.gn span{color:var(--mu);font-size:@20}
.pill{position:absolute;top:@162;left:50%;transform:translateX(-50%);padding:@5 @16;border-radius:999px;font-size:@12;font-weight:600;letter-spacing:.06em;white-space:nowrap}
.big{font-size:@38;font-weight:700;margin:@2 0 @4;letter-spacing:-.01em}
.desc{color:var(--mu);font-size:@16;line-height:1.4;max-width:@400}
.lbl{color:var(--mu);font-size:@11;letter-spacing:.2em;margin:0 0 @6}
.stats{display:flex;margin-top:@6}.stats div{flex:1;padding:0 @16;border-left:1px solid var(--bd);color:var(--mu);font-size:@13}
.stats div:first-child{border:none;padding-left:0}.stats b{display:block;color:var(--tx);font-size:@16;font-weight:500;margin-top:@4}
.rows{border:1px solid var(--bd);border-radius:@18;margin:@4 0;background:var(--fd)}
.row{display:flex;align-items:center;gap:@16;padding:@9 @24;border-top:1px solid var(--bd)}.row:first-child{border:none}
.row i{font-style:normal;color:var(--mu);font-size:@20;width:@34}
.rt{flex:1;border-left:2px solid rgba(239,111,104,.5);padding-left:@18}.rt b{display:block;font-size:@16;font-weight:600}.rt span{color:var(--mu);font-size:@13}
.sv{font-style:normal;padding:@6 @22;border-radius:@11;font-size:@14;color:#ff7a70;background:rgba(239,111,104,.12);border:1px solid rgba(239,111,104,.3)}
.sv.m{color:#f5b84b;background:rgba(245,184,75,.12);border-color:rgba(245,184,75,.3)}
.act{display:flex;align-items:center;border-radius:@22;padding:@16 @28;border:1px solid rgba(239,111,104,.55);background:linear-gradient(100deg,rgba(150,45,38,.55),rgba(80,25,22,.4))}
.act.ok{border-color:rgba(76,214,138,.5);background:linear-gradient(100deg,rgba(30,110,70,.45),rgba(20,60,40,.35))}
.al{flex:1;padding-right:@28}.al small{font-size:@11;letter-spacing:.2em;color:var(--mu)}
.al h3{font-size:@28;font-weight:700;margin:@6 0;color:var(--tx);padding:0}.al p{color:var(--mu);font-size:@15;line-height:1.45;margin:0}
.ai{display:flex}.ai div{width:@140;text-align:center;padding:0 @10;border-left:1px solid var(--bd);font-size:@13;color:var(--tx)}
.ai svg{display:block;margin:0 auto @8;color:#ff7a70;width:@30!important;height:@30!important}.act.ok .ai svg{color:#4cd68a}
.foot{text-align:center;color:var(--mu);font-size:@12}
.res{display:flex;flex-direction:column;gap:@10}
.hero{display:grid;grid-template-columns:1fr 1.5fr;gap:@40;align-items:start}
.mbox{background:var(--fd);border:1px solid var(--bd);border-radius:@18;padding:@16 @22;font-size:@18;line-height:1.5;max-height:@150;overflow:auto;white-space:pre-wrap;word-break:break-word}
"""

def inject_css():
    t = DARK if S.thm == "dark" else LIGHT
    uu = "min(calc(100vh/700),calc(100vw/900))" if S.page == "home" else "min(calc(100vh/860),calc(100vw/1250))"
    v = ":root{--u:" + uu + ";" + ";".join(f"--{k}:{x}" for k, x in t.items()) + "}"
    css = re.sub(r"@(\d+(?:\.\d+)?)", lambda m: f"calc(var(--u)*{m.group(1)})", CSS).replace("BGIMG", bg_image())
    act = (f".st-key-tab_{S.mode} button,.st-key-lang_{S.lc} button{{background:linear-gradient(180deg,rgba(239,111,104,.34),rgba(239,111,104,.12))!important;"
           "box-shadow:inset 0 0 0 1px rgba(239,111,104,.75)!important}")
    st.markdown("<style>" + v + css + act + "</style>", unsafe_allow_html=True)

# ---------------- top bar ----------------
inject_css()
def html(x, **kw):
    st.markdown(x + '<div style="height:1rem"></div>', unsafe_allow_html=True)

def set_lc(c): S.lc = c
def set_mode(m): S.mode = m
def toggle_theme(): S.thm = "light" if S.thm == "dark" else "dark"

top = st.columns([6, 1.15, 1.15, 1.15, .6], gap="small")
for col, (c, name) in zip(top[1:4], [("en", "English"), ("hi", "हिंदी"), ("mr", "मराठी")]):
    col.button(name, key=f"lang_{c}", on_click=set_lc, args=(c,))
top[4].button("☀️" if S.thm == "dark" else "🌙", key="theme", on_click=toggle_theme)
T = TR[S.lc]

# ---------------- home page ----------------
def home():
    with st.container(key="card"):
        html(f'<div class="ttl">{T["title1"]}<br>{T["title2"]}<b>{T["accent"]}</b></div><div class="sub">{T["sub"]}</div>', unsafe_allow_html=True)
        tabs = st.columns(2, gap="small")
        tabs[0].button(T["tab_text"], key="tab_text", on_click=set_mode, args=("text",))
        tabs[1].button(T["tab_img"], key="tab_image", on_click=set_mode, args=("image",))
        mode = S.mode
        txt, up = "", None
        if mode == "text":
            txt = st.text_area("msg", key=f"t{S.n}", placeholder=T["ph"], max_chars=2000, height=100, label_visibility="collapsed")
        else:
            up = st.file_uploader("img", type=["png", "jpg", "jpeg", "webp"], key=f"u{S.n}", label_visibility="collapsed")
        go = st.button(T["check"], key="check")
        html(f'<div class="priv"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>{T["priv"]}</div>', unsafe_allow_html=True)
    if not go:
        return
    t0 = time.perf_counter()
    if mode == "text":
        if not txt.strip():
            st.warning(T["e_text"]); return
        with st.spinner(T["busy"]):
            r = scam_core.analyze(txt)
        body = txt.strip()
    else:
        if up is None:
            st.warning(T["e_img"]); return
        with st.spinner(T["busy"]):
            r = scam_core.analyze_image(up.getvalue())
        body = r.get("ocr_text", "").strip()
        if not body:
            st.warning(T["e_none"]); return
    S.res = dict(r=r, body=body, src=mode, sec=time.perf_counter() - t0)
    S.page = "result"
    st.rerun()

# ---------------- result page ----------------
def back():
    S.page = "home"; S.n += 1

ICONS = ['<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
         '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
         '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>']

def result():
    R = S.res; r = R["r"]; body = R["body"]; sc = r["risk_score"]; scam = r["is_scam"]
    if scam:
        c1, c2, lvl = "#ff7a70", "#e8453c", ("hi" if sc >= 70 else "me")
    else:
        c1, c2, lvl = "#5be39b", "#2fa866", "lo"
    pc = "239,111,104" if scam else "76,214,138"
    has_link = bool(scam_core.URL_RE.search(body))
    words = T["scam" if scam else "safe"].split()
    head = " ".join(words[:-1]) + f' <b style="color:{c1}">{words[-1]}</b>'
    off = 628.3 * (1 - sc / 100)
    gauge = (f'<div class="gw"><svg viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>'
             f'<circle cx="120" cy="120" r="100" fill="none" stroke-width="7" style="stroke:var(--bd)"/>'
             f'<circle class="arc" cx="120" cy="120" r="100" fill="none" stroke="url(#g)" stroke-width="7" stroke-linecap="round" stroke-dasharray="628.3" stroke-dashoffset="{off:.1f}" transform="rotate(-90 120 120)"/></svg>'
             f'<div class="gn"><b>{sc}</b><span>/ 100</span></div>'
             f'<div class="pill" style="color:{c1};background:rgba({pc},.14);border:1px solid rgba({pc},.4)">{T[lvl]}</div></div>')
    label = T["ocr"].upper() if R["src"] == "image" else T["msg"]
    if scam:
        keys = {FMAP[f] for f in r["reasons"] if f in FMAP}
        items = [(*FL[S.lc][k], "High" if k in HIGH else "Medium") for k in ORDER if k in keys][:3] or [(*T["gen"], "Medium")]
        rows = "".join(f'<div class="row"><i>{i:02d}</i><div class="rt"><b>{t}</b><span>{d}</span></div><em class="sv{" m" if sv == "Medium" else ""}">{T[sv]}</em></div>' for i, (t, d, sv) in enumerate(items, 1))
        mid = f'<div><div class="lbl">{T["why"]}</div><div class="rows">{rows}</div></div>'
    else:
        mid = f'<div class="rows"><div class="row"><i>✓</i><div class="rt" style="border-color:rgba(76,214,138,.5)"><b>{T["safe_note"]}</b></div></div></div>'
    tips = "".join(f'<div><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{ICONS[i]}</svg>{T["t" + str(i + 1)]}</div>' for i in range(3))
    title = T["d3"] if not scam else (T["d1"] if has_link else T["d2"])
    with st.container(key="rcard"):
        a, b = st.columns([3, 2])
        a.button("←  " + T["back"], key="back", on_click=back)
        b.markdown(f'<div class="done">{T["done"]} · {R["sec"]:.1f}s</div>', unsafe_allow_html=True)
        html(f'<div class="res"><div class="hero"><div>{gauge}<div class="big">{head}</div><div class="desc">{T["scam_s" if scam else "safe_s"]}</div></div>'
             f'<div><div class="lbl">{label}</div><div class="mbox">“{html_lib.escape(body)}”</div>'
             f'<div class="stats"><div>{T["lang"]}<b>{T[detect(body)]}</b></div><div>{T["chars"]}<b>{len(body)}</b></div><div>{T["link"]}<b>{T["yes"] if has_link else T["no"]}</b></div></div></div></div>'
             f'{mid}<div class="act{"" if scam else " ok"}"><div class="al"><small>{T["todo"]}</small><h3>{title}</h3><p>{T["adv_s" if scam else "adv_ok"]}</p></div><div class="ai">{tips}</div></div>'
             f'<div class="foot">{T["foot"]}</div></div>')

if S.page == "result" and "res" in S:
    result()
else:
    home()