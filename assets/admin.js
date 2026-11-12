(function () {
  var C = window.PAYAL || {};
  var $ = function (s) { return document.querySelector(s); };
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  var SITE = "https://payalapp.in/";
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
  function toast(m) { var t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(function () { t.style.display = "none"; }, 3200); }
  function dt(s) { if (!s) return "-"; return new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }); }
  function d0(s) { if (!s) return "-"; return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }); }
  function call(fn, args) {
    return sb.rpc(fn, args || {}).then(function (r) {
      if (r.error) { toast(r.error.message); return null; }
      if (r.data && r.data.error) { toast("Galat: " + r.data.error); return null; }
      return r.data;
    });
  }
  /* PLAN GUARD: a paid plan can be given only when the person has none running; never stacked or queued.
     Success puts a green tick on the button; a repeat tap shows the reason for a few seconds. */
  var givenNow = {};
  function planOf(userId, email) {
    if (givenNow[userId] && givenNow[userId].until > Date.now()) return Promise.resolve(givenNow[userId]);
    return sb.rpc("admin_users", { p_q: email || "", p_limit: 50 }).then(function (r) {
      var row = null; (r.data || []).forEach(function (x) { if (x.id === userId) row = x; });
      if (row && row.tier && row.tier !== "free" && row.expires_at && Date.parse(row.expires_at) > Date.now()) return { plan: row.tier, until: Date.parse(row.expires_at) };
      return null;
    }).catch(function () { return null; });
  }
  function flash(btn, text, ok) {
    var host = btn.parentNode; if (!host) return;
    var old = host.querySelector(".gmsg"); if (old) old.remove();
    var m = el("div", { class: "gmsg " + (ok ? "ok" : "bad"), text: text });
    host.parentNode.insertBefore(m, host.nextSibling);
    setTimeout(function () { if (m.parentNode) m.remove(); }, ok ? 4000 : 7000);
  }
  function guardedGive(btn, userId, email, planName, doGive) {
    if (btn.dataset.busy === "1") return;
    btn.dataset.busy = "1"; btn.disabled = true;
    planOf(userId, email).then(function (cur) {
      if (cur) {
        btn.dataset.busy = ""; btn.disabled = false;
        flash(btn, "Nahi diya: is user ka " + (PN[cur.plan] || cur.plan) + " plan " + d0(new Date(cur.until).toISOString()) + " tak pehle se chalu hai. Wo khatam hone ke baad hi naya plan de sakte hain.", false);
        return;
      }
      doGive().then(function (res) {
        btn.dataset.busy = ""; btn.disabled = false;
        if (!res) { flash(btn, "Plan nahi diya ja saka (upar ka sandesh dekhiye).", false); return; }
        givenNow[userId] = { plan: res.plan, until: Date.now() + res.days * 86400000 };
        if (!btn.querySelector(".gtick")) btn.appendChild(el("span", { class: "gtick", text: " \u2714" }));
        flash(btn, planName + " " + res.days + " din ke liye de diya.", true);
      });
    });
  }
  function waLink(phone, text) {
    var p = String(phone || "").replace(/[^0-9]/g, "");
    if (p.length === 10) p = "91" + p;
    return "https://wa.me/" + p + "?text=" + encodeURIComponent(text);
  }
  var PN = { free: "Free", plus: "Plus", pro: "Pro" };
  var tab = "home";
  var TABS = [["home", "Home"], ["users", "Users"], ["gift", "🎁 Gift"], ["help", "Madad"], ["cust", "💰 Grahak"], ["pay", "Payments"], ["plans", "Daam"], ["log", "Log"]];
  function drawTabs() {
    var n = $("#tabs"); n.textContent = "";
    TABS.forEach(function (t) { n.appendChild(el("button", { text: t[1], class: tab === t[0] ? "on" : "", onclick: function () { tab = t[0]; drawTabs(); draw(); } })); });
  }
  function draw() {
    var v = $("#view"); v.textContent = "";
    ({ home: home, users: users, gift: gift, help: helpbox, cust: customers, pay: payments, plans: plans, log: audit })[tab](v);
  }
  function home(v) {
    call("admin_overview").then(function (d) {
      if (!d) return;
      var items = [["Total users", d.users], ["Plus chalu", d.plus], ["Pro chalu", d.pro], ["Block", d.blocked], ["Aaj ki kamai", "Rs " + d.paid_today], ["Kul kamai", "Rs " + d.paid_total], ["Madad baaki", d.support_open]];
      var g = el("div", { class: "grid" });
      items.forEach(function (i) { g.appendChild(el("div", { class: "card stat" }, [el("b", { text: String(i[1]) }), el("span", { text: i[0] })])); });
      v.appendChild(g);
      funnel(v);
      v.appendChild(el("div", { class: "row grow" }, [
        el("button", { text: "👥 Users dekho", class: "pri", onclick: function () { tab = "users"; drawTabs(); draw(); } }),
        el("button", { text: "🎁 Gift do", class: "vio", onclick: function () { tab = "gift"; drawTabs(); draw(); } })
      ]));
    });
  }
  /* where people stop: website login -> download -> app connected -> paid */
  function funnel(v) {
    var box = el("div", { class: "card" }, [el("b", { text: "Log kahan ruk rahe hain" })]);
    v.appendChild(box);
    var g = el("div", { class: "grid" }); box.appendChild(g);
    function add(n, t) { g.appendChild(el("div", { class: "card stat" }, [el("b", { text: String(n) }), el("span", { text: t })])); }
    call("admin_funnel").then(function (f) {
      if (!f) { box.appendChild(el("p", { class: "mut", text: "Download ginti abhi chalu nahi hui (database mein ek baar SQL chalana baaki hai)." })); }
      else {
        add(f.join_today + " / " + f.join_week + " / " + f.join_total, "Gmail login: aaj / 7 din / kul");
        add(f.seen_today, "Aaj aaye (login kiya)");
        add(f.dl_today + " / " + f.dl_week + " / " + f.dl_total, "Download dabaya: aaj / 7 din / kul");
      }
      call("admin_users", { p_q: "", p_limit: 5000 }).then(function (rows) {
        if (!rows) return;
        var app = 0, active = 0, paid = 0;
        rows.forEach(function (u) { if (u.device_id) app++; if (u.used_today > 0) active++; if (u.tier && u.tier !== "free") paid++; });
        add(app, "App mein jude (phone juda)");
        add(active, "Aaj app chalaya (free)");
        add(paid, "Plan wale (Plus/Pro)");
      });
    });
  }
  function users(v) {
    var inp = el("input", { placeholder: "Gmail likho aur Search dabao" });
    var list = el("div");
    v.appendChild(el("div", { class: "row" }, [el("div", { style: "flex:1 1 200px" }, [inp]), el("button", { text: "Search", class: "pri", onclick: function () { load(inp.value.trim()); } })]));
    v.appendChild(list);
    function load(q) {
      list.textContent = "";
      call("admin_users", { p_q: q, p_limit: 50 }).then(function (rows) {
        if (!rows) return;
        if (!rows.length) list.appendChild(el("p", { class: "mut", text: "Koi user nahi mila." }));
        rows.forEach(function (u) { list.appendChild(userCard(u, function () { load(q); })); });
      });
    }
    load("");
  }
  function userCard(u, reload) {
    var tags = [el("span", { class: "tag " + u.tier, text: PN[u.tier] || u.tier })];
    if (u.blocked) tags.push(el("span", { class: "tag blk", text: "BLOCK" }));
    var info = u.tier === "free" ? "Aaj use: " + Math.round(u.used_today / 60) + " min" : PN[u.tier] + " " + d0(u.expires_at) + " tak";
    var dev = u.device_id ? "Phone juda hai" : "Phone abhi nahi juda";
    if (u.pending_device) dev += " | naya phone intezaar mein";
    var more = el("div", { class: "more", hidden: "" });
    var days = el("input", { type: "number", value: "30", min: "1", max: "3650" });
    var act = function (fn, args, msg) { return function () { if (msg && !confirm(msg)) return; call(fn, args).then(function (r) { if (r) { toast("Ho gaya"); reload(); } }); }; };
    var give = function (plan) { return function (ev) { var b = ev.currentTarget; var n = parseInt(days.value, 10) || 30; guardedGive(b, u.id, u.email, PN[plan], function () { return call("admin_grant", { p_user: u.id, p_plan: plan, p_days: n, p_note: "admin" }).then(function (r) { if (r) { setTimeout(reload, 2500); return { plan: plan, days: n }; } return null; }); }); }; };
    more.appendChild(el("label", { text: "Kitne din ke liye plan dena hai" }));
    more.appendChild(days);
    more.appendChild(el("div", { class: "row grow", style: "margin-top:8px" }, [el("button", { text: "Plus do", class: "pri", onclick: give("plus") }), el("button", { text: "Pro do", class: "gold", onclick: give("pro") })]));
    more.appendChild(el("div", { class: "row grow", style: "margin-top:8px" }, [
      el("button", { text: "Plan hatao", class: "warn", onclick: act("admin_revoke", { p_user: u.id }, "Is user ka paid plan abhi hata dein?") }),
      u.blocked ? el("button", { text: "Unblock", onclick: act("admin_block", { p_user: u.id, p_on: false, p_reason: "" }) })
                : el("button", { text: "Block karo", class: "warn", onclick: act("admin_block", { p_user: u.id, p_on: true, p_reason: "admin" }, "Block karein? Isko free minute aur paid features nahi milenge.") }),
      el("button", { text: "Phone link kholo", onclick: act("admin_reset_device", { p_user: u.id }, "Phone ka bandhan khol dein? Agla phone jo login karega wahi juda hoga.") })
    ]));
    var btn = el("button", { text: "Manage", class: "sm", onclick: function () { more.hidden = !more.hidden; } });
    return el("div", { class: "card" }, [
      el("div", { class: "row" }, [el("span", { class: "em", text: u.email || u.id })].concat(tags)),
      el("div", { class: "mut sub", text: info + " | " + dev }),
      el("div", { class: "mut", text: "Last login " + dt(u.last_sign_in_at) }),
      el("div", { class: "row", style: "margin-top:8px" }, [btn]),
      more
    ]);
  }
  function giftMsg(plan, minutes, email) {
    var what = plan === "free" ? "roz " + minutes + " minute free" : PN[plan] + " plan";
    return "Namaste! Aapko Payal ka " + what + " 30 din ke liye gift mila hai. Payal app mein is Gmail se login karo: " + email + " . App aur plan: " + SITE;
  }
  function shareRow(text) {
    return el("div", { class: "row", style: "margin-top:8px" }, [
      el("a", { href: "https://wa.me/?text=" + encodeURIComponent(text), target: "_blank", rel: "noopener" }, [el("button", { text: "WhatsApp par bhejo", class: "wa sm" })]),
      el("button", { text: "Message copy karo", class: "sm", onclick: function () { try { navigator.clipboard.writeText(text); toast("Copy ho gaya"); } catch (e) { toast("Copy nahi hua"); } } })
    ]);
  }
  function gift(v) {
    var chosen = "pro";
    var em = el("input", { type: "email", placeholder: "friend@gmail.com", autocapitalize: "none" });
    var mins = el("input", { type: "number", value: "30", min: "11", max: "600" });
    var note = el("input", { placeholder: "Yaad ke liye (zaroori nahi)" });
    var minWrap = el("div", { hidden: "" }, [el("label", { text: "Roz kitne minute free (10 se zyada)" }), mins]);
    var seg = el("div", { class: "seg" });
    function drawSeg() {
      seg.textContent = "";
      [["free", "Free+"], ["plus", "Plus"], ["pro", "Pro"]].forEach(function (p) {
        seg.appendChild(el("button", { text: p[1], class: (chosen === p[0] ? "on " : "") + (p[0] === "pro" ? "gold" : p[0] === "plus" ? "pri" : ""), onclick: function () { chosen = p[0]; minWrap.hidden = chosen !== "free"; drawSeg(); } }));
      });
    }
    drawSeg();
    var out = el("div");
    var list = el("div");
    function send() {
      var args = { p_email: em.value.trim(), p_plan: chosen, p_minutes: chosen === "free" ? (parseInt(mins.value, 10) || 30) : null, p_note: note.value.trim() };
      call("admin_gift_create", args).then(function (r) {
        if (!r) return;
        toast(r.applied ? "Gift mil gaya, turant chalu" : "Gift save ho gaya, login karte hi chalu hoga");
        out.textContent = "";
        out.appendChild(el("div", { class: "card" }, [el("div", { text: "Gift ho gaya. Chaho to unko khabar de do:" }), shareRow(giftMsg(chosen, args.p_minutes, args.p_email))]));
        em.value = ""; note.value = "";
        loadList();
      });
    }
    v.appendChild(el("div", { class: "card" }, [
      el("h2", { text: "🎁 Kisi ko gift do" }),
      el("div", { class: "hint", text: "Sirf unka Gmail likho. Wo isi Gmail se Payal mein login karega to gift apne aap chalu ho jayega. Gift hamesha 30 din ka hota hai. Aapka apna Gmail yahan nahi chalega." }),
      el("label", { text: "Unka Gmail" }), em,
      el("label", { text: "Gift ka type" }), seg,
      el("div", { class: "mut", text: "Free+ = roz zyada free minute. Plus = camera, location, bina time limit. Pro = sab kuch." }),
      minWrap,
      el("label", { text: "Note" }), note,
      el("div", { class: "row grow", style: "margin-top:14px" }, [el("button", { text: "Gift bhejo", class: "vio", onclick: send })])
    ]));
    v.appendChild(out);
    v.appendChild(el("h2", { text: "Diye hue gift" }));
    v.appendChild(list);
    function loadList() {
      list.textContent = "";
      call("admin_gifts", { p_limit: 50 }).then(function (rows) {
        if (!rows) return;
        if (!rows.length) list.appendChild(el("p", { class: "mut", text: "Abhi koi gift nahi diya." }));
        rows.forEach(function (g) {
          var what = g.plan === "free" ? "Free+ " + g.minutes + " min/din" : PN[g.plan];
          var kids = [shareRow(giftMsg(g.plan, g.minutes, g.email))];
          if (!g.claimed_at) kids[0].appendChild(el("button", { text: "Cancel", class: "warn sm", onclick: function () { if (confirm("Ye gift cancel karein?")) call("admin_gift_cancel", { p_id: g.id }).then(function (r) { if (r) { toast("Cancel ho gaya"); loadList(); } }); } }));
          list.appendChild(el("div", { class: "card" }, [
            el("div", { class: "row" }, [el("span", { class: "em", text: g.email }), el("span", { class: "tag " + g.plan, text: what }), el("span", { class: "tag " + (g.claimed_at ? "done" : "wait"), text: g.claimed_at ? "Chalu ho gaya" : "Login ka intezaar" })]),
            el("div", { class: "mut sub", text: "30 din | " + dt(g.created_at) + (g.note ? " | " + g.note : "") }),
            kids[0]
          ]));
        });
      });
    }
    loadList();
  }
  function helpbox(v) {
    var status = "open";
    var list = el("div");
    var seg = el("div", { class: "seg" });
    function drawSeg() {
      seg.textContent = "";
      [["open", "Baaki"], ["done", "Ho gaye"]].forEach(function (p) { seg.appendChild(el("button", { text: p[1], class: status === p[0] ? "on pri" : "", onclick: function () { status = p[0]; drawSeg(); load(); } })); });
    }
    function load() {
      list.textContent = "";
      call("admin_support", { p_status: status, p_limit: 100 }).then(function (rows) {
        if (!rows) return;
        if (!rows.length) list.appendChild(el("p", { class: "mut", text: "Koi message nahi." }));
        rows.forEach(function (m) {
          var kids = [
            el("div", { class: "row" }, [el("span", { class: "em", text: m.email || "-" }), el("span", { class: "tag " + (m.kind === "payment" ? "wait" : "free"), text: m.kind === "payment" ? "Payment ka masla" : "Madad" }), m.plan ? el("span", { class: "tag " + m.plan, text: PN[m.plan] }) : null]),
            el("div", { class: "mut sub", text: dt(m.created_at) }),
            m.ref ? el("div", { text: "Payment ID / UTR: " + m.ref }) : null,
            m.message ? el("div", { text: m.message }) : null
          ];
          if (m.status === "open") {
            var row = el("div", { class: "row grow", style: "margin-top:10px" });
            if (m.user_id) {
              var sg = function (plan) { return function (ev) { var b = ev.currentTarget; if (b.dataset.busy === "1") return; if (!confirm(PN[plan] + " 30 din de dein aur ye message band karein?")) return; guardedGive(b, m.user_id, m.email, PN[plan], function () { return call("admin_support_grant", { p_id: m.id, p_plan: plan }).then(function (r) { if (r) { setTimeout(load, 2500); return { plan: plan, days: 30 }; } return null; }); }); }; };
              row.appendChild(el("button", { text: "Plus do (30 din)", class: "pri", onclick: sg("plus") }));
              row.appendChild(el("button", { text: "Pro do (30 din)", class: "gold", onclick: sg("pro") }));
            }
            row.appendChild(el("button", { text: "Jawab ke saath band karo", onclick: function () { var n = prompt("Unko kya jawab dikhana hai?", "Aapka masla dekh liya gaya hai."); if (n === null) return; call("admin_support_close", { p_id: m.id, p_note: n }).then(function (r) { if (r) { toast("Band ho gaya"); load(); } }); } }));
            kids.push(row);
          } else if (m.admin_note) {
            kids.push(el("div", { class: "mut", text: "Jawab: " + m.admin_note }));
          }
          list.appendChild(el("div", { class: "card" }, kids));
        });
      });
    }
    v.appendChild(el("div", { class: "hint", text: "Yahan wo log aate hain jinhone app ya website se madad maangi. Agar kisi ka paisa kat gaya par plan nahi mila, to payment ID dekhkar yahin se Plus ya Pro de do." }));
    v.appendChild(seg); drawSeg();
    v.appendChild(list);
    load();
  }
  function customers(v) {
    var PRICE = { plus: 49, pro: 99 };
    var chosen = "plus";
    var em = el("input", { type: "email", placeholder: "payer@gmail.com", autocapitalize: "none" });
    var amt = el("input", { type: "number", value: "49", min: "1" });
    var ref = el("input", { placeholder: "UTR ya pay_ ID (zaroori)", autocapitalize: "none" });
    var note = el("input", { placeholder: "Note (zaroori nahi)" });
    var seg = el("div", { class: "seg" });
    function drawSeg() {
      seg.textContent = "";
      [["plus", "Plus"], ["pro", "Pro"]].forEach(function (p) {
        seg.appendChild(el("button", { text: p[1] + " Rs " + PRICE[p[0]], class: (chosen === p[0] ? "on " : "") + (p[0] === "pro" ? "gold" : "pri"), onclick: function () { chosen = p[0]; amt.value = String(PRICE[chosen]); drawSeg(); } }));
      });
    }
    drawSeg();
    var form = el("div", { class: "card" }, [
      el("h2", { text: "Hath se payment darj karo" }),
      el("div", { class: "hint", text: "Pehle screenshot me dekho ki paisa tumhe mila hai. Phir yahan likho. Gmail hamesha ke liye list me rahega aur 30 din ka plan mil jayega. Wahi UTR dobara nahi chalega." }),
      el("label", { text: "Payer ka Gmail" }), em, el("label", { text: "Plan" }), seg,
      el("label", { text: "Rakam (Rs)" }), amt, el("label", { text: "UTR / Payment ID" }), ref, el("label", { text: "Note" }), note,
      el("div", { class: "row grow", style: "margin-top:12px" }, [el("button", { text: "Darj karo aur plan do", class: "pri", onclick: function () {
        var e = em.value.trim().toLowerCase();
        if (!confirm(e + " ko " + PN[chosen] + " 30 din ke liye dein? Rs " + amt.value + " | " + ref.value.trim())) return;
        call("admin_manual_payment", { p_email: e, p_plan: chosen, p_amount: parseInt(amt.value, 10) || 0, p_ref: ref.value.trim(), p_note: note.value.trim() }).then(function (r) {
          if (!r) return;
          toast(r.applied ? "Darj ho gaya, plan chalu" : "Darj ho gaya, login par plan milega");
          em.value = ""; ref.value = ""; note.value = ""; load("");
        });
      } })])
    ]);
    v.appendChild(form);
    var q = el("input", { placeholder: "Gmail dhundho", autocapitalize: "none" });
    v.appendChild(el("div", { class: "row" }, [el("div", { style: "flex:1 1 200px" }, [q]), el("button", { text: "Search", class: "pri", onclick: function () { load(q.value.trim()); } })]));
    var list = el("div");
    v.appendChild(list);
    function load(s) {
      call("admin_customers", { p_q: s, p_limit: 100 }).then(function (rows) {
        if (!rows) return;
        list.textContent = "";
        list.appendChild(el("p", { class: "mut", text: "Paisa dene wale: " + rows.length + " (ye list kabhi delete nahi hoti)" }));
        rows.forEach(function (c) {
          var now = c.tier && c.expires_at ? PN[c.tier] + " | " + d0(c.expires_at) + " tak" : "Abhi plan nahi";
          list.appendChild(el("div", { class: "card" }, [
            el("div", { class: "row" }, [el("span", { class: "em", text: c.email }), el("span", { class: "tag " + c.last_plan, text: PN[c.last_plan] || c.last_plan })]),
            el("div", { text: "Kul Rs " + c.total + " | " + c.n + " baar" }),
            el("div", { class: "mut", text: "Pehli: " + d0(c.first_at) + " | Aakhri: " + d0(c.last_at) }),
            el("div", { class: "mut", text: now })
          ]));
        });
        if (!s) ledger();
      });
    }
    function ledger() {
      call("admin_ledger", { p_limit: 30 }).then(function (rows) {
        if (!rows) return;
        list.appendChild(el("h2", { text: "Taza payments" }));
        rows.forEach(function (x) {
          list.appendChild(el("div", { class: "card" }, [
            el("div", { class: "row" }, [el("span", { class: "em", text: x.email }), el("span", { class: "ok", text: "Rs " + x.amount })]),
            el("div", { class: "mut", text: dt(x.at) + " | " + (PN[x.plan] || x.plan) + " | " + x.source }),
            el("div", { class: "mut", text: "ID: " + (x.ref || "-") + (x.note ? " | " + x.note : "") })
          ]));
        });
      });
    }
    load("");
  }
  function payments(v) {
    call("admin_payments", { p_limit: 100 }).then(function (rows) {
      if (!rows) return;
      if (!rows.length) v.appendChild(el("p", { class: "mut", text: "Abhi koi payment nahi aaya." }));
      var nPaid = rows.filter(function (p) { return p.status === "paid"; }).length;
      var sumPaid = rows.filter(function (p) { return p.status === "paid"; }).reduce(function (t, p) { return t + (Number(p.amount) || 0); }, 0);
      if (rows.length) v.appendChild(el("div", { class: "card" }, [
        el("div", { class: "row" }, [el("span", { class: "em", text: "Order bane: " + rows.length }), el("span", { class: "ok", text: "Paise mile: " + nPaid }), el("span", { class: "mut", text: "Adhure: " + (rows.length - nPaid) })]),
        el("div", { class: "mut", text: "Mili rakam: Rs " + sumPaid + " (pichhle " + rows.length + " orders mein se)" })
      ]));
      rows.forEach(function (p) {
        v.appendChild(el("div", { class: "card" }, [
          el("div", { class: "row" }, [el("span", { class: "em", text: p.email || "-" }), el("span", { class: "tag " + p.plan, text: PN[p.plan] || p.plan }), el("span", { class: p.status === "paid" ? "ok" : "mut", text: p.status + " | Rs " + p.amount })]),
          el("div", { class: "mut", text: "Bana " + dt(p.created_at) + (p.paid_at ? " | Mila " + dt(p.paid_at) : "") }),
          el("div", { class: "mut", text: "Order " + (p.order_id || "-") + " | Payment " + (p.payment_id || "-") })
        ]));
      });
    });
  }
  function payToggle(v) {
    var box = el("div", { class: "card" });
    v.appendChild(box);
    call("admin_get_settings").then(function (d) {
      if (!d) return;
      var on = d.payments_live === true;
      box.appendChild(el("div", { class: "row" }, [el("b", { text: "Website par payment" }), el("span", { class: "tag " + (on ? "done" : "wait"), text: on ? "CHALU" : "BAND" })]));
      box.appendChild(el("div", { class: "mut sub", text: on ? "Log abhi website se Plus/Pro kharid sakte hain." : "Abhi website par kharidne ka button 'jald aa raha hai' dikhata hai." }));
      box.appendChild(el("div", { class: "row grow", style: "margin-top:8px" }, [el("button", { text: on ? "Band karo" : "Chalu karo", class: on ? "warn" : "pri", onclick: function () {
        if (!confirm(on ? "Payment band karein?" : "Payment chalu karein? Pehle Razorpay ka test kar lo.")) return;
        call("admin_set_payments", { p_on: !on }).then(function (r) { if (r) { toast("Ho gaya"); draw(); } });
      } })]));
    });
  }
  function plans(v) {
    payToggle(v);
    call("admin_plans").then(function (rows) {
      if (!rows) return;
      rows.forEach(function (p) {
        var f = {
          price: el("input", { type: "number", value: p.price }), mrp: el("input", { type: "number", value: p.mrp }), days: el("input", { type: "number", value: p.days }),
          hi: el("input", { value: p.offer_hi || "" }), en: el("input", { value: p.offer_en || "" }), act: el("input", { type: "checkbox", style: "width:24px;min-height:24px" })
        };
        f.act.checked = !!p.active;
        v.appendChild(el("div", { class: "card" }, [
          el("h2", { text: p.name }),
          el("label", { text: "Daam (Rs)" }), f.price, el("label", { text: "Kata hua daam MRP (Rs)" }), f.mrp, el("label", { text: "Plan kitne din chalta hai" }), f.days,
          el("label", { text: "Offer ka naam (Hindi)" }), f.hi, el("label", { text: "Offer ka naam (English)" }), f.en,
          el("div", { class: "row", style: "margin-top:10px" }, [f.act, el("span", { text: "Website par dikhao" })]),
          el("div", { class: "row grow", style: "margin-top:12px" }, [el("button", { text: "Save karo", class: "pri", onclick: function () {
            call("admin_set_plan", { p_id: p.id, p_price: parseInt(f.price.value, 10), p_mrp: parseInt(f.mrp.value, 10), p_offer_hi: f.hi.value, p_offer_en: f.en.value, p_days: parseInt(f.days.value, 10), p_active: f.act.checked })
              .then(function (r) { if (r) toast("Save ho gaya. Website par naya daam dikhega."); });
          } })])
        ]));
      });
      v.appendChild(el("div", { class: "hint", text: "Sirf sachcha discount dikhao. Daam kam se kam 1 ho aur MRP daam se kam na ho." }));
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
    try { sessionStorage.setItem("payalAdminGo", "1"); } catch (e) {}
    sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } } }).then(function (r) { if (r.error) $("#err").textContent = r.error.message; });
  });
  $("#out").addEventListener("click", function () { sb.auth.signOut({ scope: "local" }).then(function () { location.reload(); }); });
  function start(session) {
    var go = false;
    try { go = sessionStorage.getItem("payalAdminGo") === "1"; sessionStorage.removeItem("payalAdminGo"); } catch (e) {}
    if (session && !go) { sb.auth.signOut({ scope: "local" }).then(function () { show("login"); }); return; }
    if (!session) { show("login"); return; }
    
    $("#out").hidden = false;
    sb.rpc("is_admin").then(function (r) { if (r.data === true) { show("app"); drawTabs(); draw(); } else show("denied"); });
  }
  sb.auth.getSession().then(function (r) { start(r.data && r.data.session); });
})();
