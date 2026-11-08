(function () {
  var C = window.PAYAL || {};
  var $ = function (s) { return document.querySelector(s); };
  function L3(en, hi, bn) { return window.L ? window.L(en, hi, bn) : en; }
  var m = /[?&]plan=(plus|pro)/.exec(location.search);
  if (!m) { location.replace("index.html#plans"); return; }
  var plan = m[1];
  var PN = plan === "pro" ? "Pro" : "Plus";

  function show(id) { ["loading", "login", "pv"].forEach(function (x) { var e = $("#" + x); if (e) e.hidden = x !== id; }); }
  function topErr(t) { var e = $("#perr"); if (e) e.textContent = t || ""; }
  function stat(kind, text, linkHref, linkText) {
    var s = $("#pstat"); if (!s) { topErr(text); return; }
    s.className = "pstat " + (kind || "");
    s.textContent = text || "";
    if (linkHref) { var a = document.createElement("a"); a.href = linkHref; a.textContent = linkText; a.className = "plink"; s.appendChild(document.createElement("br")); s.appendChild(a); }
    s.hidden = !text;
    if (text) { try { s.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {} }
  }

  if (!window.supabase || !C.supabaseUrl) { show("login"); renderLogin(); topErr(L3("Server not connected", "सर्वर से जुड़ नहीं सका", "সার্ভারের সঙ্গে সংযোগ হয়নি")); return; }
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });

  /* ---- what each plan gives ---- */
  var ROWS = [
    { t: ["Live voice conversation, no time limit", "लाइव आवाज़ बातचीत, कोई समय सीमा नहीं", "লাইভ ভয়েস কথোপকথন, কোনো সময়সীমা নেই"], plus: 1, pro: 1 },
    { t: ["Four characters and voices", "चारों किरदार और आवाज़ें", "চারটি চরিত্র ও কণ্ঠস্বর"], plus: 1, pro: 1 },
    { t: ["Typed chat with Payal", "Payal से टाइप करके चैट", "Payal-এর সঙ্গে টাইপ করে চ্যাট"], plus: 1, pro: 1 },
    { t: ["Camera and photo understanding", "कैमरा और फ़ोटो समझना", "ক্যামেরা ও ছবি বোঝা"], plus: 1, pro: 1 },
    { t: ["Location and map", "लोकेशन और मैप", "লোকেশন ও ম্যাপ"], plus: 1, pro: 1 },
    { t: ["Normal web search", "सामान्य वेब सर्च", "সাধারণ ওয়েব সার্চ"], plus: 1, pro: 1 },
    { t: ["Phone control (open apps, calls, settings)", "फ़ोन कंट्रोल (ऐप खोलना, कॉल, सेटिंग)", "ফোন কন্ট্রোল (অ্যাপ খোলা, কল, সেটিং)"], plus: 0, pro: 1 },
    { t: ["Screen reading", "स्क्रीन पढ़ना", "স্ক্রিন পড়া"], plus: 0, pro: 1 },
    { t: ["Deep research search", "गहरी रिसर्च सर्च", "গভীর রিসার্চ সার্চ"], plus: 0, pro: 1 },
    { t: ["Build websites and coding partner", "वेबसाइट बनाना और कोडिंग साथी", "ওয়েবসাইট বানানো ও কোডিং সঙ্গী"], plus: 0, pro: 1 }
  ];

  var info = null; /* price, mrp, offer names */
  function planInfo() {
    var fb = null;
    (C.plans || []).forEach(function (x) { if (x.id === plan) fb = x; });
    return fb || { id: plan, price: plan === "pro" ? 99 : 49, mrp: plan === "pro" ? 399 : 199, offerHi: "", offerEn: "" };
  }
  info = planInfo();
  function loadInfo() {
    return fetch(C.supabaseUrl + "/rest/v1/rpc/public_plans", { method: "POST", headers: { "apikey": C.supabaseAnonKey, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows)) return;
        rows.forEach(function (x) { if (x.id === plan) info = { id: plan, price: x.price, mrp: x.mrp, offerHi: x.offerHi || "", offerEn: x.offerEn || "" }; });
      }).catch(function () {});
  }

  function nextDay() {
    var t = C.offerEnds ? Date.parse(C.offerEnds) : NaN;
    if (isNaN(t)) return "";
    var loc = (window.PAYAL_LANG === "hi" ? "hi-IN" : window.PAYAL_LANG === "bn" ? "bn-IN" : "en-IN") + "-u-nu-latn";
    return new Date(t + 1000).toLocaleDateString(loc, { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  }
  function offerName() {
    var l = window.PAYAL_LANG;
    var n = l === "hi" ? info.offerHi : info.offerEn;
    n = n || info.offerEn || info.offerHi;
    return n || (window.PT ? window.PT(C.offerName || "Shubh Deepawali") : (C.offerName || ""));
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function svgUse(id) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("class", "i"); s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS("http://www.w3.org/2000/svg", "use"); u.setAttribute("href", "#" + id); s.appendChild(u); return s;
  }

  var current = null; /* status from web_status */
  function renderPlan() {
    stopQr();
    var box = $("#pv"); box.textContent = "";
    $("#backtxt").textContent = L3("All plans", "सारे प्लान", "সব প্ল্যান");
    var card = el("div", "plan dw planbig");
    card.appendChild(el("div", "pat"));
    var on = !!(C.offerEnds && Date.parse(C.offerEnds) > Date.now());
    var off = el("div", "offer", on || info.offerEn || info.offerHi ? offerName() : L3("Payal " + PN, "Payal " + PN, "Payal " + PN));
    card.appendChild(off);
    card.appendChild(el("h3", "", "Payal " + PN));
    var price = el("div", "price");
    price.appendChild(el("span", "now", "₹" + info.price));
    price.appendChild(el("span", "per", L3("/ 30 days", "/ 30 दिन", "/ ৩০ দিন")));
    card.appendChild(price);
    var nd = nextDay();
    if (on && info.mrp > info.price) {
      card.appendChild(el("div", "save", L3("After Diwali", "दिवाली के बाद", "দীপাবলির পরে") + " ₹" + info.mrp + (nd ? " · " + L3("from " + nd, nd + " से", nd + " থেকে") : "")));
    }
    if (on) {
      var cd = el("div", "plan-cd"); cd.appendChild(el("small", "", L3("Offer ends in", "ऑफ़र ख़त्म होने में", "অফার শেষ হতে")));
      var b = el("b", "cdh"); b.setAttribute("data-cd", "hms"); b.setAttribute("data-noi18n", ""); b.textContent = "--:--:--"; cd.appendChild(b); card.appendChild(cd);
    }
    card.appendChild(el("p", "psub", L3("Here is exactly what you get with " + PN + " and what you do not.", PN + " में आपको ठीक-ठीक क्या मिलेगा और क्या नहीं, नीचे देखिए।", PN + "-এ ঠিক কী পাবেন আর কী পাবেন না, নিচে দেখুন।")));
    var ul = el("ul", "rows");
    ROWS.forEach(function (r) {
      var yes = r[plan] === 1;
      var li = el("li", yes ? "yes" : "no");
      li.appendChild(svgUse(yes ? "i-check" : "i-x"));
      li.appendChild(el("span", "", L3(r.t[0], r.t[1], r.t[2])));
      ul.appendChild(li);
    });
    card.appendChild(ul);
    var tier = current && current.tier;
    var btn = el("button", "btn primary cta", L3("Buy " + PN + " for ₹" + info.price, PN + " ₹" + info.price + " में खरीदें", PN + " ₹" + info.price + "-এ কিনুন"));
    btn.type = "button"; btn.id = "buybtn";
    btn.addEventListener("click", buy);
    card.appendChild(btn);
    var st = el("div", "pstat"); st.id = "pstat"; st.setAttribute("aria-live", "polite"); st.hidden = true; card.appendChild(st);
    if (tier === plan) {
      st.hidden = false; st.className = "pstat info";
      st.textContent = L3("You already have " + PN + ". Buying again adds 30 more days.", "आपके पास " + PN + " पहले से है। फिर खरीदने पर 30 दिन और जुड़ेंगे।", "আপনার " + PN + " আগেই আছে। আবার কিনলে আরও ৩০ দিন যোগ হবে।");
    }
    card.appendChild(el("p", "pnote", L3("30 days, never renews by itself. One Gmail, one phone.", "30 दिन चलता है, अपने-आप दोबारा नहीं कटता। एक Gmail, एक फ़ोन।", "৩০ দিন চলে, নিজে থেকে আর কাটে না। এক Gmail, এক ফোন।")));
    var bn = banner();
    if (bn) box.appendChild(bn);
    box.appendChild(card);
    show("pv");
  }

  /* ---- result banner (after the full payment page sends the customer back) ---- */
  var payParam = (/[?&]pay=(ok|failed|pending|cancel)/.exec(location.search) || [])[1] || "";
  function successBox() {
    var d = el("div", "pstat ok big");
    d.appendChild(el("div", "bigline", "\u2705 Payment Successful"));
    d.appendChild(el("div", "", L3("Verified. Your " + PN + " plan is now active. Open the app and log in with the same Gmail.", "पक्का हो गया। आपका " + PN + " प्लान अब चालू है। ऐप खोलकर उसी Gmail से लॉग इन कीजिए।", "যাচাই হয়েছে। আপনার " + PN + " প্ল্যান এখন চালু। অ্যাপ খুলে একই Gmail দিয়ে লগ ইন করুন।")));
    var a = el("a", "plink", L3("Go to my account and download the app", "मेरा खाता खोलिए और ऐप डाउनलोड कीजिए", "আমার অ্যাকাউন্ট খুলুন ও অ্যাপ ডাউনলোড করুন")); a.href = "account.html"; d.appendChild(a);
    return d;
  }
  function banner() {
    if (paidNow) return successBox();
    if (payParam === "ok") return successBox();
    if (payParam === "pending") { var p = el("div", "pstat info", L3("Payment received. We are confirming it, your plan will switch on by itself in a moment.", "पेमेंट मिल गया। हम पक्का कर रहे हैं, प्लान थोड़ी देर में अपने-आप चालू हो जाएगा।", "পেমেন্ট পাওয়া গেছে। নিশ্চিত করা হচ্ছে, প্ল্যান একটু পরে নিজে থেকেই চালু হবে।")); p.style.marginBottom = "14px"; return p; }
    if (payParam === "failed") { var f = el("div", "pstat err", L3("Payment did not complete. If money was cut, it will switch on by itself, or open your account and send us the Payment ID.", "पेमेंट पूरा नहीं हुआ। अगर पैसा कटा है तो प्लान अपने-आप चालू हो जाएगा, या खाता खोलकर पेमेंट ID भेजिए।", "পেমেন্ট সম্পূর্ণ হয়নি। টাকা কাটলে প্ল্যান নিজে থেকেই চালু হবে, নয়তো অ্যাকাউন্ট খুলে পেমেন্ট ID পাঠান।")); f.style.marginBottom = "14px"; return f; }
    if (payParam === "cancel") { var c = el("div", "pstat info", L3("Payment cancelled. Tap Buy when you are ready.", "पेमेंट रद्द हुआ। तैयार हों तो फिर Buy दबाइए।", "পেমেন্ট বাতিল হয়েছে। তৈরি হলে আবার Buy চাপুন।")); c.style.marginBottom = "14px"; return c; }
    return null;
  }
  var paidNow = false;

  /* ---- scan-and-pay QR: new QR every 30 minutes, checks by itself when paid ---- */
  var qrTick = null, qrPoll = null;
  function stopQr() { clearInterval(qrTick); clearInterval(qrPoll); qrTick = null; qrPoll = null; }
  function qrSection() {
    var w = el("div", "qrbox");
    w.appendChild(el("h4", "", L3("Or pay by scanning a QR", "या QR स्कैन करके पैसा दीजिए", "অথবা QR স্ক্যান করে টাকা দিন")));
    w.appendChild(el("p", "qrhelp", L3("Tap the button, take a screenshot of the QR, open PhonePe or Google Pay, choose scan, and pick the screenshot from your gallery. The amount fills in by itself.", "बटन दबाइए, QR का स्क्रीनशॉट लीजिए, PhonePe या Google Pay खोलकर स्कैन चुनिए और गैलरी से वह स्क्रीनशॉट चुन लीजिए। रक़म अपने-आप भर जाएगी।", "বোতাম চাপুন, QR-এর স্ক্রিনশট নিন, PhonePe বা Google Pay খুলে স্ক্যান বেছে গ্যালারি থেকে স্ক্রিনশটটি নিন। টাকার অঙ্ক নিজে থেকেই বসে যাবে।")));
    var b = el("button", "btn ghost qrbtn", L3("Show QR code", "QR कोड दिखाइए", "QR কোড দেখান")); b.type = "button"; b.addEventListener("click", showQr);
    w.appendChild(b);
    var area = el("div", "qrarea"); area.id = "qrarea"; w.appendChild(area);
    return w;
  }
  function showQr() {
    var area = $("#qrarea"); if (!area) return;
    stopQr();
    area.textContent = L3("Making your QR...", "आपका QR बन रहा है...", "আপনার QR তৈরি হচ্ছে...");
    fn("qr", { plan: plan }).then(function (q) {
      area.textContent = "";
      if (!q) return;
      if (q.error) { var em = el("div", "pstat err", L3("QR is not available right now. Please use the Buy button above.", "QR अभी उपलब्ध नहीं है। कृपया ऊपर वाला Buy बटन इस्तेमाल कीजिए।", "QR এখন পাওয়া যাচ্ছে না। উপরের Buy বোতাম ব্যবহার করুন।")); if (q.detail) { em.appendChild(document.createElement("br")); em.appendChild(el("small", "", String(q.detail))); } area.appendChild(em); return; }
      var img = el("img", "qrimg"); img.alt = "UPI QR"; img.src = q.image_url; area.appendChild(img);
      var amt = el("div", "qramt", "\u20b9" + q.amount); area.appendChild(amt);
      var cd = el("div", "qrcd"); area.appendChild(cd);
      function draw() {
        var left = q.expires_at - Math.floor(Date.now() / 1000);
        if (left <= 0) { stopQr(); showQr(); return; }
        var m = Math.floor(left / 60), sec = left % 60;
        cd.textContent = L3("This QR is valid for ", "यह QR चालू है ", "এই QR চালু আছে ") + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec + L3(" more. A new one appears by itself.", " और। नया अपने-आप आ जाएगा।", " আরও। নতুন একটি নিজে থেকেই আসবে।");
      }
      draw(); qrTick = setInterval(draw, 1000);
      qrPoll = setInterval(function () {
        fn("status", { order_id: q.qr_id }).then(function (r) {
          if (r && r.status === "paid") { stopQr(); paidNow = true; sb.rpc("web_status").then(function (x) { current = x && x.data ? x.data : current; }).catch(function () {}).then(renderPlan); try { window.scrollTo(0, 0); } catch (e) {} }
        });
      }, 4000);
    });
  }

  function renderLogin() {
    $("#backtxt").textContent = L3("All plans", "सारे प्लान", "সব প্ল্যান");
    $("#ltitle").textContent = L3("Log in to continue with " + PN, PN + " के लिए पहले लॉग इन कीजिए", PN + "-এর জন্য আগে লগ ইন করুন");
    $("#lsub").textContent = L3("Use the same Gmail you will use in the app. Your plan is tied to it.", "वही Gmail इस्तेमाल कीजिए जो ऐप में चलाएँगे। प्लान उसी से जुड़ेगा।", "যে Gmail অ্যাপে ব্যবহার করবেন সেটাই দিন। প্ল্যান ওটার সঙ্গে জুড়বে।");
    $("#gbtn").textContent = "G  " + L3("Continue with Google", "Google से आगे बढ़ें", "Google দিয়ে এগিয়ে যান");
  }
  function startGoogle() {
    topErr("");
    try { sessionStorage.setItem("payal_plan", plan); sessionStorage.setItem("payal_go_t", String(Date.now())); } catch (e) {}
    return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + "/account.html", queryParams: { prompt: "select_account" } } })
      .then(function (r) { if (r.error) { show("login"); renderLogin(); topErr(r.error.message); } });
  }
  $("#gbtn").addEventListener("click", startGoogle);
  /* tapping a plan on the home page goes straight to the Google account chooser */
  function autoGo() {
    try { var t = +sessionStorage.getItem("payal_go_t") || 0; if (Date.now() - t < 20000) return false; } catch (e) {}
    return true;
  }

  /* ---- payment ---- */
  function fn(path, body) {
    return sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) { stat("err", L3("Please log in first.", "पहले लॉग इन कीजिए।", "আগে লগ ইন করুন।")); return null; }
      return fetch(C.supabaseUrl + "/functions/v1/pay/" + path, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.access_token, "apikey": C.supabaseAnonKey }, body: JSON.stringify(body) })
        .then(function (x) {
          return x.json().catch(function () { return { error: "Server reply could not be read (code " + x.status + ")" }; }).then(function (j) {
            if (!x.ok && j && !j.error) j.error = "Server error (code " + x.status + ")";
            return j;
          });
        });
    });
  }
  function loadRzp() {
    return new Promise(function (ok, bad) {
      if (window.Razorpay) { ok(); return; }
      var t = document.createElement("script"); t.src = "https://checkout.razorpay.com/v1/checkout.js";
      t.onload = ok; t.onerror = bad; document.head.appendChild(t);
    });
  }
  function busy(on) {
    var b = $("#buybtn"); if (!b) return;
    b.disabled = on;
    if (on) { b.setAttribute("data-t", b.textContent); b.textContent = L3("Opening payment...", "पेमेंट खुल रहा है...", "পেমেন্ট খুলছে..."); }
    else if (b.getAttribute("data-t")) { b.textContent = b.getAttribute("data-t"); }
  }
  function buy() {
    stat("", "");
    busy(true);
    fetch(C.supabaseUrl + "/rest/v1/rpc/public_settings", { method: "POST", headers: { "apikey": C.supabaseAnonKey, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.payments_live !== true) { busy(false); stat("info", L3("Payments are starting soon. Please come back a little later.", "पेमेंट जल्द शुरू हो रहा है। थोड़ी देर बाद फिर आइए।", "পেমেন্ট শীঘ্রই শুরু হচ্ছে। একটু পরে আবার আসুন।")); return; }
        return fn("order", { plan: plan }).then(function (o) {
          if (!o) { busy(false); return; }
          if (o.error) { busy(false); stat("err", String(o.error)); return; }
          return loadRzp().then(function () {
            busy(false);
            var rz = new window.Razorpay({
              key: o.key_id, amount: o.amount, currency: "INR", name: "Payal", description: PN + " - 30 days",
              order_id: o.order_id, prefill: { email: o.email }, theme: { color: "#f0ac2e" },
              modal: { ondismiss: function () { stat("info", L3("Payment window closed. Tap Buy when you are ready.", "पेमेंट की विंडो बंद हो गई। तैयार हों तो फिर Buy दबाइए।", "পেমেন্ট উইন্ডো বন্ধ হয়েছে। তৈরি হলে আবার Buy চাপুন।")); } },
              handler: function (resp) {
                stat("info", L3("Checking your payment...", "पेमेंट जाँच रहे हैं...", "পেমেন্ট যাচাই হচ্ছে..."));
                fn("verify", resp).then(function (v) {
                  if (v && v.ok) { paidNow = true; current = { tier: plan }; renderPlan(); try { window.scrollTo(0, 0); } catch (e) {} }
                  else stat("err", (v && v.error) || L3("Payment received but not confirmed yet. It will switch on by itself, or open your account and send us the Payment ID.", "पेमेंट मिला पर अभी पक्का नहीं हुआ। वह अपने-आप चालू हो जाएगा, या खाता खोलकर पेमेंट ID भेजिए।", "পেমেন্ট পাওয়া গেছে কিন্তু এখনও নিশ্চিত হয়নি। নিজে থেকেই চালু হবে, নয়তো অ্যাকাউন্ট খুলে পেমেন্ট ID পাঠান।"), "account.html", L3("Open my account", "मेरा खाता खोलिए", "আমার অ্যাকাউন্ট খুলুন"));
                });
              }
            });
            rz.open();
          }).catch(function () { busy(false); stat("err", L3("Payment window could not open. Check your internet and try again.", "पेमेंट की विंडो नहीं खुल सकी। इंटरनेट देखकर फिर कोशिश कीजिए।", "পেমেন্ট উইন্ডো খোলা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।")); });
        });
      }).catch(function () { busy(false); stat("err", L3("Could not reach the server. Check your internet and try again.", "सर्वर तक नहीं पहुँच सके। इंटरनेट देखकर फिर कोशिश कीजिए।", "সার্ভারে পৌঁছানো যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।")); });
  }

  function start(session) {
    if (!session) { renderLogin(); if (autoGo()) { show("loading"); startGoogle(); } else show("login"); return; }
    sb.rpc("web_status").then(function (r) { current = r && r.data ? r.data : null; }).catch(function () {}).then(function () { return loadInfo(); }).then(renderPlan);
  }
  document.addEventListener("payal:lang", function () {
    if (!$("#pv").hidden) renderPlan(); else renderLogin();
  });
  sb.auth.getSession().then(function (r) { start(r.data && r.data.session); });
  sb.auth.onAuthStateChange(function (ev, session) { if (ev === "SIGNED_OUT") { renderLogin(); show("login"); } });
})();
