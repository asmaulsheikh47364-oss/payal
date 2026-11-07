/* Payal website settings. Prices and offer names live here for now; the server (next step) will take them over. */
window.PAYAL = {
  apkUrl: "https://github.com/asmaulsheikh47364-oss/payal/releases/latest/download/payal.apk",
  apkVersion: "v56",
  apkSize: "64 MB",
  apkSha256: "0ea9ec2e125b321fe9633e609631c1d5a4e1d7df066bc4abcae243642a7d770a",
  whatsapp: "919321109411",
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
