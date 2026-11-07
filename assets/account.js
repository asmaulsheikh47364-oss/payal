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
    err("");
    sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } })
      .then(function (r) { if (r.error) err(r.error.message); });
  });
  $("#outbtn").addEventListener("click", function () { sb.auth.signOut().then(function () { show("login"); }); });
  function maskMail(e) {
    var i = e.indexOf("@");
    if (i < 3) return e;
    return e.slice(0, 2) + "***" + e.slice(i - 2);
  }
  var lastR = null;
  document.addEventListener("payal:lang", function () { if (lastR) render(lastR[0], lastR[1]); });
  function render(st, user) {
    lastR = [st, user];
    var m = user.user_metadata || {};
    $("#uname").textContent = m.full_name || m.name || "";
    $("#uemail").textContent = maskMail(user.email || "");
    var tier = st.tier || "free";
    $("#tier").textContent = tier === "pro" ? "Pro" : tier === "plus" ? "Plus" : "Free";
    $("#texp").textContent = tier === "free" ? hl("Free forever", "हमेशा मुफ़्त", "সবসময় বিনামূল্যে") : hl("Active until " + dtl(st.expires_at), "चालू है: " + dtl(st.expires_at) + " तक", "চালু আছে: " + dtl(st.expires_at) + " পর্যন্ত");
    if (tier === "free") {
      var s = st.free_seconds_left || 0;
      $("#free").textContent = Math.floor(s / 60) + ":" + two(s % 60);
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
  }
  function load(session) {
    if (!session) { show("login"); return; }
    sb.rpc("web_status").then(function (r) {
      if (r.error) { err(r.error.message); show("login"); return; }
      render(r.data || {}, session.user);
    });
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
  function loadRzp() {
    return new Promise(function (ok, bad) {
      if (window.Razorpay) { ok(); return; }
      var t = document.createElement("script"); t.src = "https://checkout.razorpay.com/v1/checkout.js";
      t.onload = ok; t.onerror = bad; document.head.appendChild(t);
    });
  }
  function reload() { sb.auth.getSession().then(function (r) { load(r.data && r.data.session); }); }
  window.payalBuy = function (plan) {
    err("");
    fn("order", { plan: plan }).then(function (o) {
      if (!o) return;
      if (o.error) { err(o.error); return; }
      loadRzp().then(function () {
        var rz = new window.Razorpay({
          key: o.key_id, amount: o.amount, currency: "INR", name: "Payal", description: (plan === "pro" ? "Pro" : "Plus") + " - 30 days",
          order_id: o.order_id, prefill: { email: o.email }, theme: { color: "#22d3ee" },
          handler: function (resp) {
            err(hl("Checking your payment...", "पेमेंट जाँच रहे हैं...", "পেমেন্ট যাচাই হচ্ছে..."));
            fn("verify", resp).then(function (v) {
              if (v && v.ok) { err(hl("Done! Your plan is active. Open the app.", "हो गया! आपका प्लान चालू है। ऐप खोलिए।", "হয়ে গেছে! আপনার প্ল্যান চালু। অ্যাপ খুলুন।")); reload(); }
              else err((v && v.error) || hl("Payment received but not confirmed yet. It will switch on by itself, or send us the Payment ID below.", "पेमेंट मिला पर अभी पक्का नहीं हुआ। वह अपने-आप चालू हो जाएगा, या नीचे पेमेंट ID भेजिए।", "পেমেন্ট পাওয়া গেছে কিন্তু এখনও নিশ্চিত হয়নি। নিজে থেকেই চালু হয়ে যাবে, অথবা নিচে পেমেন্ট ID পাঠান।"));
            });
          }
        });
        rz.open();
      }).catch(function () { err(hl("Payment window could not open.", "पेमेंट की विंडो नहीं खुल सकी।", "পেমেন্ট উইন্ডো খোলা যায়নি।")); });
    });
  };
  window.payalClaim = function (id) {
    return fn("claim", { payment_id: id });
  };
  (function () {
    var m = /[?&]plan=(plus|pro)/.exec(location.search);
    if (!m) return;
    fetch(C.supabaseUrl + "/rest/v1/rpc/public_settings", { method: "POST", headers: { "apikey": C.supabaseAnonKey, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.payments_live !== true) return;
        sb.auth.getSession().then(function (r) { if (r.data && r.data.session) window.payalBuy(m[1]); });
      }).catch(function () {});
  })();
  setup();
  sb.auth.getSession().then(function (r) { load(r.data && r.data.session); if (r.data && r.data.session) { mine(); adminLink(); } });
  sb.auth.onAuthStateChange(function (ev, session) { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") { load(session); if (session) { mine(); adminLink(); } } });
})();
