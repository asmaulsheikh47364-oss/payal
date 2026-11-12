/* Payal website settings. Prices and offer names live here for now; the server (next step) will take them over. */
window.PAYAL = {
  apkUrl: "https://payalapp.in/download/payal.apk",
  apkVersion: "v59",
  apkBuild: 123,
  apkSize: "26 MB",
  apkSha256: "078b19afae266a1475777ef4c16bee672df99a2208dd5190de8a52927ebb90f8",
  whatsapp: "",
  email: "asmaulsheikh47364@gmail.com",
  paymentsLive: false,
  /* Offer countdown: change this date to end the offer sooner or later. Empty string hides every countdown. */
  offerName: "Shubh Deepawali",
  offerEnds: "2026-11-10T23:59:59+05:30",
  supabaseUrl: "https://hwfifqyssabwwdjlbqty.supabase.co",
  supabaseAnonKey: "sb_publishable_p_qIHrnCIUqRK7l-rkDhRw_r-O0yIWW",
  plans: [
    { id: "free", price: 0, mrp: 0, offerHi: "", offerEn: "" },
    { id: "plus", price: 49, mrp: 199, offerHi: "लॉन्च ऑफ़र", offerEn: "Launch offer" },
    { id: "pro", price: 99, mrp: 399, offerHi: "लॉन्च ऑफ़र", offerEn: "Launch offer" }
  ]
};

/* HIDE_SHA */
document.addEventListener("DOMContentLoaded", function () { var e = document.getElementById("sha"); if (e) e.style.display = "none"; });
