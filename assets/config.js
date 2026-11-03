/* Payal website settings. Prices and offer names live here for now; the server (next step) will take them over. */
window.PAYAL = {
  apkUrl: "https://github.com/asmaulsheikh47364-oss/payal/releases/latest/download/payal.apk",
  apkVersion: "v54",
  apkSize: "62 MB",
  apkSha256: "377b600f2e8b844fcd33067feb1493889134f36575d5dc2338c3261d999fff4f",
  whatsapp: "919321109411",
  paymentsLive: false,
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
