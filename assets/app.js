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
    location.href = C.supabaseUrl + "/auth/v1/authorize?provider=google&prompt=select_account&redirect_to=" + encodeURIComponent(location.origin + "/account.html");
    return true;
  }
  $$("[data-apk]").forEach(function (a) {
    a.href = C.apkUrl || "#";
    a.addEventListener("click", function (e) {
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
  $$("[data-v]").forEach(function (e) { e.textContent = C.apkVersion || ""; });
  $$("[data-size]").forEach(function (e) { e.textContent = C.apkSize || ""; });
  var sh = $("#sha"); if (sh && C.apkSha256 && C.apkSha256.indexOf("__") < 0) sh.textContent = "SHA-256: " + C.apkSha256;
  $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* plans: prices, discount and saving are computed from config */
  function nextDay() {
    var t = C.offerEnds ? Date.parse(C.offerEnds) : NaN;
    if (isNaN(t)) return "";
    var loc = (window.PAYAL_LANG === "hi" ? "hi-IN" : window.PAYAL_LANG === "bn" ? "bn-IN" : "en-IN") + "-u-nu-latn";
    return new Date(t + 1000).toLocaleDateString(loc, { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  }
  var lastPlans = null;
  function applyPlans(list) {
    lastPlans = list;
    var nd = nextDay();
    (list || []).forEach(function (p) {
      var rupee = "\u20b9" + p.price;
      $$('[data-p="' + p.id + '"]').forEach(function (e) { e.textContent = rupee; });
      var after = p.mrp > p.price && p.price > 0 ? PT("After Diwali") + " \u20b9" + p.mrp + (nd ? " \u00b7 " + PT("from {d}").replace("{d}", nd) : "") : "";
      $$('[data-after="' + p.id + '"]').forEach(function (e) { e.textContent = after; e.style.display = after ? "" : "none"; });
      var el = $("#plan-" + p.id); if (!el) return;
      var now = $(".now", el), mrp = $(".mrp", el), save = $(".save", el), off = $(".offer", el);
      if (now) now.textContent = p.price === 0 ? "\u20b90" : rupee;
      if (mrp) mrp.style.display = "none";
      if (after) {
        if (save) { save.style.display = "inline-block"; save.textContent = after; }
        if (off && !off.classList.contains("static")) { off.textContent = PT(C.offerName || "Shubh Deepawali"); off.style.display = ""; }
      } else {
        if (save) save.style.display = "none";
        if (off && !off.classList.contains("static")) { off.textContent = ""; off.style.display = "none"; }
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
