/* 3D rotating rings and dots, same idea as the orb in the app. */
(function () {
  var cv = document.getElementById("orb");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var S = 0, ang = 0, hue = 38, speed = 0.18, target = 0.18, boost = 0, last = 0;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size() {
    var r = cv.getBoundingClientRect();
    S = Math.max(120, Math.round(r.width));
    cv.width = S * dpr; cv.height = S * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);
  function rot(x, y, z, yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
  }
  function col(h, s, l, a) { return "hsla(" + (h % 360) + "," + s + "%," + l + "%," + a + ")"; }
  function frame(t) {
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    if (boost > 0) { boost -= dt; target = 3.2; } else { target = 0.18; }
    speed += (target - speed) * Math.min(1, dt * 3);
    ang += dt * speed;
    hue += dt * (boost > 0 ? 150 : 6);
    ctx.clearRect(0, 0, S, S);
    var cx = S / 2, cy = S / 2, rr = S * 0.34 * (1 + (boost > 0 ? 0.05 : 0));
    var f = rr * 3.4, yaw = ang * 0.7, pitch = 0.55 + 0.35 * Math.sin(ang * 0.4);
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.7);
    g.addColorStop(0, col(hue, 80, 60, 0.32)); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr * 1.7, 0, 6.2832); ctx.fill();
    var tilts = [0, 1.05, 2.1], radii = [1, 0.82, 0.64], n = 72;
    ctx.lineCap = "round"; ctx.lineWidth = Math.max(1.2, S * 0.006);
    for (var k = 0; k < 3; k++) {
      var r = rr * radii[k], dir = k === 1 ? -1 : 1, off = ang * (1.3 + 0.5 * k) * dir;
      for (var i = 0; i < n; i++) {
        if (i % 4 === 3) continue;
        var t1 = off + i * 6.2832 / n, t2 = off + (i + 1) * 6.2832 / n;
        var a = rot(r * Math.cos(t1), r * Math.sin(t1), 0, 0, tilts[k]);
        var b = rot(r * Math.cos(t2), r * Math.sin(t2), 0, 0, tilts[k]);
        a = rot(a[0], a[1], a[2], yaw, pitch); b = rot(b[0], b[1], b[2], yaw, pitch);
        var s1 = f / (f - a[2]), s2 = f / (f - b[2]);
        var d = Math.min(1, Math.max(0, (a[2] / rr + 1) / 2));
        ctx.strokeStyle = col(hue + k * 60, 80, 62, 0.18 + 0.82 * d);
        ctx.beginPath(); ctx.moveTo(cx + a[0] * s1, cy + a[1] * s1); ctx.lineTo(cx + b[0] * s2, cy + b[1] * s2); ctx.stroke();
      }
    }
    var dots = 54;
    for (var j = 0; j < dots; j++) {
      var y = 1 - 2 * (j + 0.5) / dots, rad = Math.sqrt(1 - y * y), th = j * 2.39996;
      var p = rot(rad * Math.cos(th) * rr * 1.08, y * rr * 1.08, rad * Math.sin(th) * rr * 1.08, ang * 1.2, pitch * 0.8);
      var sc = f / (f - p[2]), dd = Math.min(1, Math.max(0, (p[2] / (rr * 1.08) + 1) / 2));
      ctx.fillStyle = col(hue + j * 7, 70, 66, 0.15 + 0.85 * dd);
      ctx.beginPath(); ctx.arc(cx + p[0] * sc, cy + p[1] * sc, (1 + 2.2 * dd) * sc * (S / 220), 0, 6.2832); ctx.fill();
    }
    var cr = rr * (0.2 + 0.02 * Math.sin(ang * 6));
    var c2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.2);
    c2.addColorStop(0, "#fff"); c2.addColorStop(0.35, col(hue, 85, 62, 0.95)); c2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(cx, cy, cr * 2.2, 0, 6.2832); ctx.fill();
    if (!reduce) requestAnimationFrame(frame);
  }
  cv.addEventListener("click", function () { boost = 3.5; });
  cv.addEventListener("mouseenter", function () { boost = 1.2; });
  requestAnimationFrame(frame);
})();
