/* Payal website settings. Prices and offer names live here for now; the server (next step) will take them over. */
window.PAYAL = {
  apkUrl: "https://payalapp.in/download/payal.apk",
  apkVersion: "1.0.49",
  apkBuild: 153,
  /* the version people see on the site (apkVersion and apkBuild stay as they are; the app reads apkBuild) */
  apkVersionName: "1.0.49",
  apkSize: "28 MB",
  apkSha256: "abe5229f227469e0608b25cd846e3c71f561609add6be5e7db2699f2b8899f0c",
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

/* HIDE_SHA: false = the SHA-256 line is shown so careful users can check the downloaded file. */
var HIDE_SHA = false;
document.addEventListener("DOMContentLoaded", function () { var e = document.getElementById("sha"); if (e && HIDE_SHA) e.style.display = "none"; });
