import { useEffect, useRef, useState } from "react";

const API = "http://localhost:8000";
const JSON_H = { "Content-Type": "application/json" };

/* [lo, hi, en, hi] monthly household income buckets */
const INCOME = [[0, 5000, "Under ₹5,000", "₹5,000 से कम"], [5000, 10000, "₹5,000 – ₹10,000", "₹5,000 – ₹10,000"],
  [10000, 20000, "₹10,000 – ₹20,000", "₹10,000 – ₹20,000"], [20000, 40000, "₹20,000 – ₹40,000", "₹20,000 – ₹40,000"],
  [40000, null, "Above ₹40,000", "₹40,000 से अधिक"]];
/* [value, en, hi] */
const OCC = [["farmer", "Farmer", "किसान"], ["farm_labourer", "Farm labourer", "खेतिहर मज़दूर"], ["fisherman", "Fisherman", "मछुआरा"],
  ["artisan", "Artisan / craftsperson", "कारीगर / शिल्पकार"], ["street_vendor", "Street vendor", "रेहड़ी-पटरी विक्रेता"],
  ["construction_worker", "Construction worker", "निर्माण मज़दूर"], ["daily_wage_worker", "Daily wage worker", "दिहाड़ी मज़दूर"],
  ["self_employed", "Self-employed / small business", "स्वरोज़गार / छोटा व्यवसाय"], ["student", "Student", "विद्यार्थी"],
  ["homemaker", "Homemaker", "गृहिणी"], ["salaried", "Salaried", "वेतनभोगी"], ["unemployed", "Unemployed", "बेरोज़गार"]];
const CASTE = [["general", "General", "सामान्य"], ["obc", "OBC", "ओबीसी"], ["sc", "SC", "अनुसूचित जाति (SC)"], ["st", "ST", "अनुसूचित जनजाति (ST)"]];
const GENDER = [["female", "Female", "महिला"], ["male", "Male", "पुरुष"]];
const AREA = [["rural", "Rural", "ग्रामीण"], ["urban", "Urban", "शहरी"]];
const STATE = [["Maharashtra", "Maharashtra", "महाराष्ट्र"], ["Other", "Other state (Central schemes only)", "अन्य राज्य (केवल केंद्र की योजनाएँ)"]];
const YN = [["yes", "Yes", "हाँ"], ["no", "No", "नहीं"]];
const MORE = [["bpl", "BPL / poor-household card", "बीपीएल / गरीबी रेखा कार्ड"], ["widow", "Widow", "विधवा"],
  ["owns_land", "Owns agricultural land", "खेती की ज़मीन का मालिक"], ["minority", "Minority community", "अल्पसंख्यक समुदाय"]];

const T = {
  en: {
    brand: "Scheme Finder", title: "Find government schemes made for you",
    sub: "Tell us about yourself and we'll show the schemes you may be eligible for.",
    form: "Form", speak: "Speak", upload: "Upload", age: "Age", agePh: "Your age in years", gender: "Gender", selGender: "Select gender",
    state: "State", selState: "Select your state", area: "Area of residence", selArea: "Rural or urban", income: "Monthly household income",
    selIncome: "Select income range", occ: "Occupation", selOcc: "Select occupation", cat: "Social category", selCat: "Select category",
    dis: "Disability", skip: "Skip", more: "More details (optional, helps find more schemes)", find: "Find my schemes", finding: "Finding…",
    privacy: "Your details are used only to match schemes.", backendErr: "Could not reach the backend. Start it on port 8000 and try again.",
    micErr: "Microphone access was blocked. Allow it in the browser and try again.",
    speakHelp: "Tap the microphone and describe yourself. For example: I am 38, I work as a labourer, and my family earns about 8,000 a month.",
    startRec: "Start recording", stopRec: "Stop and fill the form", understanding: "Understanding what you said…", heard: "We heard",
    filledVoice: "Filled from your voice. Please check every field.", filledDoc: "Filled from your document. Please check every field.",
    upHelp: "Upload a photo of your Aadhaar card. The photo is read on this computer and is not saved. ID and phone numbers are removed before any text is analysed.",
    choose: "Choose a photo", reading: "Reading the document…", nothing: "Nothing could be read from this. Try a clearer photo or use the form.",
    results: "Your scheme results", basis: "Based on the details you provided", edit: "Edit details",
    total: "Total potential cash benefit (estimate)", perYear: "/ year", cashNote: "Cash benefits only. Insurance cover, loans and subsidies are not counted.",
    tabs: { eligible: "You qualify", almost: "Almost there", need_info: "Need more information" }, empty: "No schemes in this list right now.",
    tellMore: "Tell us more", details: "Details", back: "Back to results", status: { eligible: "Eligible", almost: "Almost there", need_info: "Need more info" },
    benefit: "Benefit", why: "Why you qualify", missing: "What's missing", unk: "We couldn't check these", also: "Also check",
    docs: "Documents to carry", apply: "How to apply", site: "Visit official website", none: "No specific restrictions are listed for this scheme.",
    simple: "In simple words", listen: "Listen", stop: "Stop", preparing: "Preparing…",
  },
  hi: {
    brand: "स्कीम फाइंडर", title: "आपके लिए बनी सरकारी योजनाएँ खोजें",
    sub: "अपने बारे में बताइए, हम आपके लिए उपयुक्त योजनाएँ दिखाएँगे।",
    form: "फ़ॉर्म", speak: "बोलकर बताएँ", upload: "दस्तावेज़", age: "उम्र", agePh: "आपकी उम्र (वर्ष में)", gender: "लिंग", selGender: "लिंग चुनें",
    state: "राज्य", selState: "अपना राज्य चुनें", area: "निवास क्षेत्र", selArea: "ग्रामीण या शहरी", income: "मासिक पारिवारिक आय",
    selIncome: "आय की सीमा चुनें", occ: "व्यवसाय", selOcc: "व्यवसाय चुनें", cat: "सामाजिक श्रेणी", selCat: "श्रेणी चुनें",
    dis: "दिव्यांगता", skip: "छोड़ें", more: "और जानकारी (वैकल्पिक, अधिक योजनाएँ खोजने में मदद करती है)", find: "मेरी योजनाएँ खोजें", finding: "खोज रहे हैं…",
    privacy: "आपकी जानकारी केवल योजनाएँ ढूँढने में उपयोग होती है।", backendErr: "सर्वर से संपर्क नहीं हो सका। उसे पोर्ट 8000 पर चालू करें और फिर कोशिश करें।",
    micErr: "माइक्रोफ़ोन की अनुमति बंद है। ब्राउज़र में अनुमति दें और फिर कोशिश करें।",
    speakHelp: "माइक दबाकर अपने बारे में बताइए। जैसे: मैं 38 साल का हूँ, मज़दूरी करता हूँ, और घर की कमाई लगभग 8,000 रुपये महीना है।",
    startRec: "रिकॉर्डिंग शुरू करें", stopRec: "रोकें और फ़ॉर्म भरें", understanding: "आपकी बात समझ रहे हैं…", heard: "हमने सुना",
    filledVoice: "आपकी आवाज़ से भरा गया। कृपया हर जानकारी जाँच लें।", filledDoc: "आपके दस्तावेज़ से भरा गया। कृपया हर जानकारी जाँच लें।",
    upHelp: "अपने आधार कार्ड की फ़ोटो दें। फ़ोटो इसी कंप्यूटर पर पढ़ी जाती है और सहेजी नहीं जाती। पाठ का विश्लेषण होने से पहले पहचान और फ़ोन नंबर हटा दिए जाते हैं।",
    choose: "फ़ोटो चुनें", reading: "दस्तावेज़ पढ़ रहे हैं…", nothing: "इससे कुछ पढ़ा नहीं जा सका। साफ़ फ़ोटो दें या फ़ॉर्म भरें।",
    results: "आपकी योजना सूची", basis: "आपकी दी गई जानकारी के आधार पर", edit: "जानकारी बदलें",
    total: "कुल संभावित नकद लाभ (अनुमान)", perYear: "/ वर्ष", cashNote: "केवल नकद लाभ। बीमा, ऋण और सब्सिडी शामिल नहीं हैं।",
    tabs: { eligible: "आप पात्र हैं", almost: "लगभग पात्र", need_info: "और जानकारी चाहिए" }, empty: "इस सूची में अभी कोई योजना नहीं है।",
    tellMore: "कृपया बताएँ", details: "विवरण", back: "परिणामों पर वापस", status: { eligible: "पात्र", almost: "लगभग पात्र", need_info: "और जानकारी चाहिए" },
    benefit: "लाभ", why: "आप क्यों पात्र हैं", missing: "क्या कमी है", unk: "इन्हें जाँचा नहीं जा सका", also: "यह भी जाँचें",
    docs: "साथ ले जाने वाले दस्तावेज़", apply: "आवेदन कैसे करें", site: "आधिकारिक वेबसाइट देखें", none: "इस योजना के लिए कोई विशेष शर्त सूचीबद्ध नहीं है।",
    simple: "आसान शब्दों में", listen: "सुनें", stop: "रोकें", preparing: "तैयार हो रहा है…",
  },
};

const P = {
  mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></>,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  up: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  vol: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  left: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  right: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  ext: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  edit: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></>,
};
const Icon = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[n]}</svg>
);
const Li = ({ k, icon, children }) => <li className={"l " + k}><Icon n={icon} s={15} /><div>{children}</div></li>;
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const bucket = (m) => INCOME.findIndex(([lo, hi]) => m >= lo && (hi === null || m < hi));

async function api(path, opts) {
  const r = await fetch(API + path, opts);
  if (!r.ok) {
    let d = "";
    try { d = (await r.json()).detail; } catch { /* ignore */ }
    throw new Error(d || "Request failed");
  }
  return r.json();
}

function Sel({ label, value, onChange, options, ph }) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{ph}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  const o = (arr) => arr.map((r) => [r[0], lang === "hi" ? r[2] : r[1]]);
  const [screen, setScreen] = useState("input");
  const [mode, setMode] = useState("form");
  const [f, setF] = useState({ age: "", gender: "", state: "Maharashtra", area: "", income: "", occupation: "", caste: "", needs: {} });
  const [res, setRes] = useState(null);
  const [tab, setTab] = useState("eligible");
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState("");
  const [work, setWork] = useState("");
  const [note, setNote] = useState(null);
  const [heard, setHeard] = useState("");
  const [recording, setRecording] = useState(false);
  const [ap, setAp] = useState({ id: null, phase: "idle" });
  const [spoken, setSpoken] = useState({});
  const rec = useRef(null), chunks = useRef([]), audio = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setNeed = (k, v) => setF((p) => ({ ...p, needs: { ...p.needs, [k]: v } }));

  useEffect(() => { audio.current?.pause(); setAp({ id: null, phase: "idle" }); }, [screen]);

  function applyProfile(p) {
    setF((prev) => ({
      ...prev,
      age: p.age != null ? String(p.age) : prev.age, gender: p.gender || prev.gender, state: p.state || prev.state, area: p.area || prev.area,
      income: p.monthly_income != null && bucket(p.monthly_income) >= 0 ? String(bucket(p.monthly_income)) : prev.income,
      occupation: p.occupation || prev.occupation, caste: p.caste || prev.caste, needs: { ...prev.needs, ...(p.needs || {}) },
    }));
  }

  async function startRec() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((x) => x.stop());
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        sendVoice(blob);
      };
      mr.start(); rec.current = mr; setRecording(true);
    } catch { setErr(t.micErr); }
  }
  const stopRec = () => { rec.current?.stop(); setRecording(false); };

  async function sendVoice(blob) {
    setWork("voice");
    const fd = new FormData();
    fd.append("file", blob, "speech." + (blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm"));
    try {
      const d = await api("/api/extract/voice", { method: "POST", body: fd });
      applyProfile(d.profile || {}); setHeard(d.transcript || ""); setNote(t.filledVoice); setMode("form");
    } catch (e) { setErr(e.message === "Failed to fetch" ? t.backendErr : e.message); }
    setWork("");
  }

  async function sendDoc(file) {
    if (!file) return;
    setWork("doc"); setErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const d = await api("/api/extract/document", { method: "POST", body: fd });
      if (!d.profile || !Object.keys(d.profile).length) setErr(t.nothing);
      else { applyProfile(d.profile); setHeard(""); setNote(t.filledDoc); setMode("form"); }
    } catch (e) { setErr(e.message === "Failed to fetch" ? t.backendErr : e.message); }
    setWork("");
  }

  async function find() {
    setWork("match"); setErr("");
    const inc = f.income === "" ? null : INCOME[+f.income];
    const body = {
      age: f.age ? +f.age : null, gender: f.gender || null, state: f.state, area: f.area || null,
      income_low: inc ? inc[0] : null, income_high: inc ? inc[1] : null,
      occupation: f.occupation || null, caste: f.caste || null,
      needs: Object.fromEntries(Object.entries(f.needs).filter(([, v]) => v)),
    };
    try {
      const d = await api("/api/match", { method: "POST", headers: JSON_H, body: JSON.stringify(body) });
      setRes(d); setSpoken({}); setTab("eligible"); setScreen("results");
    } catch (e) { setErr(e.message === "Failed to fetch" ? t.backendErr : e.message); }
    setWork("");
  }

  async function listen(s) {
    if (ap.id === s.id && ap.phase !== "idle") { audio.current?.pause(); setAp({ id: null, phase: "idle" }); return; }
    audio.current?.pause(); setAp({ id: s.id, phase: "loading" }); setErr("");
    try {
      const key = s.id + ":" + lang;
      let d = spoken[key];
      if (!d) {
        d = await api("/api/explain", { method: "POST", headers: JSON_H, body: JSON.stringify({ scheme: s, lang }) });
        setSpoken((p) => ({ ...p, [key]: d }));
      }
      const a = new Audio(API + d.audio_url);
      audio.current = a;
      a.onended = () => setAp({ id: null, phase: "idle" });
      await a.play();
      setAp({ id: s.id, phase: "playing" });
    } catch (e) { setErr(e.message === "Failed to fetch" ? t.backendErr : e.message); setAp({ id: null, phase: "idle" }); }
  }
  const lIcon = (s) => (ap.id === s.id && ap.phase === "playing" ? "stop" : "vol");

  const top = (
    <div className="top">
      <div className="brand"><span className="mark" />{t.brand}</div>
      <div className="lang" role="group" aria-label="Language">
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        <button className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")}>हिंदी</button>
      </div>
    </div>
  );

  if (screen === "input") return (
    <div className="app" lang={lang}>{top}
      <h1>{t.title}</h1>
      <p className="lede">{t.sub}</p>
      <div className="modes">
        <button className={mode === "form" ? "on" : ""} onClick={() => setMode("form")}><Icon n="doc" />{t.form}</button>
        <button className={mode === "speak" ? "on" : ""} onClick={() => setMode("speak")}><Icon n="mic" />{t.speak}</button>
        <button className={mode === "upload" ? "on" : ""} onClick={() => setMode("upload")}><Icon n="up" />{t.upload}</button>
      </div>

      {mode === "speak" && (
        <div className="panel">
          <p className="mut" style={{ margin: 0 }}>{t.speakHelp}</p>
          <button className={"round" + (recording ? " rec" : "")} onClick={recording ? stopRec : startRec} disabled={work === "voice"} aria-label={recording ? t.stopRec : t.startRec}>
            <Icon n={recording ? "stop" : "mic"} s={28} />
          </button>
          <div className="small mut">{work === "voice" ? t.understanding : recording ? t.stopRec : t.startRec}</div>
        </div>
      )}

      {mode === "upload" && (
        <div className="panel">
          <p className="mut" style={{ margin: 0 }}>{t.upHelp}</p>
          <label className="round" style={{ margin: "20px auto 12px" }}>
            <Icon n="up" s={28} />
            <input type="file" accept="image/*" hidden onChange={(e) => { sendDoc(e.target.files[0]); e.target.value = ""; }} />
          </label>
          <div className="small mut">{work === "doc" ? t.reading : t.choose}</div>
        </div>
      )}

      {err && mode !== "form" && <div className="err">{err}</div>}

      {mode === "form" && (
        <>
          {note && <div className="note"><Icon n="check" s={16} /><div>{note}{heard && <><br /><b>{t.heard}:</b> “{heard}”</>}</div></div>}
          <label>{t.age}</label>
          <input type="number" min="0" max="120" placeholder={t.agePh} value={f.age} onChange={(e) => set("age", e.target.value)} />
          <Sel label={t.gender} value={f.gender} onChange={(v) => set("gender", v)} options={o(GENDER)} ph={t.selGender} />
          <div className="row">
            <Sel label={t.state} value={f.state} onChange={(v) => set("state", v)} options={o(STATE)} ph={t.selState} />
            <Sel label={t.area} value={f.area} onChange={(v) => set("area", v)} options={o(AREA)} ph={t.selArea} />
          </div>
          <Sel label={t.income} value={f.income} onChange={(v) => set("income", v)} options={INCOME.map((r, i) => [String(i), lang === "hi" ? r[3] : r[2]])} ph={t.selIncome} />
          <Sel label={t.occ} value={f.occupation} onChange={(v) => set("occupation", v)} options={o(OCC)} ph={t.selOcc} />
          <div className="row">
            <Sel label={t.cat} value={f.caste} onChange={(v) => set("caste", v)} options={o(CASTE)} ph={t.selCat} />
            <Sel label={t.dis} value={f.needs.disability || ""} onChange={(v) => setNeed("disability", v)} options={o(YN)} ph={t.skip} />
          </div>
          <details>
            <summary>{t.more}</summary>
            <div className="row" style={{ flexWrap: "wrap" }}>
              {MORE.map((r) => <div key={r[0]} style={{ minWidth: "45%" }}><Sel label={lang === "hi" ? r[2] : r[1]} value={f.needs[r[0]] || ""} onChange={(v) => setNeed(r[0], v)} options={o(YN)} ph={t.skip} /></div>)}
            </div>
          </details>
          <button className="btn" onClick={find} disabled={work === "match"}>{work === "match" ? t.finding : t.find}<Icon n="right" s={16} /></button>
          {err && <div className="err">{err}</div>}
          <p className="mut small" style={{ textAlign: "center", marginTop: 18, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}><Icon n="lock" s={13} />{t.privacy}</p>
        </>
      )}
    </div>
  );

  if (screen === "results") {
    const list = res[tab];
    return (
      <div className="app" lang={lang}>{top}
        <div className="head">
          <div><h1 style={{ fontSize: 40, marginBottom: 6 }}>{t.results}</h1><div className="mut">{t.basis}</div></div>
          <button className="ghost" onClick={() => setScreen("input")}><Icon n="edit" s={15} />{t.edit}</button>
        </div>
        <div className="total">
          <div className="mut small">{t.total}</div>
          <div className="big">{inr(res.cash_total)} <small>{t.perYear}</small></div>
          <div className="mut small">{t.cashNote}</div>
        </div>
        <div className="stabs">{Object.keys(t.tabs).map((k) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{t.tabs[k]} ({res[k].length})</button>)}</div>
        {err && <div className="err">{err}</div>}
        {list.length === 0 && <p className="mut" style={{ marginTop: 24 }}>{t.empty}</p>}
        {list.map((s) => (
          <div className="item" key={s.id}>
            <div className="grow">
              <h3>{s.name}</h3>
              <div className="mut small">{s.category} · {s.level}</div>
              <div className="clamp">{s.benefit}</div>
              {tab === "almost" && s.failed.map((x, i) => x.hint && <div className="hint" key={i}>{x.hint}</div>)}
              {tab === "need_info" && <div className="mut small" style={{ marginTop: 6 }}>{t.tellMore}: {s.unknown.join(", ")}</div>}
            </div>
            <div className="acts">
              <button className="icon-btn" onClick={() => listen(s)} aria-label={t.listen} title={t.listen}>{ap.id === s.id && ap.phase === "loading" ? <span className="small">…</span> : <Icon n={lIcon(s)} s={16} />}</button>
              <button className="icon-btn" onClick={() => { setSel(s); setScreen("detail"); }} aria-label={t.details} title={t.details}><Icon n="right" s={16} /></button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const s = sel;
  const sp = spoken[s.id + ":" + lang];
  return (
    <div className="app" lang={lang}>{top}
      <button className="ghost" onClick={() => setScreen("results")}><Icon n="left" s={15} />{t.back}</button>
      <div style={{ margin: "28px 0 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
        <div><h2 style={{ fontSize: 36 }}>{s.name}</h2><div className="mut small">{s.level === "Central" ? "Central Government" : s.level} · {s.category}</div></div>
        <span className={"badge " + s.status}>{t.status[s.status]}</span>
      </div>
      <div className="sec">
        <h3>{t.benefit}</h3>
        <div>{s.benefit}</div>
        {s.cash && <div className="big">{inr(s.cash)} <small>{t.perYear}</small></div>}
      </div>
      <div className="sec">
        <h3>{t.simple}</h3>
        <button className="ghost" onClick={() => listen(s)}>
          <Icon n={lIcon(s)} s={15} />{ap.id === s.id && ap.phase === "loading" ? t.preparing : ap.id === s.id && ap.phase === "playing" ? t.stop : t.listen}
        </button>
        {sp && <p className="say">{sp.text}</p>}
        {err && <div className="err">{err}</div>}
      </div>
      <div className="sec">
        <h3>{t.why}</h3>
        {s.passed.length === 0 && s.failed.length === 0 && s.unknown.length === 0 && <div className="mut small">{t.none}</div>}
        <ul>{s.passed.map((x, i) => <Li k="ok" icon="check" key={i}>{x}</Li>)}</ul>
      </div>
      {s.failed.length > 0 && <div className="sec"><h3>{t.missing}</h3><ul>{s.failed.map((x, i) => <Li k="no" icon="x" key={i}>{x.text}{x.hint && <div className="hint">{x.hint}</div>}</Li>)}</ul></div>}
      {s.unknown.length > 0 && <div className="sec"><h3>{t.unk}</h3><ul>{s.unknown.map((x, i) => <Li k="q" icon="help" key={i}>{x}</Li>)}</ul></div>}
      {s.other_conditions.length > 0 && <div className="sec"><h3>{t.also}</h3><ul>{s.other_conditions.map((x, i) => <Li k="q" icon="help" key={i}>{x}</Li>)}</ul></div>}
      {s.documents.length > 0 && <div className="sec"><h3>{t.docs}</h3><ul>{s.documents.map((x, i) => <Li k="doc" icon="file" key={i}>{x}</Li>)}</ul></div>}
      {s.steps.length > 0 && <div className="sec"><h3>{t.apply}</h3><ol>{s.steps.map((x, i) => <li key={i}>{x}</li>)}</ol></div>}
      {s.url && <a className="btn" href={s.url} target="_blank" rel="noreferrer">{t.site}<Icon n="ext" s={15} /></a>}
    </div>
  );
}
