(function () {
  var C = window.PAYAL || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* mobile menu */
  var bg = $("#burger"), lk = $("#links");
  if (bg && lk) {
    bg.addEventListener("click", function () { var o = lk.classList.toggle("open"); bg.classList.toggle("open", o); bg.setAttribute("aria-expanded", o ? "true" : "false"); });
    $$("#links a").forEach(function (a) { a.addEventListener("click", function () { lk.classList.remove("open"); bg.classList.remove("open"); }); });
    /* tap anywhere outside the menu and it closes by itself */
    function closeMenu() { lk.classList.remove("open"); bg.classList.remove("open"); bg.setAttribute("aria-expanded", "false"); }
    document.addEventListener("click", function (e) {
      if (!lk.classList.contains("open")) return;
      if (lk.contains(e.target) || bg.contains(e.target)) return;
      closeMenu();
    });
    document.addEventListener("touchstart", function (e) {
      if (!lk.classList.contains("open")) return;
      if (lk.contains(e.target) || bg.contains(e.target)) return;
      closeMenu();
    }, { passive: true });
  }

  /* links from config */
  /* the site opens for everyone; only the app download asks for a Gmail login first */
  function loggedIn() {
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true; } } catch (e) {}
    return false;
  }
  /* ask for Gmail right here (Google account chooser), no extra page in between */
  function googleGo() {
    if (!C.supabaseUrl) return false;
    if (!/[?&]dl=1/.test(location.search)) { try { sessionStorage.setItem("payal_hl", String(history.length)); } catch (e) {} }
    var u = C.supabaseUrl + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(location.origin + "/account.html");
    if (window.payalOpenLogin) window.payalOpenLogin(u); else location.href = u;
    return true;
  }
  /* menu "Log in": straight to the Google chooser, then back to this same page (not the account page) */
  (function () {
    var d = document.getElementById("m-dash");
    if (!d || /account\.html$/.test(location.pathname)) return;
    d.addEventListener("click", function (e) {
      if (loggedIn()) return;
      e.preventDefault();
      try { sessionStorage.setItem("payal_back", location.pathname + location.search + location.hash); } catch (x) {}
      if (!googleGo()) location.href = "account.html";
    });
  })();
  function countDl() {
    try { if (C.supabaseUrl) fetch(C.supabaseUrl + "/rest/v1/rpc/log_download", { method: "POST", keepalive: true, headers: { "apikey": C.supabaseAnonKey, "Content-Type": "application/json" }, body: JSON.stringify({ p_logged: loggedIn() }) }).catch(function () {}); } catch (e) {}
  }
  $$("[data-apk]").forEach(function (a) {
    a.href = C.apkUrl || "#";
    a.addEventListener("click", function (e) {
      countDl();
      if (loggedIn()) return;
      e.preventDefault();
      try { sessionStorage.setItem("payal_dl", "1"); } catch (x) {}
      if (googleGo()) return;
      location.href = "account.html?dl=1";
    });
  });
  $$("[data-wa]").forEach(function (a) {
    var msg = a.getAttribute("data-wa") || "Namaste, mujhe Payal ke baare mein poochna hai.";
    a.href = "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(msg);
    a.target = "_blank"; a.rel = "noopener";
  });
  $$("[data-mail]").forEach(function (e) { if (C.email) e.href = "mailto:" + C.email; });
  /* shown version: the readable name (e.g. 1.0.19); apkVersion and apkBuild stay as they are for the app's update check */
  $$("[data-v]").forEach(function (e) { e.textContent = C.apkVersionName ? "v" + C.apkVersionName : (C.apkVersion || ""); });
  $$("[data-size]").forEach(function (e) { e.textContent = C.apkSize || ""; });
  var sh = $("#sha"); if (sh && C.apkSha256 && C.apkSha256.indexOf("__") < 0) sh.textContent = "SHA-256: " + C.apkSha256;
  $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* plans: the current price comes from config / the server. No "price after the offer" is ever shown:
     a future price is not a fixed fact, so only the offer's end time is shown (countdown). */
  var lastPlans = null;
  function applyPlans(list) {
    lastPlans = list;
    var offerOn = !!(C.offerEnds && Date.parse(C.offerEnds) > Date.now());
    (list || []).forEach(function (p) {
      var rupee = "\u20b9" + p.price;
      $$('[data-p="' + p.id + '"]').forEach(function (e) { e.textContent = rupee; });
      $$('[data-after="' + p.id + '"]').forEach(function (e) { e.textContent = ""; e.style.display = "none"; });
      var el = $("#plan-" + p.id); if (!el) return;
      var now = $(".now", el), mrp = $(".mrp", el), save = $(".save", el), off = $(".offer", el);
      if (now) now.textContent = p.price === 0 ? "\u20b90" : rupee;
      if (mrp) mrp.style.display = "none";
      if (save) save.style.display = "none";
      if (off && !off.classList.contains("static")) {
        if (offerOn && p.price > 0 && p.mrp > p.price) { off.textContent = PT(C.offerName || "Chhath Puja ki Shubhkamnayein"); off.style.display = ""; }
        else { off.textContent = ""; off.style.display = "none"; }
      }
    });
  }
  applyPlans(C.plans);
  document.addEventListener("payal:lang", function () { applyPlans(lastPlans || C.plans); });
  /* prices and offers set in the admin panel replace the defaults */
  try {
    fetch(C.supabaseUrl + "/rest/v1/rpc/public_plans", { method: "POST", headers: { "apikey": C.supabaseAnonKey, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) return;
        var list = [{ id: "free", price: 0, mrp: 0, offerHi: "", offerEn: "" }];
        rows.forEach(function (x) { list.push({ id: x.id, price: x.price, mrp: x.mrp, offerHi: x.offerHi || "", offerEn: x.offerEn || "" }); });
        applyPlans(list);
      }).catch(function () {});
  } catch (e) {}

  /* buy */
  try {
    fetch(C.supabaseUrl + "/rest/v1/rpc/public_settings", { method: "POST", headers: { "apikey": C.supabaseAnonKey, "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.payments_live === true) C.paymentsLive = true; }).catch(function () {});
  } catch (e) {}
  var modal = $("#modal");
  function openModal(plan) {
    if (!modal) return;
    var t = $("#mplan"); if (t) t.textContent = plan || "";
    modal.classList.add("on");
  }
  $$("[data-buy]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var p = b.getAttribute("data-buy");
      if (p !== "plus" && p !== "pro") return;
      if (!loggedIn()) {
        try { sessionStorage.setItem("payal_plan", p); } catch (x) {}
        if (googleGo()) return;
      }
      location.href = "plan.html?plan=" + p;
    });
  });
  /* back from Google login with a plan chosen: go straight to that plan's page */
  try {
    var pp = sessionStorage.getItem("payal_plan");
    if ((pp === "plus" || pp === "pro") && loggedIn() && !/account\.html|plan\.html/.test(location.pathname)) { sessionStorage.removeItem("payal_plan"); location.replace("plan.html?plan=" + pp); }
  } catch (e) {}
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { modal.classList.remove("on"); }); });
  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) modal.classList.remove("on"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal) modal.classList.remove("on"); });

  /* scroll reveal */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (e) { io.observe(e); });
  } else { rv.forEach(function (e) { e.classList.add("in"); }); }
})();

/* Language chooser in the mobile menu (English, Hindi, Bangla). Choice is only remembered for now. */
(function(){
  try{
    var nav=document.getElementById('links'); if(!nav||document.getElementById('langbox'))return;
    var langs=[['en','English'],['hi','हिन्दी'],['bn','বাংলা']], cur=window.PAYAL_LANG||'en';
    var box=document.createElement('div'); box.id='langbox'; box.className='langbox';
    var btn=document.createElement('button'); btn.type='button'; btn.className='l langbtn'; btn.setAttribute('aria-expanded','false');
    function label(){var n=langs.filter(function(x){return x[0]===cur})[0];return 'Language<span class="lcur">'+(n?n[1]:'English')+'</span>'}
    btn.innerHTML=label();
    var list=document.createElement('div'); list.className='langlist'; list.hidden=true;
    langs.forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x[1];b.dataset.l=x[0];if(x[0]===cur)b.className='on';
      b.onclick=function(){cur=x[0];if(window.PAYAL_SETLANG)window.PAYAL_SETLANG(cur);
        [].forEach.call(list.children,function(c){c.className=c.dataset.l===cur?'on':''});btn.innerHTML=label();list.hidden=true;btn.setAttribute('aria-expanded','false')};
      list.appendChild(b)});
    btn.onclick=function(){list.hidden=!list.hidden;btn.setAttribute('aria-expanded',String(!list.hidden))};
    box.appendChild(btn);box.appendChild(list);
    var out=document.getElementById('m-out'); out?nav.insertBefore(box,out):nav.appendChild(box);
  }catch(e){}
})();

/* Admin button: shown on every page only when the signed-in Gmail is an admin (checked by the server).
   An old login is refreshed first, the same way the login library does, so the button does not vanish after an hour. */
(function () {
  try {
    var C = window.PAYAL || {}; if (!C.supabaseUrl) return;
    var ref = C.supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];
    var key = "sb-" + ref + "-auth-token";
    var raw = localStorage.getItem(key); if (!raw) return;
    var j = JSON.parse(raw); if (!j || !j.access_token) return;
    function fresh() {
      if (j.expires_at && j.expires_at * 1000 > Date.now() + 60000) return Promise.resolve(j.access_token);
      if (!j.refresh_token) return Promise.resolve(null);
      return fetch(C.supabaseUrl + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { "apikey": C.supabaseAnonKey, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: j.refresh_token }) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (n) {
          if (!n || !n.access_token) return null;
          if (!n.expires_at && n.expires_in) n.expires_at = Math.floor(Date.now() / 1000) + n.expires_in;
          try { localStorage.setItem(key, JSON.stringify(n)); } catch (e) {}
          return n.access_token;
        }).catch(function () { return null; });
    }
    fresh().then(function (tok) {
      if (!tok) return;
      return fetch(C.supabaseUrl + "/rest/v1/rpc/is_admin", { method: "POST", headers: { "apikey": C.supabaseAnonKey, "Authorization": "Bearer " + tok, "Content-Type": "application/json" }, body: "{}" })
        .then(function (r) { return r.ok ? r.json() : false; })
        .then(function (ok) {
          if (ok !== true) return;
          var sw = document.getElementById("swap"); if (sw) sw.hidden = false;
          var al = document.getElementById("adminlink"); if (al) al.hidden = false;
          var d = document.getElementById("m-dash");
          if (d && !document.getElementById("m-admin")) { var a = document.createElement("a"); a.className = "l"; a.id = "m-admin"; a.href = "/admin.html"; a.textContent = "Admin"; d.parentNode.insertBefore(a, d.nextSibling); }
        });
    }).catch(function () {});
  } catch (e) {}
})();

/* Festival sale strip: countdown "6d 03:35:59", the day and time the offer ends (no price after the offer), and the close button. */
(function () {
  var C = window.PAYAL || {}, bar = document.getElementById("obar");
  if (!bar) return;
  var end = C.offerEnds ? Date.parse(C.offerEnds) : NaN;
  try { if (sessionStorage.getItem("obar-closed") === String(end)) return; } catch (e) {}
  if (isNaN(end) || end <= Date.now()) return;
  function p(n) { return (n < 10 ? "0" : "") + n; }
  var cd = document.getElementById("obar-cd"), af = document.getElementById("obar-after");
  function after() {
    if (!af) return;
    var l = window.PAYAL_LANG || "en", loc = (l === "hi" ? "hi-IN" : l === "bn" ? "bn-IN" : "en-IN") + "-u-nu-latn";
    var d = new Date(end).toLocaleDateString(loc, { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    var tm = new Date(end).toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).toLowerCase();
    af.textContent = (window.PT ? PT("Ends {d}, {t}") : "Ends {d}, {t}").replace("{d}", d).replace("{t}", tm);
  }
  function tick() {
    var t = end - Date.now();
    if (t <= 0) { bar.hidden = true; return false; }
    var s = Math.floor(t / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    cd.textContent = (d > 0 ? d + "d " : "") + p(h) + ":" + p(m) + ":" + p(x);
    return true;
  }
  after(); document.addEventListener("payal:lang", after);
  bar.hidden = false;
  if (tick()) { var iv = setInterval(function () { if (!tick()) clearInterval(iv); }, 1000); }
  bar.querySelector(".obar-x").addEventListener("click", function () {
    bar.hidden = true;
    try { sessionStorage.setItem("obar-closed", String(end)); } catch (e) {}
  });
})();

/* When the phone shows a page again from its Back-button memory, reload it so login and plan state are fresh. */
window.addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });

/* Shine timing: one band per line, same speed (about 55 px a second) and the same thin width on every line. */
(function () {
  var SEL = ".shtxt,.festive,.plan.dw .offer,.plan .now,.price .now,.obar-t,.obar-p,.launchline,.plan.dw .t-offer";
  function tune() {
    var list = document.querySelectorAll(SEL);
    for (var i = 0; i < list.length; i++) {
      var e = list[i], w = e.getBoundingClientRect().width;
      if (!w) continue;
      e.style.setProperty("--bw", Math.min(12, (7 / (2 * w)) * 100).toFixed(2) + "%");
      e.style.animationDuration = Math.max(1.6, w / 55).toFixed(2) + "s";
    }
  }
  tune();
  [400, 1200, 3000].forEach(function (t) { setTimeout(tune, t); });
  window.addEventListener("resize", tune);
  window.addEventListener("load", tune);
  document.addEventListener("payal:lang", function () { setTimeout(tune, 50); });
})();
