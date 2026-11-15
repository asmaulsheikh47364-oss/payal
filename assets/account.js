(function () {
  var C = window.PAYAL || {};
  var $ = function (s) { return document.querySelector(s); };
  function show(id) { ["loading", "login", "me"].forEach(function (x) { var e = $("#" + x); if (e) e.hidden = x !== id; }); }
  function err(m) { var e = $("#err"); if (e) e.textContent = m || ""; }
  function two(n) { return n < 10 ? "0" + n : "" + n; }
  function dt(s) {
    var d = new Date(s);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  }
  /* text in the chosen language: pick(en, hi, bn) */
  function hl(en, hi, bn) { return L(en, hi, bn); }
  function dtl(s) { var l = window.PAYAL_LANG === "hi" ? "hi-IN" : window.PAYAL_LANG === "bn" ? "bn-IN" : "en-IN"; return new Date(s).toLocaleDateString(l + "-u-nu-latn", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }); }
  if (!window.supabase || !C.supabaseUrl) { show("login"); err(hl("Server not connected", "सर्वर से जुड़ नहीं सका", "সার্ভারের সঙ্গে সংযোগ হয়নি")); return; }
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  $("#gbtn").addEventListener("click", function () {
    startGoogle();
  });
  function startGoogle() {
    err("");
    try { sessionStorage.setItem("payal_hl", String(history.length)); } catch (e) {}
    if (/[?&]dl=1/.test(location.search)) { try { sessionStorage.setItem("payal_dl", "1"); } catch (e) {} }
    try { sessionStorage.setItem("payal_go_t", String(Date.now())); } catch (e) {}
    return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, skipBrowserRedirect: true } })
      .then(function (r) { if (r.error) { show("login"); err(r.error.message); return; } if (r.data && r.data.url) { if (window.payalOpenLogin) window.payalOpenLogin(r.data.url); else location.href = r.data.url; } });
  }
  /* download button asks for Gmail: go straight to the Google chooser, no extra page */
  function autoGo() {
    if (!/[?&]dl=1/.test(location.search)) return false;
    try { var t = +sessionStorage.getItem("payal_go_t") || 0; if (Date.now() - t < 20000) return false; } catch (e) {}
    return true;
  }
  function maskMail(e) {
    var i = e.indexOf("@");
    if (i < 3) return e;
    return e.slice(0, 2) + "***" + e.slice(i - 2);
  }
  var lastR = null;
  document.addEventListener("payal:lang", function () { if (lastR) render(lastR[0], lastR[1]); });
  function render(st, user) {
    lastR = [st, user];
    var tier = st.tier || "free";
    $("#tier").textContent = tier === "pro" ? "Pro" : tier === "plus" ? "Plus" : "Free";
    $("#texp").textContent = tier === "free" ? "" : hl("Active until " + dtl(st.expires_at), "चालू है: " + dtl(st.expires_at) + " तक", "চালু আছে: " + dtl(st.expires_at) + " পর্যন্ত");
    if (tier === "free") {
      $("#free").textContent = hl("No limit", "कोई सीमा नहीं", "কোনো সীমা নেই");
    } else {
      $("#free").textContent = hl("No app limit", "कोई सीमा नहीं", "কোনো সীমা নেই");
    }
    if (st.device_bound) {
      $("#dev").textContent = hl("Linked", "जुड़ा है", "যুক্ত আছে");
      $("#devnote").textContent = st.pending_unlock_at ? hl("A new phone activates on " + dtl(st.pending_unlock_at) + ".", "नया फ़ोन " + dtl(st.pending_unlock_at) + " को चालू होगा।", "নতুন ফোন " + dtl(st.pending_unlock_at) + "-এ চালু হবে।") : hl("One Gmail, one phone.", "एक Gmail, एक फ़ोन।", "একটি Gmail, একটি ফোন।");
    } else {
      $("#dev").textContent = hl("None yet", "अभी कोई नहीं", "এখনও কোনোটি নেই");
      $("#devnote").textContent = hl("The first phone links when you log in from the app.", "ऐप में लॉग इन करते ही पहला फ़ोन जुड़ेगा।", "অ্যাপে লগ ইন করলেই প্রথম ফোন যুক্ত হবে।");
    }
    var locked = tier === "free";
    $("#giftlock").hidden = !locked;
    $("#giftopen").hidden = locked;
    if (!locked) { var tn = tier === "pro" ? "Pro" : "Plus"; $("#gifttitle").textContent = hl("Your " + tn + " app is ready", "आपका " + tn + " ऐप तैयार है", "আপনার " + tn + " অ্যাপ তৈরি"); }
    show("me");
    try {
      if (sessionStorage.getItem("payal_dl") === "1") { sessionStorage.removeItem("payal_dl"); var g = $("#gift"); if (g) g.scrollIntoView({ behavior: "smooth", block: "center" }); }
    } catch (e) {}
  }
  /* after Google login, step Back over the Google pages so the Back button never lands on Google again */
  function backOverGoogle() {
    try {
      var hl = +sessionStorage.getItem("payal_hl") || 0; if (!hl) return false;
      sessionStorage.removeItem("payal_hl");
      var n = history.length - hl;
      if (n > 0 && n < 15) { history.go(-n); return true; }
    } catch (e) {}
    return false;
  }
  function load(session) {
    if (!session) { if (autoGo()) { show("loading"); startGoogle(); } else show("login"); return; }
    if (window.payalLoginTabDone && window.payalLoginTabDone()) return;
    var dlFlow = false; try { dlFlow = sessionStorage.getItem("payal_dl") === "1"; } catch (e) {}
    if (dlFlow) { try { sessionStorage.removeItem("payal_hl"); } catch (e) {} }
    if (!dlFlow && backOverGoogle()) { try { sessionStorage.removeItem("payal_back"); } catch (e) {} return; }
    var back = null; try { back = sessionStorage.getItem("payal_back"); sessionStorage.removeItem("payal_back"); } catch (e) {}
    if (back && /^\/(?!\/)/.test(back) && !/account\.html/.test(back)) { location.replace(back); return; }
    var pp = null; try { pp = sessionStorage.getItem("payal_plan"); } catch (e) {}
    if (pp === "plus" || pp === "pro") { try { sessionStorage.removeItem("payal_plan"); } catch (e) {} location.replace("plan.html?plan=" + pp); return; }
    function ask(retry) {
      sb.rpc("web_status").then(function (r) {
        if (!r.error) { render(r.data || {}, session.user); return; }
        if (retry) { sb.auth.refreshSession().then(function (x) { if (x && x.data && x.data.session) { session = x.data.session; ask(false); } else { show("login"); } }); return; }
        render({}, session.user); err(r.error.message);
      });
    }
    ask(true);
  }
  function setup() {
    var kind = $("#hkind");
    if (!kind) return;
    function sync() { var p = kind.value === "payment"; $("#hplanw").style.display = p ? "" : "none"; $("#hrefw").style.display = p ? "" : "none"; }
    kind.addEventListener("change", sync); sync();
    $("#hsend").addEventListener("click", function () {
      var st = $("#hstat"); st.textContent = "...";
      var rid = $("#href").value.trim();
      if (kind.value === "payment" && /^pay_[A-Za-z0-9]+$/.test(rid) && window.payalClaim) {
        window.payalClaim(rid).then(function (v) {
          if (v && v.ok) { st.textContent = hl("Verified! Your plan is active.", "पक्का हो गया! आपका प्लान चालू है।", "যাচাই হয়েছে! আপনার প্ল্যান চালু।"); $("#href").value = ""; reload(); }
          else { st.textContent = (v && v.error) || "..."; sendMsg(st); }
        });
        return;
      }
      sendMsg(st);
    });
    function sendMsg(st) {
      sb.rpc("support_send", { p_kind: kind.value, p_plan: kind.value === "payment" ? $("#hplan").value : null, p_ref: $("#href").value, p_message: $("#hmsg").value }).then(function (r) {
        if (r.error) { st.textContent = r.error.message; return; }
        if (r.data && r.data.error) { st.textContent = r.data.error; return; }
        st.textContent = hl("Sent. We will check soon.", "भेज दिया। जल्द देखा जाएगा।", "পাঠানো হয়েছে। শীঘ্রই দেখা হবে।");
        $("#hmsg").value = ""; $("#href").value = ""; mine();
      });
    }
  }
  function mine() {
    sb.rpc("support_mine").then(function (r) {
      var box = $("#hmine"); if (!box || !r.data || !r.data.items) return;
      box.textContent = "";
      r.data.items.forEach(function (m) {
        var p = document.createElement("p"); p.className = "fine";
        p.textContent = dtl(m.created_at) + " · " + (m.status === "done" ? "✔ " : "⏳ ") + (m.admin_note || (m.status === "done" ? hl("Done", "हो गया", "হয়েছে") : hl("Pending", "बाकी है", "বাকি আছে")));
        box.appendChild(p);
      });
    });
  }
  function adminLink() {
    sb.rpc("is_admin").then(function (r) { var l = $("#adminlink"); var sw = $("#swap"); if (r.data === true) { if (l) l.hidden = false; if (sw) sw.hidden = false; } });
  }

  function fn(path, body) {
    return sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) { err(hl("Please log in first.", "पहले लॉग इन कीजिए।", "আগে লগ ইন করুন।")); return null; }
      return fetch(C.supabaseUrl + "/functions/v1/pay/" + path, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.access_token, "apikey": C.supabaseAnonKey }, body: JSON.stringify(body) })
        .then(function (x) { return x.json(); });
    });
  }
  function reload() { sb.auth.getSession().then(function (r) { load(r.data && r.data.session); }); }
  window.payalClaim = function (id) {
    return fn("claim", { payment_id: id });
  };
  setup();
  sb.auth.getSession().then(function (r) { load(r.data && r.data.session); if (r.data && r.data.session) { mine(); adminLink(); } });
  sb.auth.onAuthStateChange(function (ev, session) { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") { load(session); if (session) { mine(); adminLink(); } } });
})();
