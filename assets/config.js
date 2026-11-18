/* Payal website settings. Prices and offer names live here for now; the server (next step) will take them over. */
window.PAYAL = {
  apkUrl: "https://payalapp.in/download/payal.apk",
  apkVersion: "1.0.27",
  apkBuild: 131,
  /* the version people see on the site (apkVersion and apkBuild stay as they are; the app reads apkBuild) */
  apkVersionName: "1.0.27",
  apkSize: "25 MB",
  apkSha256: "9e9b2698325b0d6ba9b9a3b890334a06cfc5fcab266ac2750c95a46e539c8d40",
  whatsapp: "",
  email: "asmaulsheikh47364@gmail.com",
  paymentsLive: false,
  /* Offer countdown: change this date to end the offer sooner or later. Empty string hides every countdown.
     The site shows only when the offer ends, never a "price after the offer" (mrp is not shown as a future price). */
  offerName: "Kartik Purnima ki Shubhkamnayein",
  offerEnds: "2026-11-24T23:59:59+05:30",
  supabaseUrl: "https://hwfifqyssabwwdjlbqty.supabase.co",
  supabaseAnonKey: "sb_publishable_p_qIHrnCIUqRK7l-rkDhRw_r-O0yIWW",
  plans: [
    { id: "free", price: 0, mrp: 0, offerHi: "", offerEn: "" },
    { id: "plus", price: 49, mrp: 199, offerHi: "", offerEn: "" },
    { id: "pro", price: 99, mrp: 399, offerHi: "", offerEn: "" }
  ]
};

/* HIDE_SHA: false = the SHA-256 line is shown so careful users can check the downloaded file. */
var HIDE_SHA = false;
document.addEventListener("DOMContentLoaded", function () { var e = document.getElementById("sha"); if (e && HIDE_SHA) e.style.display = "none"; });
