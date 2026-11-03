/* Payal help button + photo guide + offline help chat (PAYAL_HELPBOT). No AI, no key: answers come from the list below. */
(function () {
  "use strict";
  if (window.__pbhLoaded) return;
  window.__pbhLoaded = true;

  var WA = "https://wa.me/919321109411";
  var LK = "pbhLang", HK = "pbhChat";

  /* ---------- screen text ---------- */
  var UI = {
    intro: {
      hi: "पहले नीचे की फ़ोटो एक-एक करके देखो और पूरी नीचे तक खींचो। सबसे नीचे पहुँचते ही सवाल पूछने की जगह खुल जाएगी।",
      rh: "Pehle neeche ki photo ek-ek karke dekho aur poori neeche tak kheencho. Sabse neeche pahunchte hi sawaal poochne ki jagah khul jayegi.",
      en: "First look at the photos below one by one and scroll all the way down. When you reach the bottom, the question box will open.",
      bn: "আগে নিচের ছবিগুলো একটা একটা করে দেখো আর একদম নিচ পর্যন্ত টানো। নিচে পৌঁছালেই প্রশ্ন করার জায়গা খুলে যাবে।"
    },
    hint: { hi: "⬇ नीचे खींचते रहो", rh: "⬇ Neeche kheenchte raho", en: "⬇ Keep scrolling down", bn: "⬇ নিচে টানতে থাকো" },
    step: { hi: "स्टेप", rh: "Step", en: "Step", bn: "ধাপ" },
    chat: { hi: "अपना सवाल पूछो", rh: "Apna sawaal poochho", en: "Ask your question", bn: "তোমার প্রশ্ন করো" },
    ph: { hi: "यहाँ लिखो…", rh: "Yahan likho…", en: "Type here…", bn: "এখানে লেখো…" },
    send: { hi: "भेजो", rh: "Bhejo", en: "Send", bn: "পাঠাও" },
    greet: {
      hi: "नमस्ते! Payal ऐप या इस वेबसाइट के बारे में कुछ भी पूछो। नीचे के सवाल दबाकर भी देख सकते हो।",
      rh: "Namaste! Payal app ya is website ke baare mein kuch bhi poochho. Neeche ke sawaal dabakar bhi dekh sakte ho.",
      en: "Hello! Ask anything about the Payal app or this website. You can also tap the questions below.",
      bn: "নমস্কার! Payal অ্যাপ বা এই ওয়েবসাইট নিয়ে যা খুশি জিজ্ঞাসা করো। নিচের প্রশ্নগুলোতেও চাপ দিতে পারো।"
    },
    none: {
      hi: "मैं सिर्फ़ Payal ऐप और इस वेबसाइट के बारे में मदद कर सकता हूँ। यह सवाल मेरे पास नहीं है, हमने इसे नोट कर लिया है ताकि जल्दी जवाब जोड़ सकें। नीचे से कोई सवाल चुनो या WhatsApp करो: [[WhatsApp|" + WA + "]]",
      rh: "Main sirf Payal app aur is website ke baare mein madad kar sakta hoon. Yeh sawaal mere paas nahi hai, humne ise note kar liya hai taaki jaldi jawaab jod sakein. Neeche se koi sawaal chuno ya WhatsApp karo: [[WhatsApp|" + WA + "]]",
      en: "I can only help with the Payal app and this website. I don't have this one yet, and we have noted it so we can add an answer soon. Pick a question below or message us on WhatsApp: [[WhatsApp|" + WA + "]]",
      bn: "আমি শুধু Payal অ্যাপ আর এই ওয়েবসাইট নিয়ে সাহায্য করতে পারি। এই প্রশ্নটা আমার কাছে নেই, আমরা এটা নোট করে রেখেছি যাতে তাড়াতাড়ি উত্তর যোগ করতে পারি। নিচ থেকে একটা প্রশ্ন বেছে নাও বা WhatsApp করো: [[WhatsApp|" + WA + "]]"
    }
  };

  /* ---------- photo steps (same as the help page) ---------- */
  var STEPS = [
    { img: "h0.jpg",
      x: {
        hi: "वेबसाइट से डाउनलोड बटन दबाओ। Chrome “File might be harmful” दिखाएगा। लाल निशान वाला “Download anyway” दबाओ। फ़ाइल सिर्फ़ इसी साइट की है, डरने की बात नहीं।",
        rh: "Website se download button dabao. Chrome “File might be harmful” dikhayega. Laal nishaan wala “Download anyway” dabao. File sirf isi site ki hai, darne ki baat nahi.",
        en: "Tap the download button on the website. Chrome will show “File might be harmful”. Tap the red “Download anyway”. The file is only from this site, so there is nothing to fear.",
        bn: "ওয়েবসাইট থেকে ডাউনলোড বোতাম চাপো। Chrome “File might be harmful” দেখাবে। লাল চিহ্নের “Download anyway” চাপো। ফাইলটি শুধু এই সাইটেরই, ভয়ের কিছু নেই।"
      } },
    { img: null,
      x: {
        hi: "डाउनलोड हुई फ़ाइल खोलो। फ़ोन कहे कि इस स्रोत से install की अनुमति नहीं है, तो “Settings” दबाओ। “Allow from this source” चालू करो और पीछे (back) जाओ। फिर “Install” दबाओ। अगर “App blocked to protect your device” आए तो “More details” दबाकर “Install anyway” चुनो।",
        rh: "Download hui file kholo. Phone kahe ki is source se install ki anumati nahi hai, to “Settings” dabao. “Allow from this source” chalu karo aur peeche (back) jao. Phir “Install” dabao. Agar “App blocked to protect your device” aaye to “More details” dabakar “Install anyway” chuno.",
        en: "Open the downloaded file. If the phone says install from this source is not allowed, tap “Settings”. Turn on “Allow from this source” and go back. Then tap “Install”. If “App blocked to protect your device” appears, tap “More details” and choose “Install anyway”.",
        bn: "ডাউনলোড হওয়া ফাইল খোলো। ফোন বললে যে এই সোর্স থেকে ইনস্টলের অনুমতি নেই, “Settings” চাপো। “Allow from this source” চালু করে পিছনে (back) যাও। তারপর “Install” চাপো। “App blocked to protect your device” এলে “More details” চেপে “Install anyway” বেছে নাও।"
      } },
    { img: "h1.jpg",
      x: {
        hi: "इंस्टॉल के बाद ऐप न खुले या इंस्टॉल फ़ेल हो तो Play Protect को एक दिन के लिए रोको (अगले दिन अपने आप चालू हो जाएगा)। Play Store खोलो, ऊपर अपनी प्रोफ़ाइल दबाओ, फिर Play Protect खोलो। कोने में गियर (⚙) का निशान दबाओ।",
        rh: "Install ke baad app na khule ya install fail ho to Play Protect ko ek din ke liye roko (agle din apne aap chalu ho jayega). Play Store kholo, upar apni profile dabao, phir Play Protect kholo. Kone mein gear (⚙) ka nishaan dabao.",
        en: "If the app does not open after install, or the install fails, pause Play Protect for one day (it turns back on by itself the next day). Open the Play Store, tap your profile at the top, then open Play Protect. Tap the gear (⚙) in the corner.",
        bn: "ইনস্টলের পর অ্যাপ না খুললে বা ইনস্টল ফেল হলে Play Protect একদিনের জন্য থামাও (পরের দিন নিজে থেকেই চালু হয়ে যাবে)। Play Store খোলো, উপরে প্রোফাইল চাপো, তারপর Play Protect খোলো। কোণায় গিয়ার (⚙) চিহ্ন চাপো।"
      } },
    { img: "h2.jpg",
      x: {
        hi: "यहाँ दो बटन चालू दिखेंगे। ऊपर वाला “Scan apps with Play Protect” बंद करो। दबाते ही दोनों एक साथ बंद हो जाते हैं।",
        rh: "Yahan do button chalu dikhenge. Upar wala “Scan apps with Play Protect” band karo. Dabate hi dono ek saath band ho jaate hain.",
        en: "Two switches will be on here. Turn off the top one, “Scan apps with Play Protect”. Both turn off together.",
        bn: "এখানে দুটো বোতাম চালু দেখাবে। উপরেরটা “Scan apps with Play Protect” বন্ধ করো। চাপলেই দুটো একসাথে বন্ধ হয়ে যায়।"
      } },
    { img: "h3.jpg",
      x: { hi: "बॉक्स आए तो “Pause” दबाओ।", rh: "Box aaye to “Pause” dabao.", en: "When the box appears, tap “Pause”.", bn: "বক্স এলে “Pause” চাপো।" } },
    { img: "h4.jpg",
      x: {
        hi: "अब दोनों बटन बंद दिखेंगे और नीचे “App scanning is paused” लिखा होगा। अब Payal का APK फिर से install करो और खोलो।",
        rh: "Ab dono button band dikhenge aur neeche “App scanning is paused” likha hoga. Ab Payal ka APK phir se install karo aur kholo.",
        en: "Now both switches show off and “App scanning is paused” is written below. Install the Payal APK again and open it.",
        bn: "এখন দুটো বোতাম বন্ধ দেখাবে আর নিচে “App scanning is paused” লেখা থাকবে। এবার Payal-এর APK আবার ইনস্টল করে খোলো।"
      } },
    { img: null,
      x: {
        hi: "अगर पहले से Payal या Yesmin का पुराना ऐप फ़ोन में है और “App not installed” आए, तो पुराना ऐप हटाकर (uninstall) फिर नया install करो। हटाने से पहले अपनी API key कहीं सहेज लो, क्योंकि ऐप में दोबारा डालनी पड़ सकती है। फिर भी न हो तो WhatsApp करो: [[WhatsApp|" + WA + "]]",
        rh: "Agar pehle se Payal ya Yesmin ka purana app phone mein hai aur “App not installed” aaye, to purana app hatakar (uninstall) phir naya install karo. Hatane se pehle apni API key kahin sahej lo, kyunki app mein dobara daalni pad sakti hai. Phir bhi na ho to WhatsApp karo: [[WhatsApp|" + WA + "]]",
        en: "If an old Payal or Yesmin app is already on the phone and “App not installed” appears, uninstall the old app and install the new one. Save your API key somewhere first, because you may have to enter it again. If it still fails, message us on WhatsApp: [[WhatsApp|" + WA + "]]",
        bn: "ফোনে আগে থেকে Payal বা Yesmin-এর পুরনো অ্যাপ থাকলে আর “App not installed” এলে পুরনো অ্যাপ মুছে (uninstall) নতুনটা ইনস্টল করো। মোছার আগে তোমার API key কোথাও লিখে রাখো, কারণ অ্যাপে আবার দিতে হতে পারে। তবুও না হলে WhatsApp করো: [[WhatsApp|" + WA + "]]"
      } }
  ];

  /* ---------- hidden answer list. k = words people may type in any language ---------- */
  var KB = [
    { id: "harmful", img: [0],
      k: ["file might be harmful", "harmful", "download anyway", "dangerous", "khatarnak", "download warning", "warning", "download nahi", "download error", "download blocked", "डाउनलोड नहीं", "खतरनाक", "ख़तरनाक", "नुकसानदेह", "चेतावनी", "वार्निंग", "ক্ষতিকর", "ডাউনলোড হচ্ছে না", "বিপজ্জনক", "সতর্কতা"],
      a: {
        hi: "Chrome “File might be harmful” इसलिए दिखाता है क्योंकि Payal अभी Play Store पर नहीं है। यह हर बाहर से आने वाले ऐप के साथ होता है। लाल निशान वाला “Download anyway” दबाओ। फ़ाइल सिर्फ़ इसी साइट की है, डरने की बात नहीं।",
        rh: "Chrome “File might be harmful” isliye dikhata hai kyunki Payal abhi Play Store par nahi hai. Yeh har bahar se aane wale app ke saath hota hai. Laal nishaan wala “Download anyway” dabao. File sirf isi site ki hai, darne ki baat nahi.",
        en: "Chrome shows “File might be harmful” because Payal is not on the Play Store yet. This happens with every app installed from outside the Store. Tap the red “Download anyway”. The file is only from this site, so there is nothing to fear.",
        bn: "Chrome “File might be harmful” দেখায় কারণ Payal এখনও Play Store-এ নেই। Store-এর বাইরে থেকে আসা সব অ্যাপেই এমন হয়। লাল চিহ্নের “Download anyway” চাপো। ফাইলটি শুধু এই সাইটেরই, ভয়ের কিছু নেই।"
      } },
    { id: "blocked", img: [],
      k: ["install blocked", "install nahi", "install nahi ho raha", "install nahi hota", "installation", "not allowed", "allow from this source", "unknown source", "unknown apps", "app blocked", "blocked to protect", "more details", "install anyway", "settings", "install ruk", "install error", "cannot install", "can't install", "unable to install", "इंस्टॉल नहीं", "इंस्टॉल रुक", "इंस्टॉल ब्लॉक", "अनुमति", "इंस्टाल नहीं", "ইনস্টল হচ্ছে না", "ইনস্টল", "অনুমতি", "ব্লক", "ইন্সটল"],
      a: {
        hi: "डाउनलोड हुई फ़ाइल खोलो। फ़ोन कहे कि इस स्रोत से install की अनुमति नहीं है, तो “Settings” दबाओ। “Allow from this source” चालू करो और पीछे जाओ। फिर “Install” दबाओ। अगर “App blocked to protect your device” आए तो “More details” दबाकर “Install anyway” चुनो।",
        rh: "Download hui file kholo. Phone kahe ki is source se install ki anumati nahi hai, to “Settings” dabao. “Allow from this source” chalu karo aur peeche jao. Phir “Install” dabao. Agar “App blocked to protect your device” aaye to “More details” dabakar “Install anyway” chuno.",
        en: "Open the downloaded file. If the phone says install from this source is not allowed, tap “Settings”. Turn on “Allow from this source” and go back. Then tap “Install”. If “App blocked to protect your device” appears, tap “More details” and choose “Install anyway”.",
        bn: "ডাউনলোড হওয়া ফাইল খোলো। ফোন বললে যে এই সোর্স থেকে ইনস্টলের অনুমতি নেই, “Settings” চাপো। “Allow from this source” চালু করে পিছনে যাও। তারপর “Install” চাপো। “App blocked to protect your device” এলে “More details” চেপে “Install anyway” বেছে নাও।"
      } },
    { id: "protect", img: [1, 2, 3, 4],
      k: ["play protect", "playprotect", "protect", "scan apps", "app scanning", "app nahi khul", "app nahi khulta", "app nahi khul raha", "not opening", "app not opening", "wont open", "won't open", "install fail", "install failed", "failed", "crash", "app band", "प्ले प्रोटेक्ट", "ऐप नहीं खुल", "ऐप नहीं खुलता", "खुल नहीं", "फ़ेल", "फेल", "প্লে প্রোটেক্ট", "খুলছে না", "খুলছেনা", "ফেল"],
      a: {
        hi: "ऐसा तब होता है जब फ़ोन का Play Protect नए ऐप को रोक देता है। उसे एक दिन के लिए Pause कर दो, अगले दिन अपने आप फिर चालू हो जाएगा। Play Store खोलो → ऊपर प्रोफ़ाइल → Play Protect → कोने में ⚙। वहाँ “Scan apps with Play Protect” बंद करो, बॉक्स आए तो “Pause” दबाओ। फिर Payal का APK दोबारा install करो। फ़ोटो नीचे हैं:",
        rh: "Aisa tab hota hai jab phone ka Play Protect naye app ko rok deta hai. Use ek din ke liye Pause kar do, agle din apne aap phir chalu ho jayega. Play Store kholo → upar profile → Play Protect → kone mein ⚙. Wahan “Scan apps with Play Protect” band karo, box aaye to “Pause” dabao. Phir Payal ka APK dobara install karo. Photo neeche hain:",
        en: "This happens when the phone's Play Protect blocks a new app. Pause it for one day; it turns back on by itself the next day. Open the Play Store → your profile at the top → Play Protect → the ⚙ in the corner. Turn off “Scan apps with Play Protect”, tap “Pause” when the box appears, then install the Payal APK again. Photos below:",
        bn: "এমন হয় যখন ফোনের Play Protect নতুন অ্যাপ আটকে দেয়। এক দিনের জন্য Pause করে দাও, পরের দিন নিজে থেকেই আবার চালু হবে। Play Store খোলো → উপরে প্রোফাইল → Play Protect → কোণায় ⚙। সেখানে “Scan apps with Play Protect” বন্ধ করো, বক্স এলে “Pause” চাপো। তারপর Payal-এর APK আবার ইনস্টল করো। ছবি নিচে:"
      } },
    { id: "notinstalled", img: [],
      k: ["app not installed", "not installed", "purana app", "old app", "uninstall", "reinstall", "yesmin", "package conflicts", "conflict", "पुराना ऐप", "पुराना app", "अनइंस्टॉल", "हटाकर", "পুরনো অ্যাপ", "আনইনস্টল", "পুরোনো"],
      a: {
        hi: "अगर Payal या Yesmin का पुराना ऐप फ़ोन में है और “App not installed” आए, तो पुराना ऐप हटाकर (uninstall) नया install करो। हटाने से पहले अपनी API key कहीं सहेज लो, क्योंकि ऐप में दोबारा डालनी पड़ सकती है।",
        rh: "Agar Payal ya Yesmin ka purana app phone mein hai aur “App not installed” aaye, to purana app hatakar (uninstall) naya install karo. Hatane se pehle apni API key kahin sahej lo, kyunki app mein dobara daalni pad sakti hai.",
        en: "If an old Payal or Yesmin app is on the phone and “App not installed” appears, uninstall the old app and install the new one. Save your API key somewhere first, because you may need to enter it again.",
        bn: "ফোনে Payal বা Yesmin-এর পুরনো অ্যাপ থাকলে আর “App not installed” এলে পুরনো অ্যাপ মুছে (uninstall) নতুনটা ইনস্টল করো। মোছার আগে তোমার API key কোথাও লিখে রাখো, কারণ আবার দিতে হতে পারে।"
      } },
    { id: "download", img: [],
      k: ["download", "download karu", "download karna", "download kahan", "kahan se download", "download kaise", "kaise download", "kaise install", "install kaise", "how to download", "how to install", "where to download", "download link", "apk link", "apk kahan", "apk", "app kahan milega", "get the app", "डाउनलोड कैसे", "इंस्टॉल कैसे", "कहाँ से डाउनलोड", "कहां से डाउनलोड", "ডাউনলোড কীভাবে", "কীভাবে ডাউনলোড", "কীভাবে ইনস্টল", "কোথা থেকে ডাউনলোড"],
      a: {
        hi: "इसी वेबसाइट पर ऊपर ☰ मेनू खोलकर “डाउनलोड” बटन दबाओ। Chrome चेतावनी दे तो “Download anyway” दबाओ। फिर फ़ाइल खोलकर Install करो। कहीं अटको तो वही चेतावनी मुझे लिखकर पूछो।",
        rh: "Isi website par upar ☰ menu kholkar “Download” button dabao. Chrome chetavani de to “Download anyway” dabao. Phir file kholkar Install karo. Kahin atko to wahi chetavani mujhe likhkar poochho.",
        en: "On this website open the ☰ menu at the top and tap the “Download” button. If Chrome warns you, tap “Download anyway”. Then open the file and tap Install. If you get stuck, type the warning you see and ask me.",
        bn: "এই ওয়েবসাইটেই উপরে ☰ মেনু খুলে “ডাউনলোড” বোতাম চাপো। Chrome সতর্ক করলে “Download anyway” চাপো। তারপর ফাইল খুলে Install করো। কোথাও আটকালে যে সতর্কতা দেখছ সেটা লিখে আমাকে জিজ্ঞাসা করো।"
      } },
    { id: "apikey", img: [],
      k: ["api key", "apikey", "key kya", "what is api key", "key kyu", "why key", "gemini key", "gemini", "ai studio", "aistudio", "key kahan", "key kaise", "how to get api key", "key banana", "key daalna", "key daale", "key dale", "key banaye", "create api key", "key", "एपीआई", "एपीआई key", "कुंजी", "की कैसे", "key कैसे", "এপিআই", "এপিআই কী", "কী কীভাবে", "জেমিনি"],
      a: {
        hi: "Payal आपकी अपनी Gemini API key से चलती है, जो Google AI Studio से बनती है।\n1) Payal के “Payal Brain” पन्ने पर “API key banane ka link” दबाओ, Google AI Studio खुलेगा।\n2) “Create API key” दबाओ, फिर “Create key”।\n3) बनी हुई key कॉपी करो।\n4) Payal में key वाले बॉक्स में पेस्ट करके “Save & Test” दबाओ।\n5) मॉडल की सूची में “gemini-3.5-flash-lite” चुनो, फिर बीच वाला “Test” दबाओ।\nअपनी key किसी को मत दिखाओ।",
        rh: "Payal aapki apni Gemini API key se chalti hai, jo Google AI Studio se banti hai.\n1) Payal ke “Payal Brain” panne par “API key banane ka link” dabao, Google AI Studio khulega.\n2) “Create API key” dabao, phir “Create key”.\n3) Bani hui key copy karo.\n4) Payal mein key wale box mein paste karke “Save & Test” dabao.\n5) Model ki list mein “gemini-3.5-flash-lite” chuno, phir beech wala “Test” dabao.\nApni key kisi ko mat dikhao.",
        en: "Payal runs on your own Gemini API key, which you create in Google AI Studio.\n1) On Payal's “Payal Brain” page tap the “API key banane ka link”; Google AI Studio opens.\n2) Tap “Create API key”, then “Create key”.\n3) Copy the key.\n4) Paste it in Payal's key box and tap “Save & Test”.\n5) In the model list choose “gemini-3.5-flash-lite”, then tap the middle “Test”.\nDo not show your key to anyone.",
        bn: "Payal তোমার নিজের Gemini API key দিয়ে চলে, যেটা Google AI Studio থেকে বানাতে হয়।\n1) Payal-এর “Payal Brain” পাতায় “API key banane ka link” চাপো, Google AI Studio খুলবে।\n2) “Create API key” চাপো, তারপর “Create key”।\n3) বানানো key কপি করো।\n4) Payal-এর key বক্সে পেস্ট করে “Save & Test” চাপো।\n5) মডেলের তালিকায় “gemini-3.5-flash-lite” বেছে নাও, তারপর মাঝের “Test” চাপো।\nতোমার key কাউকে দেখিও না।"
      } },
    { id: "plans", img: [],
      k: ["price", "prices", "plan", "plans", "kitna", "kitne paise", "kimat", "cost", "free", "paid", "plus", "pro", "payment", "subscription", "kitne ka", "कीमत", "प्लान", "कितना", "कितने", "पैसे", "फ्री", "मुफ्त", "मुफ़्त", "দাম", "প্লান", "প্ল্যান", "টাকা", "বিনামূল্যে", "ফ্রি", "কত"],
      a: {
        hi: "Free, Plus और Pro प्लान हैं। अभी लॉन्च ऑफ़र: Plus ₹49 (पहले ₹199), Pro ₹99 (पहले ₹399)। ताज़ा कीमत और हर प्लान में क्या मिलता है, वेबसाइट के होम पेज पर “प्लान” हिस्से में देखो।",
        rh: "Free, Plus aur Pro plan hain. Abhi launch offer: Plus ₹49 (pehle ₹199), Pro ₹99 (pehle ₹399). Taaza keemat aur har plan mein kya milta hai, website ke home page par “Plans” hisse mein dekho.",
        en: "There are Free, Plus and Pro plans. Launch offer right now: Plus ₹49 (was ₹199), Pro ₹99 (was ₹399). See the “Plans” section on the home page for the latest prices and what each plan includes.",
        bn: "Free, Plus আর Pro প্ল্যান আছে। এখন লঞ্চ অফার: Plus ₹49 (আগে ₹199), Pro ₹99 (আগে ₹399)। সর্বশেষ দাম আর প্রতিটি প্ল্যানে কী পাবে তা হোম পেজের “Plans” অংশে দেখো।"
      } },
    { id: "contact", img: [],
      k: ["contact", "whatsapp", "help number", "number", "phone number", "call", "support", "sampark", "madad chahiye", "owner", "developer", "creator", "baat karni", "human", "insaan", "संपर्क", "व्हाट्सएप", "व्हाट्सऐप", "नंबर", "सहायता", "मदद चाहिए", "যোগাযোগ", "হোয়াটসঅ্যাপ", "নম্বর", "সাপোর্ট", "সাহায্য"],
      a: {
        hi: "सीधे बात करनी हो तो WhatsApp करो: [[WhatsApp|" + WA + "]] या [[संपर्क पन्ना|contact.html]]। अपने फ़ोन का नाम और दिख रही चेतावनी का स्क्रीनशॉट भेजना, हम ख़ुद मदद करेंगे।",
        rh: "Seedhe baat karni ho to WhatsApp karo: [[WhatsApp|" + WA + "]] ya [[Sampark panna|contact.html]]. Apne phone ka naam aur dikh rahi chetavani ka screenshot bhejna, hum khud madad karenge.",
        en: "To talk to us directly, message on WhatsApp: [[WhatsApp|" + WA + "]] or open the [[Contact page|contact.html]]. Send your phone's name and a screenshot of the warning you see, and we will help.",
        bn: "সরাসরি কথা বলতে WhatsApp করো: [[WhatsApp|" + WA + "]] বা [[যোগাযোগ পাতা|contact.html]]। তোমার ফোনের নাম আর যে সতর্কতা দেখছ তার স্ক্রিনশট পাঠিও, আমরা নিজে সাহায্য করব।"
      } },
    { id: "safe", img: [],
      k: ["safe", "safe hai", "secure", "trust", "fake", "scam", "sure", "surakshit", "sahi hai", "bharosa", "भरोसा", "सुरक्षित", "असली", "नकली", "सेफ", "নিরাপদ", "বিশ্বাস", "সেফ"],
      a: {
        hi: "Payal का APK सिर्फ़ इसी वेबसाइट से लो। फ़ोन की चेतावनी इसलिए आती है क्योंकि ऐप अभी Play Store पर नहीं है। आपकी जानकारी कैसे संभाली जाती है, यह [[प्राइवेसी पॉलिसी|privacy.html]] में लिखा है।",
        rh: "Payal ka APK sirf isi website se lo. Phone ki chetavani isliye aati hai kyunki app abhi Play Store par nahi hai. Aapki jaankari kaise sambhali jaati hai, yeh [[Privacy policy|privacy.html]] mein likha hai.",
        en: "Download the Payal APK only from this website. The phone warning appears because the app is not on the Play Store yet. How your information is handled is written in the [[Privacy policy|privacy.html]].",
        bn: "Payal-এর APK শুধু এই ওয়েবসাইট থেকেই নাও। ফোনের সতর্কতা আসে কারণ অ্যাপ এখনও Play Store-এ নেই। তোমার তথ্য কীভাবে সামলানো হয় তা [[প্রাইভেসি পলিসি|privacy.html]]-তে লেখা আছে।"
      } },
    { id: "store", img: [],
      k: ["play store", "playstore", "store par", "store me", "store mein", "ios", "iphone", "apple", "ipad", "प्ले स्टोर", "आईफोन", "आईफ़ोन", "প্লে স্টোর", "আইফোন"],
      a: {
        hi: "Payal अभी Play Store पर नहीं है और अभी Android फ़ोन के लिए है। इसी वजह से फ़ोन चेतावनी दिखाता है। उसके हल इस पन्ने की फ़ोटो में हैं।",
        rh: "Payal abhi Play Store par nahi hai aur abhi Android phone ke liye hai. Isi wajah se phone chetavani dikhata hai. Uske hal is panne ki photo mein hain.",
        en: "Payal is not on the Play Store yet and is for Android phones for now. That is why the phone shows warnings. The fixes are in the photos on this page.",
        bn: "Payal এখনও Play Store-এ নেই আর আপাতত Android ফোনের জন্য। সেই কারণেই ফোন সতর্কতা দেখায়। তার সমাধান এই পাতার ছবিগুলোতে আছে।"
      } },
    { id: "what", img: [],
      k: ["payal kya hai", "what is payal", "features", "feature", "kya karti", "kya kar sakti", "what can", "what does", "about", "batao", "payal ke bare", "payal ke baare", "voice", "awaaz", "camera", "memory", "yaad", "फ़ीचर", "फीचर", "पायल क्या", "क्या करती", "क्या कर सकती", "पायल", "পায়েল", "কী করে", "ফিচার", "কি করতে পারে"],
      a: {
        hi: "Payal आपकी अपनी AI साथी है: बोलकर और लिखकर बात करती है, कैमरा और फ़ोन के काम में मदद करती है, और आपकी बातें याद रखती है। यह आपकी अपनी Gemini API key से चलती है। पूरी जानकारी होम पेज के “फ़ीचर” हिस्से में है।",
        rh: "Payal aapki apni AI saathi hai: bolkar aur likhkar baat karti hai, camera aur phone ke kaam mein madad karti hai, aur aapki baatein yaad rakhti hai. Yeh aapki apni Gemini API key se chalti hai. Poori jaankari home page ke “Features” hisse mein hai.",
        en: "Payal is your own AI companion: it talks by voice and text, helps with the camera and phone tasks, and remembers your conversations. It runs on your own Gemini API key. Full details are in the “Features” section of the home page.",
        bn: "Payal তোমার নিজের AI সঙ্গী: কথা বলে ও লিখে আলাপ করে, ক্যামেরা আর ফোনের কাজে সাহায্য করে, আর তোমার কথা মনে রাখে। এটা তোমার নিজের Gemini API key দিয়ে চলে। পুরো তথ্য হোম পেজের “Features” অংশে আছে।"
      } },
    { id: "account", img: [],
      k: ["account", "login", "log in", "sign in", "signin", "register", "signup", "sign up", "password", "अकाउंट", "लॉगिन", "खाता", "साइन इन", "অ্যাকাউন্ট", "একাউন্ট", "লগইন", "লগ ইন"],
      a: {
        hi: "ऊपर ☰ मेनू में “👤 अकाउंट” पर जाओ और वहीं से लॉगिन करो। [[अकाउंट पन्ना|account.html]]",
        rh: "Upar ☰ menu mein “👤 Account” par jao aur wahin se login karo. [[Account panna|account.html]]",
        en: "Open “👤 Account” in the ☰ menu at the top and log in there. [[Account page|account.html]]",
        bn: "উপরে ☰ মেনুতে “👤 অ্যাকাউন্ট”-এ যাও আর সেখান থেকেই লগইন করো। [[অ্যাকাউন্ট পাতা|account.html]]"
      } },
    { id: "policy", img: [],
      k: ["refund", "privacy", "terms", "policy", "wapas", "paise wapas", "money back", "return", "नियम", "रिफ़ंड", "रिफंड", "प्राइवेसी", "शर्तें", "পলিসি", "রিফান্ড", "গোপনীয়তা", "শর্ত"],
      a: {
        hi: "नियम और नीतियाँ वेबसाइट के सबसे नीचे हैं: [[रिफ़ंड नीति|refund.html]], [[प्राइवेसी पॉलिसी|privacy.html]], [[उपयोग की शर्तें|terms.html]]।",
        rh: "Niyam aur policies website ke sabse neeche hain: [[Refund policy|refund.html]], [[Privacy policy|privacy.html]], [[Terms|terms.html]].",
        en: "The rules and policies are at the very bottom of the website: [[Refund policy|refund.html]], [[Privacy policy|privacy.html]], [[Terms of use|terms.html]].",
        bn: "নিয়ম ও নীতিগুলো ওয়েবসাইটের একদম নিচে আছে: [[রিফান্ড নীতি|refund.html]], [[প্রাইভেসি পলিসি|privacy.html]], [[ব্যবহারের শর্ত|terms.html]]।"
      } },
    { id: "lang", img: [],
      k: ["language", "english", "hindi", "bhasha", "change language", "भाषा", "अंग्रेज़ी", "अंग्रेजी", "हिंदी", "ভাষা", "ইংরেজি", "বাংলা"],
      a: {
        hi: "वेबसाइट की भाषा बदलने के लिए ऊपर ☰ मेनू में “English” / “हिंदी” वाला बटन दबाओ। इस हेल्प में ऊपर हिं / Hinglish / EN / বাং से भाषा चुन सकते हो।",
        rh: "Website ki bhasha badalne ke liye upar ☰ menu mein “English” / “Hindi” wala button dabao. Is help mein upar हिं / Hinglish / EN / বাং se bhasha chun sakte ho.",
        en: "To change the website language, tap the “English” / “हिंदी” button in the ☰ menu at the top. In this help window you can pick the language from हिं / Hinglish / EN / বাং above.",
        bn: "ওয়েবসাইটের ভাষা বদলাতে উপরে ☰ মেনুতে “English” / “हिंदी” বোতাম চাপো। এই হেল্পে উপরে हिं / Hinglish / EN / বাং থেকে ভাষা বেছে নিতে পারো।"
      } },
    { id: "mic", img: [],
      k: ["mic", "microphone", "voice nahi", "awaaz nahi", "permission", "sound", "bol nahi", "not listening", "sunti nahi", "sunai nahi", "आवाज़ नहीं", "आवाज नहीं", "माइक", "परमिशन", "सुनाई नहीं", "মাইক", "আওয়াজ", "পারমিশন", "শোনা যাচ্ছে না"],
      a: {
        hi: "फ़ोन की Settings → Apps → Payal → Permissions में Microphone (ज़रूरत हो तो Camera भी) की अनुमति दो। फिर ऐप दोबारा खोलो।",
        rh: "Phone ki Settings → Apps → Payal → Permissions mein Microphone (zaroorat ho to Camera bhi) ki anumati do. Phir app dobara kholo.",
        en: "In the phone's Settings → Apps → Payal → Permissions allow Microphone (and Camera if needed). Then open the app again.",
        bn: "ফোনের Settings → Apps → Payal → Permissions-এ Microphone (দরকার হলে Camera-ও) এর অনুমতি দাও। তারপর অ্যাপ আবার খোলো।"
      } },
    { id: "hello", img: [], w: 1,
      k: ["hi", "hello", "hey", "hii", "namaste", "namaskar", "salam", "नमस्ते", "नमस्कार", "हेलो", "हैलो", "हाय", "নমস্কার", "হ্যালো", "হাই", "আসসালামু"],
      a: UI.greet },
    { id: "thanks", img: [], w: 1,
      k: ["thanks", "thank you", "thank", "thx", "shukriya", "dhanyavad", "dhanyawad", "धन्यवाद", "शुक्रिया", "थैंक्स", "ধন্যবাদ", "থ্যাংক"],
      a: {
        hi: "आपका स्वागत है! और कुछ पूछना हो तो लिखो।",
        rh: "Aapka swagat hai! Aur kuch poochna ho to likho.",
        en: "You're welcome! Write if you want to ask anything else.",
        bn: "স্বাগতম! আর কিছু জানার থাকলে লেখো।"
      } }
  ];

  var CHIPS = [
    { id: "protect", t: { hi: "ऐप नहीं खुल रहा", rh: "App nahi khul raha", en: "App not opening", bn: "অ্যাপ খুলছে না" } },
    { id: "blocked", t: { hi: "इंस्टॉल नहीं हो रहा", rh: "Install nahi ho raha", en: "Cannot install", bn: "ইনস্টল হচ্ছে না" } },
    { id: "apikey", t: { hi: "API key कैसे बनाएँ", rh: "API key kaise banayein", en: "How to get API key", bn: "API key কীভাবে বানাব" } },
    { id: "plans", t: { hi: "प्लान और कीमत", rh: "Plan aur keemat", en: "Plans and price", bn: "প্ল্যান ও দাম" } },
    { id: "contact", t: { hi: "WhatsApp पर बात", rh: "WhatsApp par baat", en: "Talk on WhatsApp", bn: "WhatsApp-এ কথা" } }
  ];

  /* ---------- matching ---------- */
  var RH = {};
  ("hai nahi nahin kya kaise kese kyu kyun kaha kahan mein me ka ki ke ko se par pe raha rahi rahe hota hoti karo kare kar karna karu hu hoon mera meri mere aap aapka tum tumhara mujhe hum humara kaun kitna kitne chahiye batao bataiye dikha dikhao milega milta nhi nai ho hua hui gaya gayi abhi phir bhi aur ya lekin toh to wala wali").split(" ").forEach(function (w) { RH[w] = 1; });

  function norm(s) {
    s = String(s || "").toLowerCase().replace(/़/g, "");
    try { s = s.replace(/[^\p{L}\p{M}\p{N}₹\s]/gu, " "); } catch (e) { s = s.replace(/[.,!?;:()"'\[\]{}\/\\\-_]/g, " "); }
    return s.replace(/\s+/g, " ").trim();
  }
  function isLatin(s) { return /^[a-z0-9₹]+$/.test(s); }
  function lev1(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, d = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return d + (la - i) + (lb - j) <= 1;
  }
  KB.forEach(function (e) { e.n = e.k.map(norm); });

  function detect(raw, panel) {
    if (/[ঀ-৿]/.test(raw)) return "bn";
    if (/[ऀ-ॿ]/.test(raw)) return "hi";
    var t = norm(raw).split(" "), c = 0, i;
    for (i = 0; i < t.length; i++) if (RH[t[i]]) c++;
    if (c > 0) return "rh";
    return panel === "rh" ? "rh" : "en";
  }

  function find(raw) {
    var text = norm(raw);
    if (text.length < 2) return null;
    var tokens = text.split(" "), best = null, bs = 0, i, j, k, e, s, kw, hit, t;
    for (i = 0; i < KB.length; i++) {
      e = KB[i]; s = 0;
      for (j = 0; j < e.n.length; j++) {
        kw = e.n[j]; if (!kw) continue;
        if (kw.indexOf(" ") > -1) {
          if (text.indexOf(kw) > -1) s += 5;
          continue;
        }
        hit = 0;
        for (k = 0; k < tokens.length; k++) {
          t = tokens[k];
          if (t === kw) { hit = kw.length < 3 ? 2.5 : 3; break; }
          if (!isLatin(kw) && kw.length >= 3 && t.indexOf(kw) === 0) hit = Math.max(hit, 2.5);
          else if (isLatin(kw) && kw.length >= 5 && isLatin(t) && lev1(t, kw)) hit = Math.max(hit, 2.5);
        }
        s += hit;
      }
      s *= (e.w || 1);
      if (s > bs) { bs = s; best = e; }
    }
    return bs >= 2.5 ? best : null;
  }

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function rich(s) {
    return esc(s).replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, function (m, a, u) {
      var ext = /^https?:/.test(u);
      return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + a + "</a>";
    }).replace(/\n/g, "<br>");
  }
  function ls(get, k, v) {
    try { if (get) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  /* ---------- state ---------- */
  var lang = ls(true, LK) || "hi";
  if (!UI.intro[lang]) lang = "hi";
  var hist = [];
  try { hist = JSON.parse(ls(true, HK) || "[]"); if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; }
  var reported = {};
  var fab, ov, sc, stepsBox, chat, msgs, bar, inp, hint, io, revealed = false;

  function saveHist() { if (hist.length > 80) hist = hist.slice(hist.length - 80); ls(false, HK, JSON.stringify(hist)); }

  function logMissed(q, l) {
    var k = norm(q).slice(0, 200);
    if (!k || reported[k]) return;
    reported[k] = 1;
    var C = window.PAYAL || {};
    if (!C.supabaseUrl || !C.supabaseAnonKey) return;
    try {
      fetch(C.supabaseUrl + "/rest/v1/help_missed", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": C.supabaseAnonKey, "Authorization": "Bearer " + C.supabaseAnonKey, "Prefer": "return=minimal" },
        body: JSON.stringify({ q: String(q).slice(0, 300), lang: l, page: (location.pathname || "").slice(0, 80) })
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- build UI ---------- */
  function build() {
    fab = el("button", "pbh-fab",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.5-2 2-5 2"/></svg><span>Help</span>');
    fab.type = "button"; fab.setAttribute("aria-label", "Help");
    fab.addEventListener("click", open);
    document.body.appendChild(fab);

    ov = el("div", "pbh-ov");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Help");
    var top = el("div", "pbh-top");
    top.appendChild(el("h2", "", "Help"));
    var lg = el("div", "pbh-lang");
    [["hi", "हिं"], ["rh", "Hinglish"], ["en", "EN"], ["bn", "বাং"]].forEach(function (p) {
      var b = el("button", "", p[1]); b.type = "button"; b.setAttribute("data-l", p[0]);
      b.addEventListener("click", function () { lang = p[0]; ls(false, LK, lang); paint(); });
      lg.appendChild(b);
    });
    top.appendChild(lg);
    var x = el("button", "pbh-x", "✕"); x.type = "button"; x.setAttribute("aria-label", "Close"); x.addEventListener("click", close);
    top.appendChild(x);
    ov.appendChild(top);

    sc = el("div", "pbh-sc");
    var inn = el("div", "pbh-in");
    inn.appendChild(el("div", "pbh-intro"));
    stepsBox = el("div", "");
    inn.appendChild(stepsBox);
    inn.appendChild(el("div", "pbh-end"));
    hint = el("div", "pbh-hint");
    inn.appendChild(hint);
    chat = el("div", "pbh-chat");
    chat.appendChild(el("div", "pbh-ct"));
    msgs = el("div", "");
    chat.appendChild(msgs);
    inn.appendChild(chat);
    sc.appendChild(inn);

    bar = el("div", "pbh-bar");
    inp = el("input", ""); inp.type = "text"; inp.maxLength = 200; inp.setAttribute("autocomplete", "off");
    var sb = el("button", "", ""); sb.type = "button";
    bar.appendChild(inp); bar.appendChild(sb);
    sc.appendChild(bar);
    ov.appendChild(sc);
    document.body.appendChild(ov);

    sb.addEventListener("click", send);
    inp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); send(); } });
    sc.addEventListener("scroll", checkEnd, { passive: true });
    paint();
  }

  function paint() {
    var btns = ov.querySelectorAll(".pbh-lang button"), i;
    for (i = 0; i < btns.length; i++) btns[i].className = btns[i].getAttribute("data-l") === lang ? "on" : "";
    ov.querySelector(".pbh-intro").textContent = UI.intro[lang];
    hint.textContent = UI.hint[lang];
    chat.querySelector(".pbh-ct").textContent = UI.chat[lang];
    inp.placeholder = UI.ph[lang];
    bar.querySelector("button").textContent = UI.send[lang];
    stepsBox.innerHTML = "";
    STEPS.forEach(function (s, n) {
      var d = el("div", "pbh-st");
      d.appendChild(el("span", "pbh-n", UI.step[lang] + " " + (n + 1)));
      d.appendChild(el("p", "", rich(s.x[lang])));
      if (s.img) { var im = el("img"); im.src = "assets/help/" + s.img; im.alt = UI.step[lang] + " " + (n + 1); d.appendChild(im); }
      stepsBox.appendChild(d);
    });
    renderChat();
  }

  function bubble(m) {
    var row = el("div", "pbh-m " + m.r);
    var b = el("div", "pbh-b", rich(m.t));
    (m.im || []).forEach(function (n) { var im = el("img"); im.src = "assets/help/h" + n + ".jpg"; im.alt = ""; b.appendChild(im); });
    row.appendChild(b);
    return row;
  }

  function renderChat() {
    msgs.innerHTML = "";
    if (!hist.length) hist.push({ r: "b", t: UI.greet[lang] });
    hist.forEach(function (m) { msgs.appendChild(bubble(m)); });
    var ch = el("div", "pbh-chips");
    CHIPS.forEach(function (c) {
      var b = el("button", "", esc(c.t[lang])); b.type = "button";
      b.addEventListener("click", function () { ask(c.t[lang], c.id); });
      ch.appendChild(b);
    });
    msgs.appendChild(ch);
  }

  function reply(m) {
    hist.push(m); saveHist();
    renderChat();
    setTimeout(function () { sc.scrollTop = sc.scrollHeight; }, 30);
  }

  function ask(text, forceId) {
    text = String(text || "").trim();
    if (!text) return;
    var l = detect(text, lang);
    if (forceId) l = lang;
    hist.push({ r: "u", t: text });
    var e = null, i;
    if (forceId) { for (i = 0; i < KB.length; i++) if (KB[i].id === forceId) e = KB[i]; }
    else e = find(text);
    if (e) { saveHist(); reply({ r: "b", t: e.a[l] || e.a.en, im: e.img || [] }); }
    else { logMissed(text, l); saveHist(); reply({ r: "b", t: UI.none[l] }); }
  }

  function send() {
    var v = inp.value; inp.value = "";
    ask(v, null);
    inp.focus();
  }

  /* ---------- open / close / reveal ---------- */
  function reveal() {
    if (revealed) return;
    revealed = true;
    chat.className = "pbh-chat on";
    bar.className = "pbh-bar on";
    setTimeout(function () { sc.scrollTop = sc.scrollHeight; }, 60);
  }
  function checkEnd() {
    if (revealed) return;
    var end = ov.querySelector(".pbh-end");
    var r = end.getBoundingClientRect(), s = sc.getBoundingClientRect();
    if (r.top <= s.bottom + 4) reveal();
  }
  function open() {
    revealed = false;
    chat.className = "pbh-chat"; bar.className = "pbh-bar";
    paint();
    ov.className = "pbh-ov on";
    document.body.style.overflow = "hidden";
    sc.scrollTop = 0;
    setTimeout(checkEnd, 300);
  }
  function close() {
    ov.className = "pbh-ov";
    document.body.style.overflow = "";
  }
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && ov && ov.className.indexOf("on") > -1) close(); });

  function start() {
    if (!(window.PAYAL && window.PAYAL.supabaseUrl)) {
      var s = document.createElement("script"); s.src = "assets/config.js"; document.head.appendChild(s);
    }
    build();
  }
  window.__pbhTest = { find: find, detect: detect, KB: KB };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
