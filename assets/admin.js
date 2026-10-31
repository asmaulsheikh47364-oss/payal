(function () {
  var C = window.PAYAL || {};
  var $ = function (s) { return document.querySelector(s); };
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function show(id) { ["login", "denied", "app"].forEach(function (x) { $("#" + x).hidden = x !== id; }); }
  function toast(m) { var t = $("#toast"); t.textContent = m; t.style.display = "block"; setTimeout(function () { t.style.display = "none"; }, 2600); }
  function dt(s) { if (!s) return "-"; return new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }); }
  function call(fn, args) {
    return sb.rpc(fn, args || {}).then(function (r) {
      if (r.error) { toast(r.error.message); return null; }
      if (r.data && r.data.error) { toast("Error: " + r.data.error); return null; }
      return r.data;
    });
  }
  var tab = "overview";
  var TABS = [["overview", "Overview"], ["users", "Users"], ["payments", "Payments"], ["plans", "Plans & prices"], ["audit", "Audit log"]];
  function drawTabs() {
    var n = $("#tabs"); n.textContent = "";
    TABS.forEach(function (t) { n.appendChild(el("button", { text: t[1], class: tab === t[0] ? "on" : "", onclick: function () { tab = t[0]; drawTabs(); draw(); } })); });
  }
  function draw() {
    var v = $("#view"); v.textContent = "";
    if (tab === "overview") overview(v);
    else if (tab === "users") users(v, "");
    else if (tab === "payments") payments(v);
    else if (tab === "plans") plans(v);
    else audit(v);
  }
  function overview(v) {
    call("admin_overview").then(function (d) {
      if (!d) return;
      var items = [["Users", d.users], ["Plus active", d.plus], ["Pro active", d.pro], ["Blocked", d.blocked], ["Paid today", "Rs " + d.paid_today], ["Paid total", "Rs " + d.paid_total], ["Not paid yet", d.pending]];
      var g = el("div", { class: "grid" });
      items.forEach(function (i) { g.appendChild(el("div", { class: "card stat" }, [el("b", { text: String(i[1]) }), el("span", { text: i[0] })])); });
      v.appendChild(g);
    });
  }
  function users(v, q) {
    var inp = el("input", { placeholder: "Search by Gmail", value: q });
    var list = el("div");
    var go = function () { load(inp.value.trim()); };
    v.appendChild(el("div", { class: "row" }, [inp, el("button", { text: "Search", class: "pri", onclick: go })]));
    v.appendChild(list);
    function load(qq) {
      list.textContent = "";
      call("admin_users", { p_q: qq, p_limit: 50 }).then(function (rows) {
        if (!rows) return;
        if (!rows.length) list.appendChild(el("p", { class: "mut", text: "No users." }));
        rows.forEach(function (u) { list.appendChild(userCard(u, function () { load(qq); })); });
      });
    }
    load(q);
  }
  function userCard(u, reload) {
    var tags = [el("span", { class: "tag " + u.tier, text: u.tier.toUpperCase() })];
    if (u.blocked) tags.push(el("span", { class: "tag blk", text: "BLOCKED" }));
    var dev = u.device_id ? "Phone linked" : "No phone yet";
    if (u.pending_device) dev += " | new phone waiting since " + dt(u.pending_from);
    var plan = el("select", {}, [el("option", { value: "plus", text: "Plus" }), el("option", { value: "pro", text: "Pro" })]);
    var days = el("input", { type: "number", value: "30", min: "1", max: "3650", style: "width:80px" });
    var act = function (fn, args, msg) { return function () { if (msg && !confirm(msg)) return; call(fn, args).then(function (r) { if (r) { toast("Done"); reload(); } }); }; };
    return el("div", { class: "card" }, [
      el("div", { class: "row" }, [el("span", { class: "em", text: u.email || u.id })].concat(tags)),
      el("div", { class: "mut", text: "Joined " + dt(u.created_at) + " | Last login " + dt(u.last_sign_in_at) }),
      el("div", { class: "mut", text: (u.tier === "free" ? "Used today: " + Math.round(u.used_today / 60) + " of 10 min" : "Plan until " + dt(u.expires_at)) + " | " + dev }),
      el("div", { class: "row", style: "margin-top:8px" }, [plan, days, el("span", { text: "days" }),
        el("button", { text: "Give", class: "pri", onclick: function () { call("admin_grant", { p_user: u.id, p_plan: plan.value, p_days: parseInt(days.value, 10) || 30, p_note: "admin" }).then(function (r) { if (r) { toast("Plan given"); reload(); } }); } })]),
      el("div", { class: "row", style: "margin-top:8px" }, [
        el("button", { text: "Remove plan", class: "warn", onclick: act("admin_revoke", { p_user: u.id }, "Remove this user's paid plan now?") }),
        u.blocked ? el("button", { text: "Unblock", onclick: act("admin_block", { p_user: u.id, p_on: false, p_reason: "" }) })
                  : el("button", { text: "Block", class: "warn", onclick: act("admin_block", { p_user: u.id, p_on: true, p_reason: "admin" }, "Block this user? They get no free minutes and no paid features.") }),
        el("button", { text: "Reset phone link", onclick: act("admin_reset_device", { p_user: u.id }, "Unlink this user's phone? The next phone that logs in becomes the linked one.") })
      ])
    ]);
  }
  function payments(v) {
    call("admin_payments", { p_limit: 100 }).then(function (rows) {
      if (!rows) return;
      if (!rows.length) v.appendChild(el("p", { class: "mut", text: "No payments yet." }));
      rows.forEach(function (p) {
        v.appendChild(el("div", { class: "card" }, [
          el("div", { class: "row" }, [el("span", { class: "em", text: p.email || "-" }), el("span", { class: "tag " + p.plan, text: p.plan.toUpperCase() }), el("span", { class: p.status === "paid" ? "ok" : "mut", text: p.status + " | Rs " + p.amount })]),
          el("div", { class: "mut", text: "Created " + dt(p.created_at) + (p.paid_at ? " | Paid " + dt(p.paid_at) : "") }),
          el("div", { class: "mut", text: "Order " + (p.order_id || "-") + " | Payment " + (p.payment_id || "-") })
        ]));
      });
    });
  }
  function plans(v) {
    call("admin_plans").then(function (rows) {
      if (!rows) return;
      rows.forEach(function (p) {
        var f = {
          price: el("input", { type: "number", value: p.price, style: "width:90px" }),
          mrp: el("input", { type: "number", value: p.mrp, style: "width:90px" }),
          days: el("input", { type: "number", value: p.days, style: "width:80px" }),
          hi: el("input", { value: p.offer_hi || "" }),
          en: el("input", { value: p.offer_en || "" }),
          act: el("input", { type: "checkbox" })
        };
        f.act.checked = !!p.active;
        v.appendChild(el("div", { class: "card" }, [
          el("div", { class: "em", text: p.name + " (" + p.id + ")" }),
          el("div", { class: "row" }, [el("span", { text: "Price Rs" }), f.price, el("span", { text: "MRP Rs" }), f.mrp, el("span", { text: "Days" }), f.days]),
          el("div", { class: "row", style: "margin-top:6px" }, [el("span", { text: "Offer (Hindi)" }), f.hi]),
          el("div", { class: "row", style: "margin-top:6px" }, [el("span", { text: "Offer (English)" }), f.en]),
          el("div", { class: "row", style: "margin-top:6px" }, [f.act, el("span", { text: "Active (shown on website)" }),
            el("button", { text: "Save", class: "pri", onclick: function () {
              call("admin_set_plan", { p_id: p.id, p_price: parseInt(f.price.value, 10), p_mrp: parseInt(f.mrp.value, 10), p_offer_hi: f.hi.value, p_offer_en: f.en.value, p_days: parseInt(f.days.value, 10), p_active: f.act.checked })
                .then(function (r) { if (r) toast("Saved. Website shows it on next load."); });
            } })])
        ]));
      });
      v.appendChild(el("p", { class: "mut", text: "Price must be at least 1 and MRP must not be lower than the price. Show only honest discounts." }));
    });
  }
  function audit(v) {
    call("admin_audit", { p_limit: 100 }).then(function (rows) {
      if (!rows) return;
      rows.forEach(function (a) {
        v.appendChild(el("div", { class: "card" }, [el("div", { class: "row" }, [el("b", { text: a.action }), el("span", { class: "mut", text: dt(a.at) + " | " + (a.actor || "") })]), el("pre", { text: JSON.stringify(a.detail) })]));
      });
    });
  }
  $("#gbtn").addEventListener("click", function () {
    sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } }).then(function (r) { if (r.error) $("#err").textContent = r.error.message; });
  });
  $("#out").addEventListener("click", function () { sb.auth.signOut().then(function () { location.reload(); }); });
  function start(session) {
    if (!session) { show("login"); return; }
    $("#who").textContent = session.user.email || "";
    $("#out").hidden = false;
    sb.rpc("is_admin").then(function (r) {
      if (r.data === true) { show("app"); drawTabs(); draw(); } else show("denied");
    });
  }
  sb.auth.getSession().then(function (r) { start(r.data && r.data.session); });
})();
