(function () {
  var C = window.PAYAL || {};
  var $ = function (s) { return document.querySelector(s); };
  function show(id) { ["loading", "login", "me"].forEach(function (x) { var e = $("#" + x); if (e) e.hidden = x !== id; }); }
  function err(m) { var e = $("#err"); if (e) e.textContent = m || ""; }
  function two(n) { return n < 10 ? "0" + n : "" + n; }
  function dt(s) {
    var d = new Date(s);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  }
  function hl(hi, en) { return '<span class="hi">' + hi + '</span><span class="en">' + en + '</span>'; }
  if (!window.supabase || !C.supabaseUrl) { show("login"); err("Server not connected"); return; }
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  $("#gbtn").addEventListener("click", function () {
    err("");
    sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } })
      .then(function (r) { if (r.error) err(r.error.message); });
  });
  $("#outbtn").addEventListener("click", function () { sb.auth.signOut().then(function () { show("login"); }); });
  function render(st, user) {
    var m = user.user_metadata || {};
    $("#uname").textContent = m.full_name || m.name || "";
    $("#uemail").textContent = user.email || "";
    var tier = st.tier || "free";
    $("#tier").textContent = tier === "pro" ? "Pro" : tier === "plus" ? "Plus" : "Free";
    $("#texp").innerHTML = tier === "free" ? hl("हमेशा मुफ़्त", "Free forever") : hl("चालू है: " + dt(st.expires_at) + " तक", "Active until " + dt(st.expires_at));
    if (tier === "free") {
      var s = st.free_seconds_left || 0;
      $("#free").textContent = Math.floor(s / 60) + ":" + two(s % 60);
    } else {
      $("#free").innerHTML = hl("कोई सीमा नहीं", "No app limit");
    }
    if (st.device_bound) {
      $("#dev").innerHTML = hl("जुड़ा है", "Linked");
      $("#devnote").innerHTML = st.pending_unlock_at ? hl("नया फ़ोन " + dt(st.pending_unlock_at) + " को चालू होगा।", "A new phone activates on " + dt(st.pending_unlock_at) + ".") : hl("एक Gmail, एक फ़ोन।", "One Gmail, one phone.");
    } else {
      $("#dev").innerHTML = hl("अभी कोई नहीं", "None yet");
      $("#devnote").innerHTML = hl("ऐप में login करते ही पहला फ़ोन जुड़ेगा।", "The first phone links when you log in from the app.");
    }
    show("me");
  }
  function load(session) {
    if (!session) { show("login"); return; }
    sb.rpc("web_status").then(function (r) {
      if (r.error) { err(r.error.message); show("login"); return; }
      render(r.data || {}, session.user);
    });
  }
  function setup() {
    var kind = $("#hkind");
    if (!kind) return;
    function sync() { var p = kind.value === "payment"; $("#hplanw").style.display = p ? "" : "none"; $("#hrefw").style.display = p ? "" : "none"; }
    kind.addEventListener("change", sync); sync();
    $("#hsend").addEventListener("click", function () {
      var st = $("#hstat"); st.textContent = "...";
      sb.rpc("support_send", { p_kind: kind.value, p_plan: kind.value === "payment" ? $("#hplan").value : null, p_ref: $("#href").value, p_message: $("#hmsg").value }).then(function (r) {
        if (r.error) { st.textContent = r.error.message; return; }
        if (r.data && r.data.error) { st.textContent = r.data.error; return; }
        st.textContent = document.documentElement.lang === "en" ? "Sent. We will check soon." : "भेज दिया। जल्द देखा जाएगा।";
        $("#hmsg").value = ""; $("#href").value = ""; mine();
      });
    });
  }
  function mine() {
    sb.rpc("support_mine").then(function (r) {
      var box = $("#hmine"); if (!box || !r.data || !r.data.items) return;
      box.textContent = "";
      r.data.items.forEach(function (m) {
        var p = document.createElement("p"); p.className = "fine";
        p.textContent = dt(m.created_at) + " · " + (m.status === "done" ? "✔ " : "⏳ ") + (m.admin_note || (m.status === "done" ? "Done" : "Pending"));
        box.appendChild(p);
      });
    });
  }
  function adminLink() {
    sb.rpc("is_admin").then(function (r) { var l = $("#adminlink"); if (l && r.data === true) l.hidden = false; });
  }
  setup();
  sb.auth.getSession().then(function (r) { load(r.data && r.data.session); if (r.data && r.data.session) { mine(); adminLink(); } });
  sb.auth.onAuthStateChange(function (ev, session) { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT") { load(session); if (session) { mine(); adminLink(); } } });
})();
