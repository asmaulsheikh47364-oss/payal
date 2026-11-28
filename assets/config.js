/* Payal website settings. Prices and offer names live here for now; the server (next step) will take them over. */
window.PAYAL = {
  apkUrl: "https://payalapp.in/download/payal.apk",
  apkVersion: "1.0.68",
  apkBuild: 172,
  /* the version people see on the site (apkVersion and apkBuild stay as they are; the app reads apkBuild) */
  apkVersionName: "1.0.68",
  apkSize: "30 MB",
  apkSha256: "9dd3b901e04608292f9b95db3ba8ea69b796cadf128935ff4719bbcfedce82a6",
  whatsapp: "",
  email: "asmaulsheikh47364@gmail.com",
  paymentsLive: false,
  /* Offer countdown: change this date to end the offer sooner or later. Empty string hides every countdown.
     When the offer ends, the server itself switches the price to mrp at the same moment (cron job "payal-offer-end"),
     so the "From <date>: <mrp>" line on the site is a real, fixed fact. Keep this date and the server job the same. */
  offerName: "Winter Offer",
  offerEnds: "2026-11-30T23:59:59+05:30",
  supabaseUrl: "https://hwfifqyssabwwdjlbqty.supabase.co",
  supabaseAnonKey: "sb_publishable_p_qIHrnCIUqRK7l-rkDhRw_r-O0yIWW",
  plans: [
    { id: "free", price: 0, mrp: 0, offerHi: "", offerEn: "" },
    { id: "plus", price: 99, mrp: 599, offerHi: "", offerEn: "" },
    { id: "pro", price: 199, mrp: 999, offerHi: "", offerEn: "" }
  ]
};

/* NEXT OFFER (2026-11-28): when the offer above ends, this one starts by itself with the same prices.
   The page text, the offer name and the countdown switch on their own; the server job switches the names at the same moment. */
window.PAYAL.nextOffer = { name: "Christmas and New Year Offer", ends: "2027-01-01T23:59:59+05:30", from: "Winter" };
(function () {
  var C = window.PAYAL, n = C.nextOffer, now = Date.now();
  if (!n || !(Date.parse(C.offerEnds) <= now) || !(Date.parse(n.ends) > now)) return;
  C.offerName = n.name; C.offerEnds = n.ends;
  if (!document.body) return;
  var newBase = n.name.replace(/ Offer$/, "");
  var re = new RegExp(n.from + " ([Oo])ffer", "g");
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), t, list = [];
  while ((t = w.nextNode())) if (re.test(t.nodeValue)) list.push(t);
  list.forEach(function (x) { x.nodeValue = x.nodeValue.replace(re, function (m, o) { return newBase + " " + o + "ffer"; }); });
  /* festival look: sparkle instead of the winter sun, a small tree in the top strip */
  [].forEach.call(document.querySelectorAll('use[href="#i-sun"]'), function (u) { u.setAttribute("href", "#i-spark"); });
  [].forEach.call(document.querySelectorAll(".obar-sun"), function (sv) { var e = document.createElement("span"); e.className = "obar-sun"; e.textContent = "\uD83C\uDF84"; e.style.fontSize = "18px"; e.style.lineHeight = "1"; sv.parentNode.replaceChild(e, sv); });
})();

/* HIDE_SHA: false = the SHA-256 line is shown so careful users can check the downloaded file. */
var HIDE_SHA = false;
document.addEventListener("DOMContentLoaded", function () { var e = document.getElementById("sha"); if (e && HIDE_SHA) e.style.display = "none"; });
