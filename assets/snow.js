/* Light falling snow over the page: one small canvas, about 40 flakes, 30 frames a second,
   stops when the tab is hidden or the person asked for less motion. Touches nothing on the page. */
(function () {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40";
  document.body.appendChild(c);
  var g = c.getContext("2d"), W = 0, H = 0, flakes = [], last = 0, run = true;
  function size() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
  function make(top) {
    var r = 2.2 + Math.random() * 3.4;
    return { x: Math.random() * W, y: top ? -10 : Math.random() * H, r: r, v: 0.35 + r * 0.22, a: Math.random() * 6.3, s: 0.008 + Math.random() * 0.012, star: r > 4.2 };
  }
  size();
  var N = Math.min(46, Math.round(W * H / 16000));
  for (var i = 0; i < N; i++) flakes.push(make(false));
  window.addEventListener("resize", size);
  document.addEventListener("visibilitychange", function () { run = !document.hidden; if (run) requestAnimationFrame(tick); });
  function draw(f) {
    g.beginPath(); g.arc(f.x, f.y, f.r + 1.2, 0, 6.283); g.fillStyle = "rgba(80,140,210,.5)"; g.fill();
    g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.283); g.fillStyle = "#ffffff"; g.fill();
    if (f.star) {
      g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 1.1; g.beginPath();
      for (var k = 0; k < 3; k++) { var t = f.a + k * 1.047, dx = Math.cos(t) * f.r * 2.4, dy = Math.sin(t) * f.r * 2.4; g.moveTo(f.x - dx, f.y - dy); g.lineTo(f.x + dx, f.y + dy); }
      g.stroke();
    }
  }
  function tick(now) {
    if (!run) return;
    requestAnimationFrame(tick);
    if (now - last < 33) return;
    last = now;
    g.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.a += f.s; f.y += f.v; f.x += Math.sin(f.a) * 0.45;
      if (f.y > H + 10 || f.x < -12 || f.x > W + 12) flakes[i] = f = make(true);
      draw(f);
    }
  }
  requestAnimationFrame(tick);
})();
