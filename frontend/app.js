(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { lang: 'en', history: [], resources: [], lessons: [], glossary: [], cards: [], speech: { token: 0, audio: null, utterance: null, objectUrl: null, button: null, active: false, automatic: false, controller: null, activeText: '' } };
  const strings = {
    en: {
      tagline:'Your friendly credit-card companion', topMatchTitle:'Your primary match',topPick:'Top match for your stated goal',alternativesTitle:'Other cards worth comparing',catalogTitle:'Browse the card catalogue',catalogDesc:'A limited sample across different use cases. Product terms must be reconfirmed with issuers.',searchCardsLabel:'Search the catalogue',searchCards:'Search by card or bank name…',catalogEmpty:'No cards match this search.',catalogCount:'{n} cards in this sample catalogue — not every card in India.',answerSources:'Sources to verify',sourceStatusChecked:'Issuer source checked; reconfirm terms',sourceStatusReview:'Needs re-verification', language:'Language', eyebrow:'CREDIT, EXPLAINED SIMPLY', headline:'No confusing jargon. No judgement. Just clear next steps.', subhead:'Learn about cards, compare options, understand your bill and keep yourself safe — in English, Hindi or Marathi.',
      safetyTitle:'Two rules to always remember', safetyLine:'Never share your OTP, CVV or PIN. Paying only the minimum due can make debt last longer and cost more.',
      tabAssistant:'AI assistant',tabFinder:'Find my path',tabLearn:'Learn & verify', assistantEyebrow:'YOUR PERSONAL GUIDE', assistantTitle:'Ask CardSaathi anything', assistantDesc:"Ask one question at a time. I'll explain it simply and help you choose the next step.",
      tryAsking:'Try asking', readAloud:'Automatically read new answers aloud', askPlaceholder:'Ask about credit cards…', send:'Send', privacyNote:'Never enter card numbers, CVV, PIN, OTP, passwords or identity numbers.',
      finderEyebrow:'A STARTING POINT, NOT AN APPROVAL DECISION',finderTitle:'Find your next step',finderDesc:'Tell us a little about your situation. You can leave anything blank that you do not know.',userType:'Which describes you?',newUser:"I'm new to credit cards",existingUser:'I already have a card',age:'Age',income:'Monthly income (₹)',employment:'Current situation',preferNot:'Prefer not to say',student:'Student',salaried:'Salaried',selfEmployed:'Self-employed',other:'Other / no income',fdAvailable:'I could consider a fixed deposit (FD)',fdAmount:'Amount I could comfortably set aside in an FD (₹, optional)',onlineSpend:'Online shopping / bills each month (₹)',offlineSpend:'In-store spending / month (₹)',fuelSpend:'Fuel / month (₹)',compare:'Show my possible paths',formDisclaimer:'This estimates a route to explore. It cannot verify eligibility or predict approval.',resultsEmptyTitle:'Your results will appear here',resultsEmptyText:'We will suggest a learning path and show illustrative card comparisons where available.',
      voiceFillTitle:'Prefer speaking?',voiceFillHint:'Describe your situation and main goal in Hindi, Marathi or English. CardSaathi will fill only details it can recognise; please review them.',voiceFillButton:'🎙 Speak to fill this form',voiceListening:'Listening… say your situation and goal.',voiceParsing:'I heard you. Mapping details into the form…',voiceSuccess:'Form filled from your speech. Please review every field before continuing.',voiceFailed:'Could not map the speech. Check the transcript and fill the fields manually.',voiceTranscriptLabel:'Heard',sensitiveDataHidden:'[Sensitive details removed from chat for safety.]',privacyBlocked:'For your safety, don’t enter secrets here. Sensitive details were not forwarded to the AI provider.',primaryGoal:'What matters most to you?',goalBuildHistory:'Build credit history',goalCashback:'Cashback on regular spending',goalOnline:'Online shopping rewards',goalUPI:'Use an eligible credit card on UPI for merchant payments',goalTravel:'Travel / foreign-currency spending',goalFuel:'Fuel-related savings',goalLowFees:'Keep card fees low',goalManage:'Understand or manage my current card',goalDebt:'Manage repayments / avoid debt trouble',goalBills:'Cashback on utility / telecom bills',creditHistory:'Credit history',historyUnsure:'Not sure',historyNone:'No credit history / no score',historyLimited:'Limited history',historyEstablished:'I have a credit history',paymentCapacity:'Could you comfortably pay the full bill by the due date?',paymentUnsure:'Not sure yet',paymentYes:'Yes, for normal planned spending',paymentNo:'No / I currently pay only the minimum',usesUPI:'Do you use UPI regularly?',upiUnsure:'Not sure / skip',upiYes:'Yes',upiNo:'No',pathTitle:'Your personalised next steps',goalLabel:'Your main goal',rankingExplanation:'How to read these matches',whyFit:'Why this may fit',benefitsLabel:'Potential benefits',risksLabel:'Risks and trade-offs',eligibilityLabel:'Eligibility notes',applicationGuide:'How to apply online more safely',applicationNote:'Important: the bank handles KYC and makes the final decision.',applyStepsTitle:'Before you click Submit',currentTerms:'Check current issuer terms',matchedGoal:'Matches your stated goal',exploreOnly:'Worth exploring; not a clear goal match',sourceChecked:'Official source checked',needsRecheck:'Needs re-verification',annualFeeLabel:'Published annual fee (verify before applying)',feeWaiverLabel:'Possible fee-waiver threshold',fdRequirement:'FD-backed; deposit may be locked/lien-marked',pathOnly:'Personalised guidance path',voicePrivacy:'Do not speak or enter OTP, CVV, PIN, passwords, full card numbers or identity numbers.',
      learnEyebrow:'LEARN AT YOUR OWN PACE',learnTitle:'Understand before you apply',learnDesc:'Short lessons and trusted links. Product-specific terms should always be checked with the issuer.',glossaryTitle:'Credit-card words, in plain language',glossaryDesc:'Tap a term to ask the assistant for an example.',resourcesTitle:'Go deeper with trusted sources',resourcesDesc:'These are learning links, not endorsements. For the current fee and eligibility rules, use the card issuer\'s official page.',footer:'CardSaathi is an educational prototype, not a bank, lender or credit bureau. Card terms change; confirm every important detail with the official issuer.',ledgerChecking:'Checking workflow ledger…',ledgerDemo:'Demo mode: local SQLite simulation, not a DRUNIX blockchain.',ledgerLive:'DRUNIX gateway reachable; a successful write is needed to prove a committed ledger transaction.',ledgerUnready:'DRUNIX gateway is not ready. No demo fallback will be used in DRUNIX mode.',receiptTitle:'Optional application-journey receipt',receiptDescription:'Create a minimal audit receipt for the card you chose. This does not send your profile to a bank or submit an application.',receiptConsent:'I consent to record a pseudonymous card-selection / handoff event for this demo.',receiptButton:'Create journey receipt',receiptConsentRequired:'Please consent first.',receiptCreated:'Receipt created:',receiptModeDemo:'Local demo simulation — not a DRUNIX transaction.',receiptModeLive:'Recorded through the configured DRUNIX gateway.',receiptLedgerVerified:'Commit confirmed and the receipt was read back from the ledger.',receiptTransaction:'DRUNIX transaction ID:',receiptCheck:'Check status',receiptHistory:'Show audit history',receiptRevoke:'Revoke consent',receiptRevoked:'Consent revoked.',continueIssuer:'Continue to official issuer site ↗',receiptNoApp:'This receipt does not apply for a card or transmit details to the issuer.',issuerWorkflowTitle:'Issuer-side workflow',issuerDemoDescription:'Sandbox simulation only: these updates are written to local SQLite, not to DRUNIX and not to a real bank.',issuerLiveDescription:'Live issuer actions use the separately configured Org2 gateway. Updates count as verified only after commit and ledger read-back.',issuerUpdating:'Submitting issuer status update…',issuerLiveSuccess:'Issuer status committed and verified by ledger read-back.',issuerDemoSuccess:'Sandbox status updated locally. This is not a DRUNIX transaction.',issuerNoMoreUpdates:'No further status changes are allowed after consent revocation.',issuerTokenLabel:'Issuer console access (issuer/operator only)',issuerTokenPlaceholder:'Enter DRUNIX_ISSUER_CONSOLE_TOKEN',issuerTokenRequired:'Enter the issuer console token before submitting this update.',
      greet:"Namaste! I'm CardSaathi. I can help you learn about credit cards, explore an FD-backed route if you have no income or credit history, compare options, understand your current card, and stay safe from scams. What would you like help with?",
      error:'I could not get an answer. Please try again in a moment.',waiting:'CardSaathi is thinking…',listening:'Listening… speak your question now.',micUnavailable:'Voice input is not supported in this browser. Try Chrome or Edge, or type your question.',emptyQuestion:'Type or speak a question first.',aiConfigured:'AI connected',aiMissing:'Add your Groq key in local .env',readMore:'Open trusted resource ↗',askTerm:'Ask CardSaathi about this',listen:'Read aloud',stop:'Stop audio',
      lessonTitles:{fd:'FD-backed card: your route into credit',upi:'RuPay credit card on UPI',minimum:'Minimum due vs full payment',safety:'Scam and card safety'},lessonIcons:{fd:'🪴',upi:'📲',minimum:'⚠️',safety:'🛡'},
      resultNoteTitle:'Important: demo estimates only',estimatedRewards:'Estimated yearly rewards',annualFee:'Estimated annual fee',netValue:'Estimated net value',unverified:'Unverified sample data',officialSite:'Open issuer website ↗',noResultsTitle:'Let’s find a safe starting point',noResultsText:'The current sample list does not show a verified match. This does not mean you can never get a card. Learn about FD-backed or add-on options, then check the issuer’s official rules.',
      prompt:{fd:'I have no income or credit history. Explain my options step by step.',upi:'Can I use a RuPay credit card on UPI?',minimum:'What is minimum due, and why can it be costly?',glossary:'Explain credit-card words in simple language.',existing:'Help me review my current credit card.',scam:'How do I spot a credit-card scam?'}
    },
    hi: {
      tagline:'आपका क्रेडिट कार्ड साथी',topMatchTitle:'आपके लिए मुख्य विकल्प',topPick:'आपके लक्ष्य से सबसे अच्छा मेल',alternativesTitle:'तुलना के लिए दूसरे कार्ड',catalogTitle:'कार्ड सूची देखें',catalogDesc:'यह अलग-अलग ज़रूरतों के लिए सीमित नमूना सूची है। आवेदन से पहले बैंक की मौजूदा शर्तें जाँचें।',searchCardsLabel:'कार्ड सूची में खोजें',searchCards:'कार्ड या बैंक का नाम खोजें…',catalogEmpty:'इस खोज से कोई कार्ड नहीं मिला।',catalogCount:'इस नमूना सूची में {n} कार्ड हैं — भारत के सभी कार्ड नहीं।',answerSources:'जाँचने के लिए स्रोत',sourceStatusChecked:'बैंक का स्रोत देखा; शर्तें दोबारा जाँचें',sourceStatusReview:'दोबारा जाँच ज़रूरी',language:'भाषा',eyebrow:'क्रेडिट कार्ड आसान भाषा में',headline:'न कठिन शब्द, न कोई झिझक। बस साफ़ और आसान अगले कदम।',subhead:'क्रेडिट कार्ड समझें, विकल्पों की तुलना करें, बिल पढ़ना सीखें और सुरक्षित रहें — हिंदी, मराठी या अंग्रेज़ी में।',
      safetyTitle:'दो नियम हमेशा याद रखें',safetyLine:'OTP, CVV या PIN कभी साझा न करें। सिर्फ़ न्यूनतम देय राशि भरने से कर्ज़ लंबे समय तक रह सकता है और ज़्यादा महँगा हो सकता है।',tabAssistant:'AI सहायक',tabFinder:'मेरे लिए रास्ता',tabLearn:'सीखें और जाँचें',assistantEyebrow:'आपका व्यक्तिगत मार्गदर्शक',assistantTitle:'CardSaathi से कुछ भी पूछें',assistantDesc:'एक बार में एक सवाल पूछें। मैं आसान भाषा में समझाकर अगला कदम बताऊँगा।',tryAsking:'ऐसे सवाल पूछें',readAloud:'नए जवाब अपने-आप सुनाएँ',askPlaceholder:'क्रेडिट कार्ड के बारे में पूछें…',send:'भेजें',privacyNote:'कार्ड नंबर, CVV, PIN, OTP, पासवर्ड या पहचान नंबर कभी न लिखें।',
      finderEyebrow:'यह शुरुआती मार्गदर्शन है, मंज़ूरी का फैसला नहीं',finderTitle:'आपके लिए अगला कदम',finderDesc:'अपनी स्थिति के बारे में थोड़ा बताएँ। जो जानकारी न पता हो उसे खाली छोड़ सकते हैं।',userType:'आपकी स्थिति क्या है?',newUser:'मैं क्रेडिट कार्ड के लिए नया/नई हूँ',existingUser:'मेरे पास पहले से कार्ड है',age:'उम्र',income:'मासिक आय (₹)',employment:'अभी आपकी स्थिति',preferNot:'नहीं बताना चाहते',student:'विद्यार्थी',salaried:'नौकरी करते हैं',selfEmployed:'स्वरोज़गार',other:'अन्य / आय नहीं',fdAvailable:'मैं FD खोलने पर विचार कर सकता/सकती हूँ',fdAmount:'FD में आराम से रख सकने वाली राशि (₹, वैकल्पिक)',onlineSpend:'हर महीने ऑनलाइन खरीदारी / बिल (₹)',offlineSpend:'दुकानों में मासिक खर्च (₹)',fuelSpend:'मासिक ईंधन खर्च (₹)',compare:'मेरे संभावित विकल्प दिखाएँ',formDisclaimer:'यह सिर्फ़ रास्ते सुझाता है। पात्रता या मंज़ूरी की पुष्टि नहीं करता।',resultsEmptyTitle:'आपके परिणाम यहाँ दिखेंगे',resultsEmptyText:'हम सीखने का रास्ता और जहाँ उपलब्ध हो वहाँ उदाहरण के तौर पर कार्ड तुलना दिखाएँगे।',
      voiceFillTitle:'बोलकर बताना चाहेंगे?',voiceFillHint:'हिंदी, मराठी या अंग्रेज़ी में अपनी स्थिति और मुख्य लक्ष्य बताएँ। CardSaathi पहचानी गई जानकारी भरेगा; आगे बढ़ने से पहले हर फ़ील्ड जाँचें।',voiceFillButton:'🎙 बोलकर फ़ॉर्म भरें',voiceListening:'सुन रहा है… अपनी स्थिति और लक्ष्य बताएँ।',voiceParsing:'आपकी बात सुनी। जानकारी फ़ॉर्म में भर रहा है…',voiceSuccess:'आपकी आवाज़ से फ़ॉर्म भरा गया। आगे बढ़ने से पहले हर फ़ील्ड जाँचें।',voiceFailed:'आवाज़ से जानकारी नहीं भर पाया। सुना गया टेक्स्ट देखें और फ़ील्ड स्वयं भरें।',voiceTranscriptLabel:'सुना गया',sensitiveDataHidden:'[सुरक्षा के लिए निजी जानकारी हटा दी गई।]',privacyBlocked:'सुरक्षा के लिए गोपनीय जानकारी यहाँ न लिखें। यह जानकारी AI सेवा को नहीं भेजी गई।',primaryGoal:'आपके लिए सबसे ज़रूरी क्या है?',goalBuildHistory:'क्रेडिट इतिहास बनाना',goalCashback:'रोज़मर्रा के खर्च पर cashback',goalOnline:'ऑनलाइन खरीदारी के रिवॉर्ड',goalUPI:'दुकानदार के भुगतान के लिए योग्य कार्ड UPI पर इस्तेमाल करना',goalTravel:'यात्रा / विदेशी मुद्रा खर्च',goalFuel:'ईंधन खर्च में बचत',goalLowFees:'कार्ड की फीस कम रखना',goalManage:'मौजूदा कार्ड समझना या संभालना',goalDebt:'भुगतान सँभालना / कर्ज़ की परेशानी से बचना',goalBills:'बिलों पर cashback',creditHistory:'क्रेडिट इतिहास',historyUnsure:'पक्का नहीं',historyNone:'क्रेडिट इतिहास या स्कोर नहीं',historyLimited:'थोड़ा इतिहास है',historyEstablished:'मेरा क्रेडिट इतिहास है',paymentCapacity:'क्या आप देय तारीख तक पूरा बिल आराम से चुका सकते हैं?',paymentUnsure:'अभी पक्का नहीं',paymentYes:'हाँ, सामान्य नियोजित खर्च के लिए',paymentNo:'नहीं / अभी सिर्फ़ न्यूनतम राशि भरता/भरती हूँ',usesUPI:'क्या आप नियमित रूप से UPI इस्तेमाल करते हैं?',upiUnsure:'पक्का नहीं / छोड़ें',upiYes:'हाँ',upiNo:'नहीं',pathTitle:'आपके लिए व्यक्तिगत अगले कदम',goalLabel:'आपका मुख्य लक्ष्य',rankingExplanation:'इन विकल्पों को कैसे समझें',whyFit:'यह आपके लिए क्यों उपयोगी हो सकता है',benefitsLabel:'संभावित लाभ',risksLabel:'जोखिम और समझौते',eligibilityLabel:'पात्रता की जानकारी',applicationGuide:'ऑनलाइन आवेदन सुरक्षित तरीके से कैसे करें',applicationNote:'ज़रूरी: KYC और अंतिम निर्णय बैंक का है।',applyStepsTitle:'सबमिट करने से पहले',currentTerms:'बैंक की वर्तमान शर्तें जाँचें',matchedGoal:'आपके बताए लक्ष्य से मेल',exploreOnly:'जाँचने योग्य विकल्प; लक्ष्य से स्पष्ट मेल नहीं',sourceChecked:'आधिकारिक स्रोत जाँचा गया',needsRecheck:'दोबारा जाँच ज़रूरी',annualFeeLabel:'सूचीबद्ध वार्षिक फीस (आवेदन से पहले जाँचें)',feeWaiverLabel:'संभावित फीस-माफी खर्च सीमा',fdRequirement:'FD-backed; जमा पर lien/निकासी रोक हो सकती है',pathOnly:'आपके लिए व्यक्तिगत मार्ग',voicePrivacy:'आवाज़ में या फ़ॉर्म में OTP, CVV, PIN, पासवर्ड, पूरा कार्ड नंबर या पहचान नंबर न बताएँ।',
      learnEyebrow:'अपनी गति से सीखें',learnTitle:'आवेदन से पहले समझें',learnDesc:'छोटे पाठ और भरोसेमंद लिंक। कार्ड की सही शर्तें हमेशा बैंक से जाँचें।',glossaryTitle:'क्रेडिट कार्ड के शब्द, आसान भाषा में',glossaryDesc:'किसी शब्द पर टैप करके उसका उदाहरण पूछें।',resourcesTitle:'भरोसेमंद स्रोतों से और सीखें',resourcesDesc:'ये सीखने के लिंक हैं, किसी उत्पाद की सिफ़ारिश नहीं। वर्तमान शुल्क और पात्रता के लिए बैंक की आधिकारिक साइट देखें।',footer:'CardSaathi शिक्षा के लिए एक प्रोटोटाइप है, बैंक या ऋणदाता नहीं। कार्ड की शर्तें बदलती हैं; हर ज़रूरी जानकारी बैंक से जाँचें।',ledgerChecking:'वर्कफ़्लो लेजर जाँचा जा रहा है…',ledgerDemo:'डेमो मोड: स्थानीय SQLite सिमुलेशन, DRUNIX ब्लॉकचेन नहीं।',ledgerLive:'DRUNIX gateway उपलब्ध है; वास्तविक committed transaction की पुष्टि के लिए सफल write ज़रूरी है।',ledgerUnready:'DRUNIX gateway तैयार नहीं है। DRUNIX मोड में डेमो fallback नहीं होगा।',receiptTitle:'वैकल्पिक आवेदन-यात्रा रसीद',receiptDescription:'चुने गए कार्ड के लिए न्यूनतम audit receipt बनाएँ। इससे आपकी प्रोफ़ाइल बैंक को नहीं भेजी जाती और आवेदन जमा नहीं होता।',receiptConsent:'मैं इस डेमो में pseudonymous कार्ड-चयन / handoff event रिकॉर्ड करने की सहमति देता/देती हूँ।',receiptButton:'यात्रा रसीद बनाएँ',receiptConsentRequired:'पहले सहमति दें।',receiptCreated:'रसीद बनाई गई:',receiptModeDemo:'स्थानीय डेमो सिमुलेशन — DRUNIX transaction नहीं।',receiptModeLive:'कॉन्फ़िगर किए गए DRUNIX gateway के माध्यम से रिकॉर्ड किया गया।',receiptLedgerVerified:'कमिट की पुष्टि हुई और रसीद लेजर से दोबारा पढ़ी गई।',receiptTransaction:'DRUNIX ट्रांज़ैक्शन ID:',receiptCheck:'स्थिति जाँचें',receiptHistory:'ऑडिट इतिहास देखें',receiptRevoke:'सहमति वापस लें',receiptRevoked:'सहमति वापस ले ली गई।',continueIssuer:'बैंक की आधिकारिक साइट पर जाएँ ↗',receiptNoApp:'यह रसीद कार्ड के लिए आवेदन नहीं करती और बैंक को विवरण नहीं भेजती।',
      issuerWorkflowTitle:'जारीकर्ता-पक्ष की प्रक्रिया',issuerDemoDescription:'केवल सैंडबॉक्स सिमुलेशन: अपडेट स्थानीय SQLite में दर्ज होते हैं, DRUNIX या असली बैंक में नहीं।',issuerLiveDescription:'लाइव जारीकर्ता कार्रवाइयों के लिए अलग Org2 gateway चाहिए। अपडेट तभी सत्यापित होगा जब commit और ledger read-back सफल हों।',issuerUpdating:'जारीकर्ता स्थिति अपडेट भेज रहे हैं…',issuerLiveSuccess:'जारीकर्ता स्थिति commit हुई और ledger से पढ़कर सत्यापित की गई।',issuerDemoSuccess:'सैंडबॉक्स स्थिति स्थानीय रूप से अपडेट हुई। यह DRUNIX transaction नहीं है।',issuerNoMoreUpdates:'सहमति वापस लेने के बाद स्थिति नहीं बदली जा सकती।',issuerTokenLabel:'जारीकर्ता कंसोल एक्सेस (केवल ऑपरेटर के लिए)',issuerTokenPlaceholder:'DRUNIX_ISSUER_CONSOLE_TOKEN दर्ज करें',issuerTokenRequired:'अपडेट भेजने से पहले जारीकर्ता कंसोल टोकन दर्ज करें।',
      greet:'नमस्ते! मैं CardSaathi हूँ। मैं क्रेडिट कार्ड समझने, आय या क्रेडिट इतिहास न होने पर FD-backed विकल्प जानने, कार्डों की तुलना करने और धोखाधड़ी से सुरक्षित रहने में मदद कर सकता हूँ। आपको किस चीज़ में मदद चाहिए?',error:'अभी जवाब नहीं मिल पाया। कृपया थोड़ी देर बाद फिर कोशिश करें।',waiting:'CardSaathi जवाब तैयार कर रहा है…',listening:'सुन रहा हूँ… अपना सवाल बोलें।',micUnavailable:'इस ब्राउज़र में आवाज़ से सवाल पूछना उपलब्ध नहीं है। Chrome या Edge आज़माएँ या सवाल लिखें।',emptyQuestion:'पहले सवाल लिखें या बोलें।',aiConfigured:'AI जुड़ा है',aiMissing:'लोकल .env में Groq key डालें',readMore:'भरोसेमंद स्रोत खोलें ↗',askTerm:'इस बारे में CardSaathi से पूछें',listen:'जवाब सुनें',stop:'आवाज़ रोकें',stop:'आवाज़ रोकें',
      lessonTitles:{fd:'FD-backed कार्ड: क्रेडिट शुरू करने का रास्ता',upi:'UPI पर RuPay क्रेडिट कार्ड',minimum:'न्यूनतम राशि बनाम पूरा बिल',safety:'धोखाधड़ी और कार्ड सुरक्षा'},lessonIcons:{fd:'🪴',upi:'📲',minimum:'⚠️',safety:'🛡'},resultNoteTitle:'ज़रूरी: ये केवल उदाहरण के अनुमान हैं',estimatedRewards:'अनुमानित सालाना रिवॉर्ड',annualFee:'अनुमानित वार्षिक शुल्क',netValue:'अनुमानित शुद्ध लाभ',unverified:'नमूना डेटा सत्यापित नहीं है',officialSite:'बैंक की साइट खोलें ↗',noResultsTitle:'सुरक्षित शुरुआत ढूँढते हैं',noResultsText:'मौजूदा नमूना सूची में सत्यापित विकल्प नहीं मिला। इसका मतलब यह नहीं कि आपको कभी कार्ड नहीं मिल सकता। FD-backed या add-on विकल्प समझें और बैंक के नियम जाँचें।',
      prompt:{fd:'मेरी आय या क्रेडिट इतिहास नहीं है। विकल्प कदम-दर-कदम समझाएँ।',upi:'क्या RuPay क्रेडिट कार्ड UPI पर इस्तेमाल कर सकते हैं?',minimum:'Minimum due क्या है और यह महँगा क्यों पड़ सकता है?',glossary:'क्रेडिट कार्ड के शब्द आसान भाषा में समझाएँ।',existing:'मेरे मौजूदा क्रेडिट कार्ड की समीक्षा में मदद करें।',scam:'क्रेडिट कार्ड की धोखाधड़ी कैसे पहचानें?'}
    },
    mr: {
      tagline:'तुमचा क्रेडिट कार्ड सोबती',topMatchTitle:'तुमच्यासाठी मुख्य पर्याय',topPick:'तुमच्या उद्दिष्टाशी सर्वाधिक जुळणारा पर्याय',alternativesTitle:'तुलना करण्यासाठी इतर कार्डे',catalogTitle:'कार्डांची यादी पाहा',catalogDesc:'वेगवेगळ्या गरजांसाठी मर्यादित नमुना यादी. अर्ज करण्यापूर्वी बँकेच्या सध्याच्या अटी तपासा.',searchCardsLabel:'कार्डांच्या यादीत शोधा',searchCards:'कार्ड किंवा बँकेचे नाव शोधा…',catalogEmpty:'या शोधाशी जुळणारे कार्ड नाही.',catalogCount:'या नमुना यादीत {n} कार्डे आहेत — भारतातील सर्व कार्डे नाहीत.',answerSources:'तपासण्यासाठी स्रोत',sourceStatusChecked:'बँकेचे स्रोत पाहिले; अटी पुन्हा तपासा',sourceStatusReview:'पुन्हा पडताळणी आवश्यक',language:'भाषा',eyebrow:'क्रेडिट कार्ड सोप्या भाषेत',headline:'अवघड शब्द नाहीत. संकोच नाही. फक्त स्पष्ट पुढची पावले.',subhead:'कार्ड समजून घ्या, पर्यायांची तुलना करा, बिल वाचायला शिका आणि सुरक्षित राहा — मराठी, हिंदी किंवा इंग्रजीत.',
      safetyTitle:'दोन नियम नेहमी लक्षात ठेवा',safetyLine:'OTP, CVV किंवा PIN कधीही सांगू नका. फक्त किमान देय रक्कम भरल्यास कर्ज जास्त काळ राहू शकते आणि अधिक खर्चिक होऊ शकते.',tabAssistant:'AI मदतनीस',tabFinder:'माझ्यासाठी मार्ग',tabLearn:'शिका आणि तपासा',assistantEyebrow:'तुमचा वैयक्तिक मार्गदर्शक',assistantTitle:'CardSaathi ला काहीही विचारा',assistantDesc:'एका वेळी एक प्रश्न विचारा. मी सोप्या भाषेत समजावून पुढची पायरी सांगेन.',tryAsking:'असे प्रश्न विचारा',readAloud:'नवीन उत्तरे आपोआप ऐकवा',askPlaceholder:'क्रेडिट कार्डबद्दल विचारा…',send:'पाठवा',privacyNote:'कार्ड नंबर, CVV, PIN, OTP, पासवर्ड किंवा ओळख क्रमांक कधीही लिहू नका.',
      finderEyebrow:'ही सुरुवातीची माहिती आहे, मंजुरीचा निर्णय नाही',finderTitle:'तुमच्यासाठी पुढचे पाऊल',finderDesc:'तुमच्या परिस्थितीबद्दल थोडे सांगा. माहीत नसलेली माहिती रिकामी ठेवू शकता.',userType:'तुमची परिस्थिती कोणती?',newUser:'मी क्रेडिट कार्डसाठी नवीन आहे',existingUser:'माझ्याकडे आधीच कार्ड आहे',age:'वय',income:'मासिक उत्पन्न (₹)',employment:'सध्याची परिस्थिती',preferNot:'सांगू इच्छित नाही',student:'विद्यार्थी',salaried:'नोकरी करणारा/करणारी',selfEmployed:'स्वयंरोजगार',other:'इतर / उत्पन्न नाही',fdAvailable:'मी FD उघडण्याचा विचार करू शकतो/शकते',fdAmount:'FD मध्ये ठेवू शकणारी रक्कम (₹, ऐच्छिक)',onlineSpend:'दरमहा ऑनलाइन खरेदी / बिले (₹)',offlineSpend:'दुकानांमधील मासिक खर्च (₹)',fuelSpend:'मासिक इंधन खर्च (₹)',compare:'माझे संभाव्य मार्ग दाखवा',formDisclaimer:'हे फक्त पर्याय शोधायला मदत करते. पात्रता किंवा मंजुरीची खात्री देत नाही.',resultsEmptyTitle:'तुमचे निकाल येथे दिसतील',resultsEmptyText:'आम्ही शिकण्याचा मार्ग आणि उपलब्ध असल्यास उदाहरणार्थ कार्ड तुलना दाखवू.',
      voiceFillTitle:'बोलून सांगायचे आहे?',voiceFillHint:'मराठी, हिंदी किंवा इंग्रजीत तुमची परिस्थिती आणि मुख्य उद्दिष्ट सांगा. CardSaathi ओळखलेली माहिती फॉर्ममध्ये भरेल; पुढे जाण्यापूर्वी प्रत्येक फील्ड तपासा.',voiceFillButton:'🎙 बोलून फॉर्म भरा',voiceListening:'ऐकत आहे… तुमची परिस्थिती आणि उद्दिष्ट सांगा.',voiceParsing:'तुमचे बोलणे ऐकले. माहिती फॉर्ममध्ये भरत आहे…',voiceSuccess:'तुमच्या आवाजावरून फॉर्म भरला. पुढे जाण्यापूर्वी प्रत्येक फील्ड तपासा.',voiceFailed:'आवाजातून माहिती भरता आली नाही. ऐकलेला मजकूर तपासा आणि फॉर्म स्वतः भरा.',voiceTranscriptLabel:'ऐकलेले',sensitiveDataHidden:'[सुरक्षेसाठी गोपनीय माहिती काढली आहे.]',privacyBlocked:'सुरक्षेसाठी गोपनीय माहिती येथे देऊ नका. ही माहिती AI सेवेकडे पाठवलेली नाही.',primaryGoal:'तुमच्यासाठी सर्वात महत्त्वाचे काय?',goalBuildHistory:'क्रेडिट इतिहास तयार करणे',goalCashback:'दैनंदिन खर्चावर cashback',goalOnline:'ऑनलाइन खरेदीवरील रिवॉर्ड',goalUPI:'दुकानदाराच्या पेमेंटसाठी पात्र कार्ड UPI वर वापरणे',goalTravel:'प्रवास / परकीय चलनातील खर्च',goalFuel:'इंधन खर्चात बचत',goalLowFees:'कार्डचे शुल्क कमी ठेवणे',goalManage:'सध्याचे कार्ड समजून घेणे किंवा व्यवस्थापन',goalDebt:'परतफेड सांभाळणे / कर्जाच्या अडचणी टाळणे',goalBills:'बिलांवरील cashback',creditHistory:'क्रेडिट इतिहास',historyUnsure:'खात्री नाही',historyNone:'क्रेडिट इतिहास किंवा स्कोअर नाही',historyLimited:'मर्यादित इतिहास',historyEstablished:'माझा क्रेडिट इतिहास आहे',paymentCapacity:'देय तारखेपर्यंत पूर्ण बिल सहज भरू शकाल का?',paymentUnsure:'अजून खात्री नाही',paymentYes:'हो, नियोजित सामान्य खर्चासाठी',paymentNo:'नाही / सध्या फक्त किमान रक्कम भरतो/भरते',usesUPI:'तुम्ही नियमित UPI वापरता का?',upiUnsure:'खात्री नाही / वगळा',upiYes:'हो',upiNo:'नाही',pathTitle:'तुमच्यासाठी वैयक्तिक पुढची पावले',goalLabel:'तुमचे मुख्य उद्दिष्ट',rankingExplanation:'या पर्यायांचा अर्थ कसा लावावा',whyFit:'हा पर्याय का उपयोगी ठरू शकतो',benefitsLabel:'संभाव्य फायदे',risksLabel:'धोके आणि तडजोडी',eligibilityLabel:'पात्रतेची माहिती',applicationGuide:'ऑनलाइन अर्ज अधिक सुरक्षितपणे कसा करावा',applicationNote:'महत्त्वाचे: KYC आणि अंतिम निर्णय बँकेचा असतो.',applyStepsTitle:'सबमिट करण्यापूर्वी',currentTerms:'बँकेच्या सध्याच्या अटी तपासा',matchedGoal:'तुमच्या उद्दिष्टाशी जुळतो',exploreOnly:'तपासण्याजोगा पर्याय; उद्दिष्टाशी स्पष्ट जुळत नाही',sourceChecked:'अधिकृत स्रोत तपासला',needsRecheck:'पुन्हा पडताळणी आवश्यक',annualFeeLabel:'सूचीबद्ध वार्षिक शुल्क (अर्जापूर्वी तपासा)',feeWaiverLabel:'शुल्क माफीसाठी संभाव्य खर्चाची अट',fdRequirement:'FD-backed; ठेवीवर lien/काढण्याची मर्यादा असू शकते',pathOnly:'तुमच्यासाठी वैयक्तिक मार्ग',voicePrivacy:'आवाजात किंवा फॉर्ममध्ये OTP, CVV, PIN, पासवर्ड, पूर्ण कार्ड क्रमांक किंवा ओळख क्रमांक सांगू नका.',
      learnEyebrow:'तुमच्या गतीने शिका',learnTitle:'अर्ज करण्यापूर्वी समजून घ्या',learnDesc:'लहान धडे आणि विश्वासार्ह दुवे. कार्डच्या सध्याच्या अटी बँकेकडूनच तपासा.',glossaryTitle:'क्रेडिट कार्डचे शब्द, सोप्या भाषेत',glossaryDesc:'एखाद्या शब्दावर टॅप करून उदाहरण विचारा.',resourcesTitle:'विश्वासार्ह स्रोतांकडून अधिक शिका',resourcesDesc:'हे शिकण्यासाठीचे दुवे आहेत, उत्पादनाची शिफारस नाहीत. सध्याचे शुल्क आणि पात्रतेसाठी बँकेची अधिकृत साइट पहा.',footer:'CardSaathi हा शिक्षणासाठीचा प्रोटोटाइप आहे; बँक किंवा कर्जदाता नाही. कार्डच्या अटी बदलतात; महत्त्वाची माहिती अधिकृत बँकेकडून तपासा.',ledgerChecking:'वर्कफ्लो लेजर तपासत आहे…',ledgerDemo:'डेमो मोड: स्थानिक SQLite सिम्युलेशन; DRUNIX ब्लॉकचेन नाही.',ledgerLive:'DRUNIX gateway उपलब्ध आहे; प्रत्यक्ष committed transaction सिद्ध करण्यासाठी यशस्वी write आवश्यक आहे.',ledgerUnready:'DRUNIX gateway तयार नाही. DRUNIX मोडमध्ये डेमो fallback होणार नाही.',receiptTitle:'पर्यायी अर्ज-प्रवास पावती',receiptDescription:'निवडलेल्या कार्डासाठी किमान audit पावती तयार करा. यामुळे तुमची प्रोफाइल बँकेला पाठवली जात नाही किंवा अर्ज जमा होत नाही.',receiptConsent:'या डेमोसाठी pseudonymous कार्ड-निवड / handoff घटना नोंदवण्यास माझी संमती आहे.',receiptButton:'प्रवासाची पावती तयार करा',receiptConsentRequired:'आधी संमती द्या.',receiptCreated:'पावती तयार झाली:',receiptModeDemo:'स्थानिक डेमो सिम्युलेशन — DRUNIX transaction नाही.',receiptModeLive:'कॉन्फिगर केलेल्या DRUNIX gateway द्वारे नोंदवले.',receiptLedgerVerified:'कमिटची पुष्टी झाली आणि पावती लेजरमधून पुन्हा वाचली.',receiptTransaction:'DRUNIX व्यवहार ID:',receiptCheck:'स्थिती तपासा',receiptHistory:'ऑडिट इतिहास पाहा',receiptRevoke:'संमती मागे घ्या',receiptRevoked:'संमती मागे घेतली.',continueIssuer:'बँकेच्या अधिकृत साइटवर पुढे जा ↗',receiptNoApp:'ही पावती कार्डासाठी अर्ज करत नाही किंवा बँकेला तपशील पाठवत नाही.',
      issuerWorkflowTitle:'जारीकर्ता-पक्षाची प्रक्रिया',issuerDemoDescription:'फक्त sandbox सिम्युलेशन: अपडेट स्थानिक SQLite मध्ये नोंदवले जातात; DRUNIX किंवा प्रत्यक्ष बँकेत नाहीत.',issuerLiveDescription:'प्रत्यक्ष जारीकर्ता कृतींसाठी स्वतंत्र Org2 gateway आवश्यक आहे. Commit आणि ledger read-back झाल्यावरच अपडेट सत्यापित मानले जाईल.',issuerUpdating:'जारीकर्त्याच्या स्थितीचा अपडेट पाठवत आहे…',issuerLiveSuccess:'जारीकर्त्याची स्थिती commit झाली आणि ledger मधून वाचून पडताळली.',issuerDemoSuccess:'Sandbox स्थिती स्थानिक पातळीवर अपडेट झाली. हा DRUNIX व्यवहार नाही.',issuerNoMoreUpdates:'संमती मागे घेतल्यानंतर स्थिती बदलता येत नाही.',issuerTokenLabel:'जारीकर्ता कन्सोल प्रवेश (फक्त ऑपरेटरसाठी)',issuerTokenPlaceholder:'DRUNIX_ISSUER_CONSOLE_TOKEN टाका',issuerTokenRequired:'अपडेट पाठवण्यापूर्वी जारीकर्ता कन्सोल टोकन टाका.',
      greet:'नमस्कार! मी CardSaathi आहे. क्रेडिट कार्ड समजून घेणे, उत्पन्न किंवा क्रेडिट इतिहास नसल्यास FD-backed पर्याय जाणून घेणे, कार्डांची तुलना आणि फसवणुकीपासून सुरक्षित राहणे यात मी मदत करू शकतो. तुम्हाला कशाबद्दल मदत हवी आहे?',error:'आत्ता उत्तर मिळाले नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.',waiting:'CardSaathi उत्तर तयार करत आहे…',listening:'ऐकत आहे… तुमचा प्रश्न बोला.',micUnavailable:'या ब्राउझरमध्ये आवाजाने प्रश्न विचारणे उपलब्ध नाही. Chrome किंवा Edge वापरा किंवा प्रश्न टाइप करा.',emptyQuestion:'आधी प्रश्न टाइप करा किंवा बोला.',aiConfigured:'AI जोडले आहे',aiMissing:'लोकल .env मध्ये Groq key जोडा',readMore:'विश्वासार्ह स्रोत उघडा ↗',askTerm:'याबद्दल CardSaathi ला विचारा',listen:'उत्तर ऐका',stop:'आवाज थांबवा',
      lessonTitles:{fd:'FD-backed कार्ड: क्रेडिट सुरू करण्याचा मार्ग',upi:'UPI वर RuPay क्रेडिट कार्ड',minimum:'किमान देय रक्कम विरुद्ध पूर्ण बिल',safety:'फसवणूक आणि कार्ड सुरक्षा'},lessonIcons:{fd:'🪴',upi:'📲',minimum:'⚠️',safety:'🛡'},resultNoteTitle:'महत्त्वाचे: हे फक्त उदाहरणार्थ अंदाज आहेत',estimatedRewards:'अंदाजित वार्षिक रिवॉर्ड',annualFee:'अंदाजित वार्षिक शुल्क',netValue:'अंदाजित निव्वळ मूल्य',unverified:'नमुना डेटा पडताळलेला नाही',officialSite:'बँकेची वेबसाइट उघडा ↗',noResultsTitle:'सुरक्षित सुरुवात शोधूया',noResultsText:'सध्याच्या नमुना यादीत पडताळलेला पर्याय दिसत नाही. याचा अर्थ तुम्हाला कधीच कार्ड मिळू शकत नाही असा नाही. FD-backed किंवा add-on पर्याय समजून घ्या आणि बँकेचे नियम तपासा.',
      prompt:{fd:'माझे उत्पन्न किंवा क्रेडिट इतिहास नाही. पर्याय टप्प्याटप्प्याने समजावून सांगा.',upi:'RuPay क्रेडिट कार्ड UPI वर वापरता येते का?',minimum:'Minimum due म्हणजे काय आणि ते महाग का पडू शकते?',glossary:'क्रेडिट कार्डचे शब्द सोप्या भाषेत समजावून सांगा.',existing:'माझ्या सध्याच्या क्रेडिट कार्डचे पुनरावलोकन करा.',scam:'क्रेडिट कार्डची फसवणूक कशी ओळखावी?'}
    }
  };
  const lessonIds = ['fd','upi','minimum','safety'];
  const glossaryTerms = {
    en:[['limit','Credit limit'],['statement','Statement'],['due date','Due date'],['minimum due','Minimum due'],['interest-free period','Interest-free period'],['cibil','CIBIL score'],['fd','Fixed Deposit (FD)'],['rupay','RuPay']],
    hi:[['limit','क्रेडिट लिमिट'],['statement','स्टेटमेंट'],['due date','देय तारीख'],['minimum due','न्यूनतम देय राशि'],['interest-free period','ब्याज-मुक्त अवधि'],['cibil','CIBIL स्कोर'],['fd','फिक्स्ड डिपॉज़िट (FD)'],['rupay','RuPay']],
    mr:[['limit','क्रेडिट मर्यादा'],['statement','स्टेटमेंट'],['due date','देय तारीख'],['minimum due','किमान देय रक्कम'],['interest-free period','व्याजमुक्त कालावधी'],['cibil','CIBIL स्कोअर'],['fd','फिक्स्ड डिपॉझिट (FD)'],['rupay','RuPay']]
  };
  const lessonFallback = {
    en:{fd:'A Fixed Deposit is money held with a bank under chosen terms. Some issuers offer a secured card against an FD and may place a lien on the deposit. The issuer sets the limit; the FD may not be freely withdrawable while it secures the card. Pay the full bill on time. This may help build credit history, but no score or timeline is guaranteed.',upi:'Eligible RuPay credit cards can link to supported UPI apps for permitted merchant QR payments. Person-to-person transfers and cash withdrawals are not permitted through this feature. App, issuer and merchant eligibility can differ; see NPCI’s current guidance.',minimum:'The minimum due is not the full bill. If you pay only the minimum, the rest can accrue interest and repayment may stretch over months or years. When affordable, pay the full statement balance by the due date. Check your own card’s APR and conditions.',safety:'Never share an OTP, CVV, PIN, password or full card details. Ignore links promising guaranteed approval or instant limit increases until independently verified. For an unfamiliar transaction, contact your issuer using its official app or the number printed on your card.'},
    hi:{fd:'FD में पैसा बैंक में तय शर्तों पर रखा जाता है। कुछ बैंक FD के बदले secured card देते हैं और जमा पर lien लगा सकते हैं। लिमिट बैंक तय करता है और FD तुरंत निकालना संभव न हो। पूरा बिल समय पर भरें। इससे क्रेडिट इतिहास बनाने में मदद मिल सकती है, लेकिन स्कोर या समय की गारंटी नहीं है।',upi:'योग्य RuPay कार्ड समर्थित UPI ऐप से जोड़कर अनुमति वाले दुकानदार QR भुगतान के लिए इस्तेमाल किए जा सकते हैं। व्यक्ति-से-व्यक्ति ट्रांसफर और नकद निकासी इस सुविधा में अनुमति-योग्य नहीं हैं। बैंक, ऐप और व्यापारी के नियम अलग हो सकते हैं; NPCI के निर्देश देखें।',minimum:'न्यूनतम देय राशि पूरा बिल नहीं है। केवल न्यूनतम राशि देने पर बाकी पर ब्याज लग सकता है और भुगतान महीनों या सालों तक चल सकता है। जब संभव हो, देय तारीख तक पूरा बिल भरें। अपने कार्ड की ब्याज दर और शर्तें जाँचें।',safety:'OTP, CVV, PIN, पासवर्ड या कार्ड की पूरी जानकारी साझा न करें। गारंटीड मंज़ूरी या लिमिट बढ़ाने वाले लिंक पहले आधिकारिक स्रोत से जाँचें। अनजान ट्रांज़ैक्शन पर बैंक के आधिकारिक ऐप या कार्ड पर दिए नंबर से संपर्क करें।'},
    mr:{fd:'FD म्हणजे बँकेत ठरावीक अटींवर ठेवलेली रक्कम. काही बँका FD च्या हमीवर secured card देतात आणि FD वर lien ठेवू शकतात. मर्यादा बँक ठरवते; कार्डासाठी जोडलेली FD लगेच काढता येणार नाही. पूर्ण बिल वेळेवर भरा. यामुळे क्रेडिट इतिहास तयार होण्यास मदत होऊ शकते, पण स्कोअर किंवा कालावधीची हमी नाही.',upi:'पात्र RuPay कार्ड समर्थित UPI ॲपशी जोडून परवानगीचे व्यापारी QR व्यवहार करता येतात. व्यक्ती-ते-व्यक्ती ट्रान्सफर आणि रोख रक्कम काढणे या सुविधेत मान्य नाहीत. बँक, ॲप आणि व्यापाऱ्यानुसार नियम बदलतात; NPCI च्या सूचना तपासा.',minimum:'किमान देय रक्कम म्हणजे पूर्ण बिल नाही. फक्त किमान रक्कम भरल्यास बाकी रकमेवर व्याज लागू शकते आणि परतफेड महिने किंवा वर्षे चालू शकते. शक्य असल्यास देय तारखेपर्यंत पूर्ण बिल भरा. तुमच्या कार्डाचा व्याजदर आणि अटी तपासा.',safety:'OTP, CVV, PIN, पासवर्ड किंवा कार्डची संपूर्ण माहिती कोणालाही सांगू नका. हमखास मंजुरी किंवा लिमिट वाढवण्याच्या लिंक अधिकृत स्रोतावरून तपासा. अनोळखी व्यवहारासाठी बँकेच्या अधिकृत ॲप किंवा कार्डावरील नंबरवर संपर्क साधा.'}
  };

  function t(key){ return strings[state.lang][key] ?? strings.en[key] ?? key; }
  function text(el, value){ el.textContent = value ?? ''; }
  function formatINR(value){ return new Intl.NumberFormat(state.lang==='en'?'en-IN':state.lang==='hi'?'hi-IN':'mr-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value||0)); }
  async function api(url, options={}){
    const response = await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    if(!response.ok){let message=`Request failed (${response.status})`;try{const data=await response.json();message=data.detail||message}catch{}throw new Error(message)}
    const type=response.headers.get('content-type')||'';return type.includes('application/json')?response.json():response.blob();
  }
  function setLanguage(lang){
    stopSpeech();
    state.lang = strings[lang] ? lang : 'en'; document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-t]').forEach(el=>{const key=el.getAttribute('data-t');if(t(key)!==key)el.textContent=t(key)});
    document.querySelectorAll('[data-t-placeholder]').forEach(el=>{el.placeholder=t(el.getAttribute('data-t-placeholder'))});
    document.querySelectorAll('#language option').forEach(opt=>opt.selected=opt.value===state.lang);
    renderLessonsAndGlossary(); renderResources(); renderCardCatalog(); loadLedgerStatus();
    document.querySelectorAll('.prompt-chip').forEach(btn=>btn.textContent=t('prompt')[btn.dataset.question]||btn.textContent);
    checkHealth();
  }
  function resetSpeechButton(button){
    if(!button)return;
    button.textContent='🔊 '+t('listen');
    button.setAttribute('aria-pressed','false');
  }
  function cleanupAudio(playback){
    if(playback.audio){
      playback.audio.onended=null;playback.audio.onerror=null;
      try{playback.audio.pause();playback.audio.currentTime=0;playback.audio.removeAttribute('src');playback.audio.load()}catch{}
    }
    if(playback.objectUrl){try{URL.revokeObjectURL(playback.objectUrl)}catch{}}
    playback.audio=null;playback.objectUrl=null;
  }
  function finishSpeech(token){
    const playback=state.speech;
    if(token!==playback.token)return;
    cleanupAudio(playback);
    if(playback.controller){try{playback.controller.abort()}catch{}}
    resetSpeechButton(playback.button);
    playback.utterance=null;playback.button=null;playback.controller=null;playback.activeText='';
    playback.active=false;playback.automatic=false;
    const stop=$('stopSpeechButton');if(stop)stop.hidden=true;
  }
  function stopSpeech(){
    const playback=state.speech;
    // Invalidate async TTS/network callbacks first, then stop BOTH possible playback engines.
    playback.token+=1;
    if(playback.controller){try{playback.controller.abort()}catch{}}
    playback.controller=null;
    cleanupAudio(playback);
    if('speechSynthesis' in window){try{window.speechSynthesis.cancel();window.speechSynthesis.resume()}catch{}}
    resetSpeechButton(playback.button);
    playback.utterance=null;playback.button=null;playback.activeText='';
    playback.active=false;playback.automatic=false;
    const stop=$('stopSpeechButton');if(stop)stop.hidden=true;
  }
  // Render the model's Markdown as DOM nodes instead of showing the Markdown
  // punctuation literally. This renderer deliberately never assigns model text
  // to innerHTML, so raw HTML returned by a model is displayed as text.
  function appendInlineMarkdown(parent, source){
    const pattern=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|~~([\s\S]+?)~~|`([^`]+)`|\*([^*]+?)\*|_([^_]+?)_/g;
    const value=String(source??'');let cursor=0,match;
    while((match=pattern.exec(value))!==null){
      if(match.index>cursor)parent.appendChild(document.createTextNode(value.slice(cursor,match.index)));
      let node;
      if(match[1]!==undefined){
        // Only http(s) links are created; javascript:, data:, and other schemes stay text.
        try{
          const parsed=new URL(match[2]);
          if(parsed.protocol==='http:'||parsed.protocol==='https:'){
            node=document.createElement('a');node.href=parsed.href;node.target='_blank';node.rel='noopener noreferrer';
            appendInlineMarkdown(node,match[1]);
          }
        }catch{}
        if(!node)node=document.createTextNode(match[0]);
      }else if(match[3]!==undefined||match[4]!==undefined){
        node=document.createElement('strong');appendInlineMarkdown(node,match[3]??match[4]);
      }else if(match[5]!==undefined){
        node=document.createElement('del');appendInlineMarkdown(node,match[5]);
      }else if(match[6]!==undefined){
        node=document.createElement('code');node.textContent=match[6];
      }else{
        node=document.createElement('em');appendInlineMarkdown(node,match[7]??match[8]);
      }
      parent.appendChild(node);cursor=pattern.lastIndex;
    }
    if(cursor<value.length)parent.appendChild(document.createTextNode(value.slice(cursor)));
  }
  function markdownTableCells(line){
    let value=String(line).trim();
    if(value.startsWith('|'))value=value.slice(1);
    if(value.endsWith('|'))value=value.slice(0,-1);
    return value.split('|').map(cell=>cell.trim());
  }
  function isMarkdownTableSeparator(line){
    const cells=markdownTableCells(line);
    return cells.length>0&&cells.every(cell=>/^:?-{3,}:?$/.test(cell));
  }
  function renderMarkdown(container, content){
    // Some model outputs over-escape Markdown punctuation (e.g. \### and \*\*).
    const source=String(content??'').replace(/\\(?=[#*_`>|~])/g,'');
    const lines=source.replace(/\r\n?/g,'\n').split('\n');let i=0;
    const startsBlock=(index)=>{
      const line=lines[index]??'';
      return /^\s*$/.test(line)||/^\s{0,3}(#{1,6})\s+/.test(line)||/^\s{0,3}(?:```|~~~)/.test(line)||/^\s{0,3}>/.test(line)||/^\s{0,3}(?:[-+*])\s+/.test(line)||/^\s{0,3}\d+[.)]\s+/.test(line)||/^\s{0,3}(?:---+|___+|\*\*\*+)\s*$/.test(line)||(line.includes('|')&&isMarkdownTableSeparator(lines[index+1]??''));
    };
    while(i<lines.length){
      const line=lines[i];
      if(!line.trim()){i++;continue;}
      const fence=line.match(/^\s{0,3}(```|~~~)\s*([^\s`]*)?.*$/);
      if(fence){
        const marker=fence[1],language=(fence[2]||'').replace(/[^a-zA-Z0-9_-]/g,'');i++;
        const codeLines=[];
        while(i<lines.length&&!new RegExp('^\\s{0,3}'+(marker==='```'?'```':'~~~')).test(lines[i]))codeLines.push(lines[i++]);
        if(i<lines.length)i++;
        const pre=document.createElement('pre');const code=document.createElement('code');if(language)code.className='language-'+language;code.textContent=codeLines.join('\n');pre.appendChild(code);container.appendChild(pre);continue;
      }
      const heading=line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if(heading){const h=document.createElement('h'+heading[1].length);appendInlineMarkdown(h,heading[2]);container.appendChild(h);i++;continue;}
      if(/^\s{0,3}(?:---+|___+|\*\*\*+)\s*$/.test(line)){container.appendChild(document.createElement('hr'));i++;continue;}
      if(/^\s{0,3}>/.test(line)){
        const quote=document.createElement('blockquote');const p=document.createElement('p');let first=true;
        while(i<lines.length&&/^\s{0,3}>/.test(lines[i])){const q=lines[i++].replace(/^\s{0,3}>\s?/,'');if(!first)p.appendChild(document.createElement('br'));appendInlineMarkdown(p,q);first=false;}
        quote.appendChild(p);container.appendChild(quote);continue;
      }
      if(line.includes('|')&&isMarkdownTableSeparator(lines[i+1]??'')){
        const headerCells=markdownTableCells(line);i+=2;
        const wrap=document.createElement('div');wrap.className='markdown-table-wrap';const table=document.createElement('table');
        const thead=document.createElement('thead');const trHead=document.createElement('tr');
        headerCells.forEach(cell=>{const th=document.createElement('th');appendInlineMarkdown(th,cell);trHead.appendChild(th)});thead.appendChild(trHead);table.appendChild(thead);
        const tbody=document.createElement('tbody');
        while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){
          const cells=markdownTableCells(lines[i++]);const tr=document.createElement('tr');
          for(let c=0;c<headerCells.length;c++){const td=document.createElement('td');appendInlineMarkdown(td,cells[c]??'');tr.appendChild(td)}
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);wrap.appendChild(table);container.appendChild(wrap);continue;
      }
      const unordered=line.match(/^\s{0,3}([-+*])\s+(.+)$/),ordered=line.match(/^\s{0,3}(\d+)[.)]\s+(.+)$/);
      if(unordered||ordered){
        const list=document.createElement(ordered?'ol':'ul');
        while(i<lines.length){const item=lines[i].match(ordered?/^\s{0,3}\d+[.)]\s+(.+)$/:/^\s{0,3}[-+*]\s+(.+)$/);if(!item)break;const li=document.createElement('li');appendInlineMarkdown(li,item[1]);list.appendChild(li);i++;}
        container.appendChild(list);continue;
      }
      const paragraph=[];
      while(i<lines.length&&!startsBlock(i)){paragraph.push(lines[i].trim());i++;}
      if(!paragraph.length){paragraph.push(lines[i++].trim());}
      const p=document.createElement('p');appendInlineMarkdown(p,paragraph.join(' '));container.appendChild(p);
    }
  }
  function addMessage(role, content, shouldSpeak=false, sources=[]){
    const row=document.createElement('div');row.className=`message ${role}`;
    const body=document.createElement('div');body.className='message-content';
    if(role==='assistant')renderMarkdown(body,content);else body.textContent=content;
    row.appendChild(body);
    let listenButton=null;
    if(role==='assistant'){
      const actions=document.createElement('div');actions.className='message-actions';
      listenButton=document.createElement('button');listenButton.className='text-action';listenButton.type='button';listenButton.textContent='🔊 '+t('listen');listenButton.setAttribute('aria-pressed','false');listenButton.addEventListener('click',()=>speak(content,listenButton,false));actions.appendChild(listenButton);row.appendChild(actions);
      const safeSources=(Array.isArray(sources)?sources:[]).filter(x=>x&&typeof x.url==='string'&&x.url.startsWith('https://')&&typeof x.title==='string');
      if(safeSources.length){
        const details=document.createElement('details');details.className='chat-sources';
        const summary=document.createElement('summary');summary.textContent=`${t('answerSources')} (${safeSources.length})`;details.appendChild(summary);
        const list=document.createElement('div');list.className='chat-source-list';
        safeSources.forEach(source=>{const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.title;list.appendChild(a)});
        details.appendChild(list);row.appendChild(details);
      }
    }
    $('chatLog').appendChild(row);$('chatLog').scrollTop=$('chatLog').scrollHeight;
    // Auto-read is a preference for new replies; manual Listen uses the same single-player controller.
    if(shouldSpeak && $('readAloud').checked) speak(content,listenButton,true);
  }
  function plainForSpeech(content){return String(content).replace(/```[\s\S]*?```/g,' code block ').replace(/[*_#>`~]/g,'').replace(/https?:\/\/\S+/g,'link').slice(0,1600)}
  function browserSpeakFallback(token,speech){
    const playback=state.speech;if(token!==playback.token||!playback.active)return;
    if(!('speechSynthesis' in window)){finishSpeech(token);return;}
    try{
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(speech);
      u.lang=state.lang==='en'?'en-IN':state.lang==='hi'?'hi-IN':'mr-IN';u.rate=.94;
      u.onend=()=>finishSpeech(token);u.onerror=()=>finishSpeech(token);
      playback.utterance=u;window.speechSynthesis.speak(u);
    }catch{finishSpeech(token)}
  }
  async function serverSpeak(token,speech){
    const playback=state.speech;if(token!==playback.token||!playback.active)return;
    try{
      const blob=await api('/api/tts',{method:'POST',signal:playback.controller.signal,body:JSON.stringify({text:speech,lang:state.lang})});
      if(token!==playback.token||!playback.active)return;
      const url=URL.createObjectURL(blob);const audio=new Audio(url);
      playback.objectUrl=url;playback.audio=audio;audio.onended=()=>finishSpeech(token);
      audio.onerror=()=>{if(token!==playback.token||!playback.active)return;cleanupAudio(playback);browserSpeakFallback(token,speech)};
      try{await audio.play()}catch(error){if(token===playback.token&&playback.active){cleanupAudio(playback);browserSpeakFallback(token,speech)}}
    }catch(error){if(token===playback.token&&playback.active&&error.name!=='AbortError')browserSpeakFallback(token,speech)}
  }
  async function speak(content, button=null, automatic=false){
    const playback=state.speech;const fullText=String(content);
    if(automatic && !$('readAloud').checked)return;
    // Clicking Listen on the currently playing answer toggles it off, even if auto-read started it.
    if(playback.active&&playback.activeText===fullText){if(automatic)return;stopSpeech();return;}
    stopSpeech();
    const token=playback.token;const speech=plainForSpeech(fullText);if(!speech.trim())return;
    playback.active=true;playback.automatic=automatic;playback.button=button;playback.activeText=fullText;
    playback.controller=new AbortController();
    if(button){button.textContent='⏹ '+t('stop');button.setAttribute('aria-pressed','true')}
    const globalStop=$('stopSpeechButton');if(globalStop){globalStop.hidden=false;globalStop.textContent='■ '+t('stop')}
    // Exactly one audio engine is active. If the chosen engine fails, it is cancelled before fallback.
    if('speechSynthesis' in window){
      let voices=[];try{voices=window.speechSynthesis.getVoices()}catch{}
      const prefix=state.lang==='en'?'en':state.lang==='hi'?'hi':'mr';
      const voice=voices.find(v=>String(v.lang||'').toLowerCase().startsWith(prefix));
      if(voice){
        try{
          const utter=new SpeechSynthesisUtterance(speech);utter.lang=voice.lang;utter.voice=voice;utter.rate=.94;
          utter.onend=()=>finishSpeech(token);
          utter.onerror=()=>{if(token===playback.token&&playback.active){try{window.speechSynthesis.cancel()}catch{};serverSpeak(token,speech)}};
          playback.utterance=utter;window.speechSynthesis.speak(utter);return;
        }catch{}
      }
    }
    await serverSpeak(token,speech);
  }

  async function sendQuestion(custom){
    const question=String(custom??$('question').value).trim();if(!question){text($('chatStatus'),t('emptyQuestion'));return;}
    stopSpeech();$('question').value='';text($('chatStatus'),'');addMessage('user',question);state.history.push({role:'user',content:question});
    const pending=document.createElement('div');pending.className='message assistant';pending.textContent=t('waiting');$('chatLog').appendChild(pending);$('chatLog').scrollTop=$('chatLog').scrollHeight;$('sendButton').disabled=true;
    const profile={age:$('age').value?Number($('age').value):null,income:$('income').value?Number($('income').value):null,employment:$('employment').value,fd_available:$('fdAvailable').checked,fd_amount:$('fdAmount').value?Number($('fdAmount').value):0,user_type:$('userType').value,primary_goal:$('primaryGoal').value,credit_history:$('creditHistory').value,payment_capacity:$('paymentCapacity').value,uses_upi:$('usesUPI').value==='true'?true:$('usesUPI').value==='false'?false:null};
    try{
      const data=await api('/api/chat',{method:'POST',body:JSON.stringify({messages:state.history.slice(-16),lang:state.lang,profile})});
      pending.remove();
      if(data.blocked_sensitive){
        // Do not forward a user-entered secret in subsequent chat turns, and hide it from the local transcript.
        state.history[state.history.length-1]={role:'user',content:'[sensitive details removed for safety]'};
        const lastUser=[...$('chatLog').querySelectorAll('.message.user')].pop();if(lastUser){const body=lastUser.querySelector('.message-content');if(body)body.textContent=t('sensitiveDataHidden')}
      }
      state.history.push({role:'assistant',content:data.reply});addMessage('assistant',data.reply,true,data.sources||[]);
    }catch(error){pending.remove();const msg=error.message.includes('GROQ_API_KEY')||error.message.includes('API key')?error.message:t('error')+' '+error.message;addMessage('assistant',msg,false);text($('chatStatus'),error.message)}
    finally{$('sendButton').disabled=false;$('question').focus()}
  }
  function renderLessonsAndGlossary(){
    api(`/api/lessons?lang=${state.lang}`).then(data=>{
      const grid=$('lessonGrid');grid.replaceChildren();
      (data.lessons||[]).forEach(lesson=>{
        const card=document.createElement('article');card.className='lesson-card';
        const icon=document.createElement('div');icon.className='lesson-icon';icon.textContent=t('lessonIcons')[lesson.id]||'✦';
        const h=document.createElement('h3');h.textContent=t('lessonTitles')[lesson.id]||lesson.title;
        const p=document.createElement('p');p.textContent=lesson.text||lessonFallback[state.lang][lesson.id];
        const b=document.createElement('button');b.type='button';b.textContent=t('askTerm');b.addEventListener('click',()=>{document.querySelector('[data-tab="assistant"]').click();sendQuestion(t('prompt')[lesson.id]||h.textContent)});
        card.append(icon,h,p,b);grid.appendChild(card);
      });
      const gloss=$('glossaryGrid');gloss.replaceChildren();
      (data.glossary||[]).forEach(item=>{
        const b=document.createElement('button');b.type='button';b.className='glossary-item';const title=document.createElement('strong');title.textContent=(glossaryTerms[state.lang].find(x=>x[0]===item.term)||[item.term,item.term])[1];const desc=document.createElement('span');desc.textContent=(item.text||'').slice(0,74)+(item.text&&item.text.length>74?'…':'');b.append(title,desc);b.addEventListener('click',()=>{document.querySelector('[data-tab="assistant"]').click();sendQuestion(({en:`Explain “${item.term}” with a simple example.`,hi:`“${title.textContent}” को आसान उदाहरण से समझाएँ।`,mr:`“${title.textContent}” सोप्या उदाहरणासह समजावून सांगा.`})[state.lang])});gloss.appendChild(b);
      });
    }).catch(()=>{});
  }
  async function renderResources(){
    try{const resources=await api(`/api/resources?lang=${state.lang}`);const grid=$('resourceGrid');grid.replaceChildren();
      resources.forEach(r=>{const card=document.createElement('article');card.className='resource-card';const tag=document.createElement('div');tag.className='resource-tag';tag.textContent=r.tag==='official'?(state.lang==='en'?'Official source':state.lang==='hi'?'आधिकारिक स्रोत':'अधिकृत स्रोत'):(state.lang==='en'?'Education':state.lang==='hi'?'शिक्षा':'शिक्षण');const h=document.createElement('h3');h.textContent=r.title;const p=document.createElement('p');p.textContent=r.description;const a=document.createElement('a');a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=t('readMore');card.append(tag,h,p,a);grid.appendChild(card)});
    }catch{}
  }
  async function renderCardCatalog(){
    const grid=$('cardCatalogGrid');if(!grid)return;
    try{
      const cards=await api(`/api/cards?lang=${state.lang}`);state.cards=cards||[];
      drawCardCatalog();
    }catch{grid.replaceChildren();appendText(grid,'p','small-muted',t('error'))}
  }
  function drawCardCatalog(){
    const grid=$('cardCatalogGrid');if(!grid)return;grid.replaceChildren();
    const count=$('catalogueCount');if(count)count.textContent=t('catalogCount').replace('{n}',String(state.cards.length));
    const q=String($('cardSearch')?.value||'').trim().toLowerCase();
    const cards=state.cards.filter(card=>[card.name,card.issuer,card.category].some(value=>String(value||'').toLowerCase().includes(q)));
    if(!cards.length){appendText(grid,'p','small-muted',t('catalogEmpty'));return;}
    cards.forEach(card=>{
      const article=document.createElement('article');article.className='resource-card card-catalog-item';
      appendText(article,'div','resource-tag',card.fd_backed?'FD-backed / secured':(card.category||'Credit card').replaceAll('_',' '));
      appendText(article,'h3','',card.name);appendText(article,'p','catalog-issuer',card.issuer);
      const fee=card.annual_fee===null||card.annual_fee===undefined?'Check issuer':card.annual_fee===0?(state.lang==='hi'?'सूचीबद्ध वार्षिक फीस ₹0':state.lang==='mr'?'नमूद वार्षिक शुल्क ₹0':'Listed annual fee ₹0'):`${state.lang==='hi'?'सूचीबद्ध वार्षिक फीस':state.lang==='mr'?'नमूद वार्षिक शुल्क':'Listed annual fee'}: ₹${Number(card.annual_fee).toLocaleString('en-IN')} + applicable taxes`;
      appendText(article,'p','catalog-fee',fee);
      const status=document.createElement('span');status.className='source-status'+(card.verified_on?'':' needs-recheck');status.textContent=card.data_status==='official_page_requires_reverification'?t('sourceStatusReview'):`${t('sourceStatusChecked')}${card.verified_on?' · '+card.verified_on:''}`;article.appendChild(status);
      appendList(article,t('benefitsLabel'),card.benefits||[]);
      appendList(article,t('risksLabel'),card.risks||[],'risk-list');
      const link=document.createElement('a');link.href=card.source_url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=t('officialSite');article.appendChild(link);
      grid.appendChild(article);
    });
  }

  function readProfileForm(){
    const upiValue=$('usesUPI').value;
    return {
      user_type:$('userType').value,
      age:$('age').value?Number($('age').value):0,
      income:$('income').value?Number($('income').value):0,
      employment:$('employment').value,
      credit_history:$('creditHistory').value,
      primary_goal:$('primaryGoal').value,
      payment_capacity:$('paymentCapacity').value,
      uses_upi:upiValue==='true'?true:upiValue==='false'?false:null,
      fd_available:$('fdAvailable').checked,
      fd_amount:$('fdAmount').value?Number($('fdAmount').value):0,
      online_spend:$('onlineSpend').value?Number($('onlineSpend').value):0,
      offline_spend:$('offlineSpend').value?Number($('offlineSpend').value):0,
      fuel_spend:$('fuelSpend').value?Number($('fuelSpend').value):0
    };
  }
  function appendText(parent, tagName, className, content){
    const el=document.createElement(tagName);if(className)el.className=className;el.textContent=content??'';parent.appendChild(el);return el;
  }
  function appendList(parent, title, items, className='recommendation-list'){
    if(!items||!items.length)return;
    appendText(parent,'h4','detail-heading',title);
    const ul=document.createElement('ul');ul.className=className;
    items.forEach(item=>appendText(ul,'li','',item));parent.appendChild(ul);
  }
  function renderPath(data, resultsEl){
    const path=data.path;if(!path)return;
    const article=document.createElement('article');article.className='path-card';
    appendText(article,'div','path-kicker',t('pathOnly'));
    appendText(article,'h3','',path.title||t('pathTitle'));
    appendText(article,'p','path-summary',path.summary||data.note||'');
    appendText(article,'p','goal-advice',`${t('goalLabel')}: ${data.goal||path.priority_label||''}`);
    if(path.goal_advice)appendText(article,'p','goal-advice',path.goal_advice);
    if(data.ranking_explanation){appendText(article,'h4','detail-heading',t('rankingExplanation'));appendText(article,'p','path-summary',data.ranking_explanation)}
    appendList(article,t('pathTitle'),path.steps,'path-step-list');
    resultsEl.appendChild(article);
  }
  function addHandoffPanel(parent, card){
    const panel=document.createElement('section');panel.className='handoff-panel';
    appendText(panel,'h4','detail-heading',t('receiptTitle'));
    appendText(panel,'p','small-muted',t('receiptDescription'));
    const label=document.createElement('label');label.className='handoff-consent';
    const checkbox=document.createElement('input');checkbox.type='checkbox';
    const consentText=document.createElement('span');consentText.textContent=t('receiptConsent');label.append(checkbox,consentText);panel.appendChild(label);
    const create=document.createElement('button');create.type='button';create.className='secondary-button';create.textContent=t('receiptButton');create.disabled=true;panel.appendChild(create);
    const status=document.createElement('p');status.className='small-status';status.setAttribute('aria-live','polite');panel.appendChild(status);
    checkbox.addEventListener('change',()=>{create.disabled=!checkbox.checked});
    create.addEventListener('click',async()=>{
      if(!checkbox.checked){text(status,t('receiptConsentRequired'));return;}
      create.disabled=true;text(status,t('waiting'));
      try{
        const record=await api('/api/referrals',{method:'POST',body:JSON.stringify({card_id:card.id,consent:true})});
        const liveText=record.mode==='drunix_gateway'
          ? `${t('receiptModeLive')}\n${record.ledger_verified?t('receiptLedgerVerified'):'Ledger commit/read-back was not verified.'}${record.transaction_id?`\n${t('receiptTransaction')} ${record.transaction_id}`:''}`
          : t('receiptModeDemo');
        text(status,`${t('receiptCreated')} ${record.referral_id}\nStatus: ${record.status}\n${liveText}\n${record.notice||t('receiptNoApp')}`);
        checkbox.disabled=true;create.disabled=true;
        const receiptActions=document.createElement('div');receiptActions.className='receipt-actions';
        const check=document.createElement('button');check.type='button';check.className='text-action';check.textContent=t('receiptCheck');
        const history=document.createElement('button');history.type='button';history.className='text-action';history.textContent=t('receiptHistory');
        const revoke=document.createElement('button');revoke.type='button';revoke.className='text-action';revoke.textContent=t('receiptRevoke');
        const historyBox=document.createElement('pre');historyBox.className='receipt-history';historyBox.hidden=true;

        // Issuer-side controls are explicit about simulation vs the separate Org2 identity.
        const issuerPanel=document.createElement('section');issuerPanel.className='issuer-workflow-box';
        appendText(issuerPanel,'h5','',t('issuerWorkflowTitle'));
        appendText(issuerPanel,'p','small-muted',record.mode==='drunix_gateway'?t('issuerLiveDescription'):t('issuerDemoDescription'));
        const issuerCurrent=document.createElement('p');issuerCurrent.className='issuer-current-status';issuerCurrent.setAttribute('aria-live','polite');
        const issuerMessage=document.createElement('p');issuerMessage.className='small-status';issuerMessage.setAttribute('aria-live','polite');
        let issuerToken=null;
        if(record.mode==='drunix_gateway'){
          const tokenLabel=document.createElement('label');tokenLabel.className='issuer-token-label';
          tokenLabel.textContent=t('issuerTokenLabel');
          issuerToken=document.createElement('input');issuerToken.type='password';issuerToken.autocomplete='off';issuerToken.className='issuer-token-input';issuerToken.placeholder=t('issuerTokenPlaceholder');
          tokenLabel.appendChild(issuerToken);issuerPanel.appendChild(tokenLabel);
        }
        const issuerButtons=document.createElement('div');issuerButtons.className='receipt-actions issuer-buttons';
        const issuerTerminal=document.createElement('p');issuerTerminal.className='small-muted';issuerTerminal.hidden=true;
        issuerPanel.append(issuerCurrent,issuerButtons,issuerTerminal,issuerMessage);
        const nextStates={CONSENTED:['ACKNOWLEDGED'],ACKNOWLEDGED:['UNDER_REVIEW'],UNDER_REVIEW:['ACTION_REQUIRED','COMPLETED','REJECTED'],ACTION_REQUIRED:['UNDER_REVIEW','COMPLETED','REJECTED']};
        let currentStatus=record.status||'CONSENTED';
        const humanStatus={CONSENTED:'Consent recorded',ACKNOWLEDGED:'Acknowledged',UNDER_REVIEW:'Under review',ACTION_REQUIRED:'Action required',COMPLETED:'Workflow completed',REJECTED:'Workflow closed / rejected',CONSENT_REVOKED:'Consent revoked'};
        const refreshHistory=async()=>{
          try{const r=await api(`/api/referrals/${encodeURIComponent(record.referral_id)}/history`);historyBox.textContent=JSON.stringify(r.history,null,2);historyBox.hidden=false;}
          catch(e){text(issuerMessage,e.message)}
        };
        const renderIssuerActions=()=>{
          text(issuerCurrent,`Current workflow status: ${humanStatus[currentStatus]||currentStatus}`);
          issuerButtons.replaceChildren();
          const next=nextStates[currentStatus]||[];
          issuerTerminal.hidden=next.length>0;
          text(issuerTerminal,currentStatus==='CONSENT_REVOKED'?'No further issuer updates are allowed after consent revocation.':'This workflow is in a terminal state.');
          if(!next.length)return;
          next.forEach(nextStatus=>{
            const b=document.createElement('button');b.type='button';b.className='secondary-button';
            b.textContent=humanStatus[nextStatus]||nextStatus;
            b.addEventListener('click',async()=>{
              for(const item of issuerButtons.querySelectorAll('button'))item.disabled=true;
              text(issuerMessage,t('issuerUpdating'));
              try{
                const headers={};
                if(record.mode==='drunix_gateway'){
                  const token=issuerToken?.value.trim()||'';
                  if(!token){text(issuerMessage,t('issuerTokenRequired'));renderIssuerActions();return;}
                  headers['x-issuer-console-token']=token;
                }
                const updated=await api(`/api/issuer/referrals/${encodeURIComponent(record.referral_id)}/status`,{method:'PATCH',headers,body:JSON.stringify({status:nextStatus})});
                currentStatus=updated.status;renderIssuerActions();
                const txn=updated.transaction_id||updated.transaction_ref;
                const evidence=updated.mode==='drunix_gateway'
                  ? `${t('issuerLiveSuccess')}${txn?`\n${t('receiptTransaction')} ${txn}`:''}`
                  : t('issuerDemoSuccess');
                text(issuerMessage,`${evidence}\n${updated.notice||''}`);
                text(status,`${t('receiptCreated')} ${record.referral_id}\nStatus: ${currentStatus}\n${updated.notice||''}`);
                await refreshHistory();
              }catch(e){text(issuerMessage,e.message);renderIssuerActions();}
            });
            issuerButtons.appendChild(b);
          });
        };
        renderIssuerActions();
        check.addEventListener('click',async()=>{
          try{
            const r=await api(`/api/referrals/${encodeURIComponent(record.referral_id)}`);
            currentStatus=r.status||currentStatus;renderIssuerActions();
            text(status,`${t('receiptCreated')} ${r.referral_id}\nStatus: ${r.status}\n${r.transaction_id?`${t('receiptTransaction')} ${r.transaction_id}\n`:''}${r.notice||''}`);
          }catch(e){text(status,e.message)}
        });
        history.addEventListener('click',refreshHistory);
        revoke.addEventListener('click',async()=>{
          revoke.disabled=true;
          try{
            const r=await api(`/api/referrals/${encodeURIComponent(record.referral_id)}/revoke`,{method:'POST',body:JSON.stringify({})});
            currentStatus='CONSENT_REVOKED';renderIssuerActions();
            text(status,`${t('receiptRevoked')} ${r.status||''}${r.transaction_id?`\n${t('receiptTransaction')} ${r.transaction_id}`:''}\n${r.ledger_verified?t('receiptLedgerVerified'):''}\n${r.notice||''}`);
            text(issuerMessage,t('issuerNoMoreUpdates'));revoke.disabled=true;await refreshHistory();
          }catch(e){text(status,e.message);revoke.disabled=false}
        });
        receiptActions.append(check,history,revoke);panel.append(receiptActions,issuerPanel,historyBox);
        const follow=document.createElement('a');follow.href=card.source_url;follow.target='_blank';follow.rel='noopener noreferrer';follow.className='primary-button handoff-continue';follow.textContent=t('continueIssuer');panel.appendChild(follow);
        appendText(panel,'p','small-muted',t('receiptNoApp'));
      }catch(error){text(status,error.message);create.disabled=!checkbox.checked}
    });
    parent.appendChild(panel);
  }

  async function loadLedgerStatus(){
    const el=$('ledgerStatus');if(!el)return;
    text(el,t('ledgerChecking'));
    try{
      const info=await api('/api/drunix/status');
      const label=info.mode==='demo_simulated'?t('ledgerDemo'):(info.ready&&info.is_live?t('ledgerLive'):t('ledgerUnready'));
      text(el,`${label} ${info.notice||''}`);
      el.dataset.mode=info.mode||'drunix_gateway_unavailable';
      el.classList.toggle('ledger-live',info.mode==='drunix_gateway'&&info.ready);
      el.classList.toggle('ledger-demo',info.mode==='demo_simulated');
    }catch{ text(el,t('ledgerUnready'));el.dataset.mode='drunix_gateway_unavailable';el.classList.remove('ledger-live','ledger-demo') }
  }

  function renderRecommendedCard(card, data, resultsEl, primary=false){
    const article=document.createElement('article');article.className='result-card'+(primary?' primary-recommendation':'');
    if(primary){const badge=document.createElement('span');badge.className='top-pick-badge';badge.textContent=t('topPick');article.appendChild(badge);}
    const h=document.createElement('h3');h.textContent=card.name;article.appendChild(h);
    appendText(article,'div','issuer',card.issuer+(card.fd_backed?' · FD-backed option':''));
    const tag=document.createElement('span');tag.className='unverified';tag.textContent=card.match_strength==='goal_match'?t('matchedGoal'):t('exploreOnly');article.appendChild(tag);
    const status=document.createElement('span');status.className=card.verified_on?'source-status':'source-status needs-recheck';status.textContent=card.verified_on?`${t('sourceChecked')}: ${card.verified_on}`:t('needsRecheck');article.appendChild(status);
    const fee=document.createElement('div');fee.className='fee-line';
    fee.textContent=`${t('annualFeeLabel')}: ${card.annual_fee===null||card.annual_fee===undefined?'Check issuer':formatINR(card.annual_fee)+(card.annual_fee>0?' + applicable taxes':'')}`;
    article.appendChild(fee);
    if(card.fee_waiver_spend)appendText(article,'p','small-muted',`${t('feeWaiverLabel')}: ${formatINR(card.fee_waiver_spend)} annual spend (issuer terms apply).`);
    if(card.fd_backed){
      const fdLine=card.minimum_fd?`${t('fdRequirement')}. Current issuer page lists a minimum FD of ${formatINR(card.minimum_fd)}.`:t('fdRequirement');
      appendText(article,'p','warning-inline',fdLine);
    }
    appendText(article,'p','why-fit',`${t('whyFit')}: ${card.why_fit||''}`);
    appendList(article,t('benefitsLabel'),card.benefits);
    appendList(article,t('risksLabel'),card.risks,'risk-list');
    if(card.eligibility)appendText(article,'p','eligibility-line',`${t('eligibilityLabel')}: ${card.eligibility}`);
    if(card.note)appendText(article,'p','small-muted',card.note);
    const links=document.createElement('div');links.className='result-links';
    const a=document.createElement('a');a.href=card.source_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=t('officialSite');links.appendChild(a);
    const fees=document.createElement('a');fees.href=card.fees_url||card.source_url;fees.target='_blank';fees.rel='noopener noreferrer';fees.textContent=t('currentTerms');links.appendChild(fees);
    article.appendChild(links);
    const details=document.createElement('details');details.className='apply-details';
    appendText(details,'summary','',t('applicationGuide'));
    appendList(details,t('applyStepsTitle'),data.application_steps,'application-steps');
    appendText(details,'p','small-muted',data.application_note||'');
    article.appendChild(details);
    addHandoffPanel(article,card);
    resultsEl.appendChild(article);
  }
  async function runFinder(event){
    event.preventDefault();const resultsEl=$('finderResults');resultsEl.replaceChildren();resultsEl.classList.add('loading');
    const profile=readProfileForm();
    try{
      const data=await api('/api/recommend',{method:'POST',body:JSON.stringify({profile,lang:state.lang})});
      renderPath(data,resultsEl);
      if(!data.results||!data.results.length){
        const empty=document.createElement('div');empty.className='empty-state';
        appendText(empty,'span','', '✦');appendText(empty,'h3','',t('noResultsTitle'));
        appendText(empty,'p','',data.note||t('noResultsText'));resultsEl.appendChild(empty);
      }
      const matchedCards=data.results||[];
      if(matchedCards.length){
        appendText(resultsEl,'h3','result-section-heading',t('topMatchTitle'));
        renderRecommendedCard(matchedCards[0],data,resultsEl,true);
        if(matchedCards.length>1){
          const alternatives=document.createElement('details');alternatives.className='alternatives-panel';
          const summary=document.createElement('summary');summary.textContent=`${t('alternativesTitle')} (${matchedCards.length-1})`;alternatives.appendChild(summary);
          const alternativeGrid=document.createElement('div');alternativeGrid.className='alternatives-grid';
          matchedCards.slice(1).forEach(card=>renderRecommendedCard(card,data,alternativeGrid,false));
          alternatives.appendChild(alternativeGrid);resultsEl.appendChild(alternatives);
        }
      }
      if(profile.user_type==='existing'){
        const tip=document.createElement('div');tip.className='result-note';
        tip.textContent=({en:'For a genuine keep/switch review, compare your actual annual fee, benefits you used, reward exclusions and any interest charged using your own bank app. Do not share a statement or card credentials here, and do not close a card based only on this prototype.',hi:'वास्तविक keep/switch समीक्षा के लिए बैंक ऐप में अपनी वार्षिक फीस, इस्तेमाल किए लाभ, reward exclusions और लगे ब्याज की तुलना करें। यहाँ स्टेटमेंट या कार्ड की गोपनीय जानकारी न दें और केवल इस प्रोटोटाइप के आधार पर कार्ड बंद न करें।',mr:'खरी keep/switch आढाव्यासाठी बँक ॲपमध्ये वार्षिक शुल्क, वापरलेले लाभ, reward exclusions आणि लागलेले व्याज तपासा. येथे स्टेटमेंट किंवा कार्डची गोपनीय माहिती देऊ नका आणि फक्त या प्रोटोटाइपवरून कार्ड बंद करू नका.'})[state.lang];
        resultsEl.appendChild(tip);
      }
    }catch(error){const note=document.createElement('div');note.className='result-note';note.textContent=error.message;resultsEl.appendChild(note)}
    finally{resultsEl.classList.remove('loading')}
  }
  function fillProfileFields(fields){
    const numberMap={age:'age',income:'income',fd_amount:'fdAmount',online_spend:'onlineSpend',offline_spend:'offlineSpend',fuel_spend:'fuelSpend'};
    Object.entries(numberMap).forEach(([key,id])=>{if(Object.prototype.hasOwnProperty.call(fields,key)&&$(id))$(id).value=fields[key]??''});
    const selectMap={user_type:'userType',employment:'employment',credit_history:'creditHistory',primary_goal:'primaryGoal',payment_capacity:'paymentCapacity'};
    Object.entries(selectMap).forEach(([key,id])=>{if(fields[key]!==undefined&&$(id)){const select=$(id);if([...select.options].some(o=>o.value===fields[key]))select.value=fields[key]}});
    if(typeof fields.fd_available==='boolean')$('fdAvailable').checked=fields.fd_available;
    if(typeof fields.uses_upi==='boolean')$('usesUPI').value=String(fields.uses_upi);
  }
  function setupFinderVoice(){
    const button=$('finderMicButton');const status=$('finderVoiceStatus');const transcriptEl=$('finderVoiceTranscript');
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){button.addEventListener('click',()=>text(status,t('micUnavailable')));return;}
    button.addEventListener('click',()=>{
      try{
        const recognition=new SpeechRecognition();recognition.lang=state.lang==='en'?'en-IN':state.lang==='hi'?'hi-IN':'mr-IN';recognition.interimResults=false;recognition.maxAlternatives=1;
        recognition.onstart=()=>{button.classList.add('listening');text(status,t('voiceListening'));text(transcriptEl,'')};
        recognition.onend=()=>button.classList.remove('listening');
        recognition.onerror=()=>{button.classList.remove('listening');text(status,t('micUnavailable'))};
        recognition.onresult=async(event)=>{
          const utterance=String(event.results?.[0]?.[0]?.transcript||'').trim();
          if(!utterance){text(status,t('voiceFailed'));return;}
          text(status,t('voiceParsing'));
          try{
            const parsed=await api('/api/parse-profile',{method:'POST',body:JSON.stringify({utterance,lang:state.lang})});
            if(parsed.blocked_sensitive){text(transcriptEl,parsed.heard||t('sensitiveDataHidden'));text(status,parsed.warning||t('privacyBlocked'));return;}
            text(transcriptEl,`${t('voiceTranscriptLabel')}: ${parsed.heard||utterance}`);
            const fields=parsed.fields||{};fillProfileFields(fields);
            if(!Object.keys(fields).length){text(status,t('voiceFailed'));return;}
            text(status,t('voiceSuccess'));
          }catch(error){text(transcriptEl,'');text(status,t('voiceFailed')+' '+error.message)}
        };
        recognition.start();
      }catch{ text(status,t('micUnavailable')); }
    });
  }
  async function checkHealth(){try{const h=await api('/api/health');const badge=$('aiStatus');badge.classList.toggle('offline',!h.ai_configured);badge.textContent=h.ai_configured?t('aiConfigured'):t('aiMissing')}catch{const badge=$('aiStatus');badge.classList.add('offline');badge.textContent=state.lang==='en'?'API not reachable':state.lang==='hi'?'API उपलब्ध नहीं':'API उपलब्ध नाही'}}
  function setupTabs(){document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${btn.dataset.tab}`))}));}
  function setupMic(){const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;const button=$('micButton');if(!SpeechRecognition){button.addEventListener('click',()=>text($('chatStatus'),t('micUnavailable')));return;}
    button.addEventListener('click',()=>{try{const r=new SpeechRecognition();r.lang=state.lang==='en'?'en-IN':state.lang==='hi'?'hi-IN':'mr-IN';r.interimResults=false;r.maxAlternatives=1;r.onstart=()=>{button.classList.add('listening');text($('chatStatus'),t('listening'))};r.onend=()=>button.classList.remove('listening');r.onerror=()=>{button.classList.remove('listening');text($('chatStatus'),t('micUnavailable'))};r.onresult=e=>sendQuestion(e.results[0][0].transcript);r.start()}catch{text($('chatStatus'),t('micUnavailable'))}});
  }

  $('userType').addEventListener('change',()=>{
    if($('userType').value==='existing' && $('primaryGoal').value==='build_history') $('primaryGoal').value='learn_manage';
    else if($('userType').value==='new' && $('primaryGoal').value==='learn_manage') $('primaryGoal').value='build_history';
  });
  $('language').addEventListener('change',e=>setLanguage(e.target.value));
  $('stopSpeechButton').addEventListener('click',stopSpeech);
  $('readAloud').addEventListener('change',e=>{if(!e.target.checked && state.speech.active)stopSpeech()});
  $('cardSearch').addEventListener('input',drawCardCatalog);
  $('sendButton').addEventListener('click',()=>sendQuestion());
  $('question').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendQuestion()}});
  document.querySelectorAll('.prompt-chip').forEach(btn=>btn.addEventListener('click',()=>sendQuestion(t('prompt')[btn.dataset.question])));
  $('finderForm').addEventListener('submit',runFinder);setupTabs();setupMic();setupFinderVoice();
  setLanguage('en');
  loadLedgerStatus();
  addMessage('assistant',t('greet'),false);
})();
