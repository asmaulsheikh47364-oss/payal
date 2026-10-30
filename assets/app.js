(function () {
  var C = window.PAYAL || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* language */
  function setLang(l) {
    document.documentElement.lang = l;
    try { localStorage.setItem("payal_lang", l); } catch (e) {}
    var b = $("#langBtn"); if (b) b.textContent = l === "hi" ? "English" : "हिन्दी";
  }
  var saved = "hi";
  try { saved = localStorage.getItem("payal_lang") || "hi"; } catch (e) {}
  setLang(saved);
  var lb = $("#langBtn");
  if (lb) lb.addEventListener("click", function () { setLang(document.documentElement.lang === "hi" ? "en" : "hi"); });

  /* mobile menu */
  var bg = $("#burger"), lk = $("#links");
  if (bg && lk) {
    bg.addEventListener("click", function () { lk.classList.toggle("open"); });
    $$("#links a").forEach(function (a) { a.addEventListener("click", function () { lk.classList.remove("open"); }); });
  }

  /* links from config */
  $$("[data-apk]").forEach(function (a) { a.href = C.apkUrl || "#"; });
  $$("[data-wa]").forEach(function (a) {
    var msg = a.getAttribute("data-wa") || "Namaste, mujhe Payal ke baare mein poochna hai.";
    a.href = "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(msg);
    a.target = "_blank"; a.rel = "noopener";
  });
  $$("[data-v]").forEach(function (e) { e.textContent = C.apkVersion || ""; });
  $$("[data-size]").forEach(function (e) { e.textContent = C.apkSize || ""; });
  var sh = $("#sha"); if (sh && C.apkSha256 && C.apkSha256.indexOf("__") < 0) sh.textContent = "SHA-256: " + C.apkSha256;
  $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* plans: prices, discount and saving are computed from config */
  (C.plans || []).forEach(function (p) {
    var el = $("#plan-" + p.id); if (!el) return;
    var now = $(".now", el), mrp = $(".mrp", el), save = $(".save", el), off = $(".offer", el);
    if (now) now.textContent = p.price === 0 ? "₹0" : "₹" + p.price;
    if (p.mrp > p.price && p.price > 0) {
      var pct = Math.round((1 - p.price / p.mrp) * 100);
      if (mrp) mrp.textContent = "₹" + p.mrp;
      if (save) { save.style.display = "inline-block"; save.querySelector(".hi").textContent = pct + "% की बचत · ₹" + (p.mrp - p.price) + " कम"; save.querySelector(".en").textContent = "Save " + pct + "% · ₹" + (p.mrp - p.price) + " off"; }
      if (off) { off.querySelector(".hi").textContent = "🔥 " + p.offerHi; off.querySelector(".en").textContent = "🔥 " + p.offerEn; }
    } else { if (mrp) mrp.style.display = "none"; if (save) save.style.display = "none"; }
  });

  /* buy */
  var modal = $("#modal");
  function openModal(plan) {
    if (!modal) return;
    var t = $("#mplan"); if (t) t.textContent = plan || "";
    modal.classList.add("on");
  }
  $$("[data-buy]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      if (C.paymentsLive) { location.href = "account.html?plan=" + b.getAttribute("data-buy"); return; }
      openModal(b.getAttribute("data-buy").toUpperCase());
    });
  });
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
