/* Soft falling snow BEHIND the page (under every card, button and line of text).
   Flakes are soft white puffs like real snow, not see-through rings. One small canvas, about 45 flakes,
   30 frames a second, pre-drawn flake pictures (light for phones), stops when the tab is hidden. */
(function () {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1";
  document.body.insertBefore(c, document.body.firstChild);
  var g = c.getContext("2d"), W = 0, H = 0, flakes = [], last = 0, run = true;

  /* pre-drawn soft flakes in 6 sizes */
  var SPR = [];
  for (var s = 0; s < 6; s++) {
    var r = 2.5 + s * 1.3, d = Math.ceil(r * 4), o = document.createElement("canvas");
    o.width = o.height = d;
    var x = o.getContext("2d"), m = d / 2, gr = x.createRadialGradient(m, m, 0, m, m, r * 2);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.45, "rgba(255,255,255,.95)");
    gr.addColorStop(0.7, "rgba(235,245,255,.55)");
    gr.addColorStop(1, "rgba(220,236,252,0)");
    x.fillStyle = gr; x.beginPath(); x.arc(m, m, r * 2, 0, 6.283); x.fill();
    SPR.push(o);
  }
  function size() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
  function make(top) {
    var k = Math.floor(Math.random() * SPR.length);
    return { x: Math.random() * W, y: top ? -20 : Math.random() * H, k: k, v: 0.45 + k * 0.18, a: Math.random() * 6.3, s: 0.008 + Math.random() * 0.012 };
  }
  size();
  var N = Math.min(48, Math.round(W * H / 15000));
  for (var i = 0; i < N; i++) flakes.push(make(false));
  window.addEventListener("resize", size);
  document.addEventListener("visibilitychange", function () { run = !document.hidden; if (run) requestAnimationFrame(tick); });
  function tick(now) {
    if (!run) return;
    requestAnimationFrame(tick);
    if (now - last < 33) return;
    last = now;
    g.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i], sp = SPR[f.k];
      f.a += f.s; f.y += f.v; f.x += Math.sin(f.a) * 0.5;
      if (f.y > H + 20 || f.x < -20 || f.x > W + 20) flakes[i] = f = make(true);
      g.drawImage(sp, f.x - sp.width / 2, f.y - sp.height / 2);
    }
  }
  requestAnimationFrame(tick);
})();
