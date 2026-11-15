/* Payal site language engine: English (default), Hindi, Bangla.
   Texts are found once at load (English, as written in the page) and swapped from PAYAL_DICT. */
(function () {
  var D = window.PAYAL_DICT || {};
  var LANGS = ["en", "hi", "bn"];
  var SKIP = { SCRIPT: 1, STYLE: 1, SVG: 1, svg: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 0 };
  var INLINE = { A: 1, B: 1, STRONG: 1, I: 1, EM: 1, SPAN: 1, CODE: 1, SMALL: 1, KBD: 1, MARK: 1, U: 1, SUP: 1, SUB: 1 };
  var units = [];

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }
  function inLang(l) { return LANGS.indexOf(l) >= 0 ? l : "en"; }

  var lang = "en";
  try { lang = inLang(localStorage.getItem("payal_lang") || "en"); } catch (e) {}

  function skipEl(e) { return SKIP[e.tagName] === 1 || e.hasAttribute("data-noi18n"); }

  function collect(root) {
    var ch = root.children, i, e;
    for (i = 0; i < ch.length; i++) {
      e = ch[i];
      if (skipEl(e)) continue;
      attrs(e);
      var hasText = false, n;
      for (n = e.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
      var kids = [], k;
      for (k = 0; k < e.children.length; k++) { var t = e.children[k].tagName; if (t !== "svg" && t !== "BR") kids.push(e.children[k]); }
      var wordKids = kids.filter(function (c) { return c.textContent.trim() && !c.hasAttribute("data-noi18n"); });
      if (hasText && wordKids.length && kids.every(function (c) { return INLINE[c.tagName]; })) {
        /* text mixed with inline tags: translate the whole inner HTML as one sentence (icons become {svg1}, {svg2}...) */
        var svgs = [], inner = norm(e.innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, function (m) { svgs.push(m); return "{svg" + svgs.length + "}"; }));
        units.push({ type: "html", el: e, key: inner, orig: e.innerHTML, svgs: svgs });
        for (k = 0; k < kids.length; k++) attrs(kids[k]);
        continue;
      }
      if (hasText) {
        for (n = e.firstChild; n; n = n.nextSibling) {
          if (n.nodeType === 3 && n.nodeValue.trim()) {
            units.push({ type: "text", node: n, key: norm(n.nodeValue), orig: n.nodeValue });
          }
        }
      }
      collect(e);
    }
  }
  function attrs(e) {
    ["placeholder", "aria-label", "title", "alt"].forEach(function (a) {
      var v = e.getAttribute && e.getAttribute(a);
      if (v && /[A-Za-z]{2}/.test(v)) units.push({ type: "attr", el: e, attr: a, key: norm(v), orig: v });
    });
  }

  function tr(key, l) { var d = D[key]; return d && d[l] ? d[l] : null; }

  function applyUnit(u, l) {
    var t = l === "en" ? null : tr(u.key, l);
    if (u.type === "text") {
      if (t == null) u.node.nodeValue = u.orig;
      else { var lead = /^\s/.test(u.orig) ? " " : "", trail = /\s$/.test(u.orig) ? " " : ""; u.node.nodeValue = lead + t + trail; }
    } else if (u.type === "html") {
      if (t == null) u.el.innerHTML = u.orig;
      else u.el.innerHTML = t.replace(/\{svg(\d+)\}/g, function (m, n) { return u.svgs[n - 1] || ""; });
    } else if (u.type === "attr") {
      u.el.setAttribute(u.attr, t == null ? u.orig : t);
    } else if (u.type === "title") {
      document.title = t == null ? u.orig : t;
    } else if (u.type === "meta") {
      u.el.setAttribute("content", t == null ? u.orig : t);
    }
  }

  function apply(l, silent) {
    lang = inLang(l);
    window.PAYAL_LANG = lang;
    document.documentElement.lang = lang;
    units.forEach(function (u) { applyUnit(u, lang); });
    try { localStorage.setItem("payal_lang", lang); } catch (e) {}
    if (!silent) { try { document.dispatchEvent(new CustomEvent("payal:lang", { detail: lang })); } catch (e) {} }
  }

  /* collect now, before other scripts change the page */
  if (document.title) units.push({ type: "title", key: norm(document.title), orig: document.title });
  [].forEach.call(document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[property="og:title"]'), function (m) {
    var v = m.getAttribute("content"); if (v) units.push({ type: "meta", el: m, key: norm(v), orig: v });
  });
  if (document.body) collect(document.body);

  /* plain strings used by other scripts */
  window.PT = function (en) { var t = lang === "en" ? null : tr(norm(en), lang); return t == null ? en : t; };
  /* pick by language for JS-made text: L(en, hi, bn) */
  window.L = function (en, hi, bn) { return lang === "hi" ? hi : lang === "bn" ? bn : en; };
  window.PAYAL_SETLANG = function (l) { apply(l, false); };
  window.PAYAL_KEYS = function () { return units.map(function (u) { return u.key; }); };

  apply(lang, true);
})();
