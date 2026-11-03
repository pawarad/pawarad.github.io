/* Simulated genome-wide copy number profile (ichorCNA-style) for the home page hero.
   Purely decorative data: generated in the browser, never real patient data. */
(function () {
  "use strict";

  var canvas = document.getElementById("genome");
  var readout = document.getElementById("genome-readout");
  var button = document.getElementById("genome-new");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  // Approximate hg38 chromosome lengths in Mb.
  var CHR = [
    ["1", 248], ["2", 242], ["3", 198], ["4", 190], ["5", 181], ["6", 171], ["7", 159], ["8", 145],
    ["9", 138], ["10", 134], ["11", 135], ["12", 133], ["13", 114], ["14", 107], ["15", 102],
    ["16", 90], ["17", 83], ["18", 80], ["19", 59], ["20", 64], ["21", 47], ["22", 51], ["X", 156]
  ];
  var TOTAL = CHR.reduce(function (s, c) { return s + c[1]; }, 0);
  var BIN = 4; // Mb per point
  var YMIN = -1.2, YMAX = 1.2;
  var M = { l: 36, r: 6, t: 8, b: 26 };

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  var sample = null;

  function makeSample(seed) {
    var r = rng(seed);
    var tf = Math.round((0.06 + r() * 0.4) * 100) / 100;
    var amp = (0.4 + tf * 1.5) * 0.6;
    var steps = [-1, -0.6, 0.6, 1];
    var bins = [], segs = [], offset = 0;

    CHR.forEach(function (c, ci) {
      var len = c[1];
      var cuts = [0];
      if (r() > 0.5) {
        var n = 1 + Math.floor(r() * 2);
        for (var i = 0; i < n; i++) cuts.push(Math.round(r() * len));
        cuts.sort(function (a, b) { return a - b; });
      }
      cuts.push(len);
      for (var s = 0; s < cuts.length - 1; s++) {
        var a = cuts[s], b = cuts[s + 1];
        if (b - a < 1) continue;
        var level = r() < 0.45 ? 0 : steps[Math.floor(r() * steps.length)] * amp;
        segs.push({ x0: offset + a, x1: offset + b, y: level });
        for (var p = a; p < b; p += BIN) {
          var v = level + gauss(r) * 0.11;
          bins.push({ chr: c[0], mb: Math.round(p), x: offset + p + BIN / 2, y: Math.max(YMIN + 0.05, Math.min(YMAX - 0.05, v)), level: level });
        }
      }
      // Occasional focal amplification
      if (r() < 0.08) {
        var start = Math.round(r() * (len - 15));
        var peak = Math.min(YMAX - 0.1, 0.9 + r() * 0.3);
        segs.push({ x0: offset + start, x1: offset + start + 12, y: peak });
        for (var q = start; q < start + 12; q += BIN) {
          bins.push({ chr: c[0], mb: Math.round(q), x: offset + q + BIN / 2, y: peak + gauss(r) * 0.08, level: peak });
        }
      }
      offset += len;
    });
    return { tf: tf, bins: bins, segs: segs };
  }

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  var W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    W = Math.max(280, rect.width);
    H = rect.height || 240;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function xOf(mb) { return M.l + (mb / TOTAL) * (W - M.l - M.r); }
  function yOf(v) { return M.t + (1 - (v - YMIN) / (YMAX - YMIN)) * (H - M.t - M.b); }

  function draw(progress) {
    var ink = css("--ink"), muted = css("--muted"), rule = css("--rule");
    var colors = { neutral: css("--neutral"), gain: css("--gain"), loss: css("--loss") };
    ctx.clearRect(0, 0, W, H);
    ctx.font = "12px " + (css("--body-font") || "serif");
    ctx.textBaseline = "middle";

    // Chromosome bands and labels
    var off = 0, narrow = W < 640;
    CHR.forEach(function (c, i) {
      var x0 = xOf(off), x1 = xOf(off + c[1]);
      if (i % 2 === 0) {
        ctx.globalAlpha = 0.45; ctx.fillStyle = rule;
        ctx.fillRect(x0, M.t, x1 - x0, H - M.t - M.b);
        ctx.globalAlpha = 1;
      }
      if (!narrow || i % 2 === 0) {
        ctx.fillStyle = muted; ctx.textAlign = "center";
        ctx.fillText(c[0], (x0 + x1) / 2, H - M.b + 14);
      }
      off += c[1];
    });

    // y axis
    ctx.textAlign = "right"; ctx.fillStyle = muted;
    [-1, 0, 1].forEach(function (t) {
      ctx.fillText(String(t), M.l - 8, yOf(t));
      ctx.strokeStyle = t === 0 ? muted : rule;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(M.l, yOf(t)); ctx.lineTo(W - M.r, yOf(t)); ctx.stroke();
    });

    var limit = progress * TOTAL;

    // points
    sample.bins.forEach(function (b) {
      if (b.x > limit) return;
      ctx.fillStyle = b.level > 0.2 ? colors.gain : b.level < -0.2 ? colors.loss : colors.neutral;
      ctx.beginPath(); ctx.arc(xOf(b.x), yOf(b.y), 2.1, 0, 6.2832); ctx.fill();
    });

    // segment lines
    ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.lineCap = "round";
    sample.segs.forEach(function (s) {
      if (s.x0 > limit) return;
      ctx.beginPath();
      ctx.moveTo(xOf(s.x0) + 1, yOf(s.y));
      ctx.lineTo(xOf(Math.min(s.x1, limit)) - 1, yOf(s.y));
      ctx.stroke();
    });
  }

  var raf = 0;
  function play() {
    cancelAnimationFrame(raf);
    if (reduceMotion) { draw(1); return; }
    var start = null, dur = 1300;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      draw(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }

  function describe() {
    readout.textContent = "Simulated cell-free DNA copy number profile, tumor fraction " + sample.tf.toFixed(2) + ". Points are 4 Mb bins; lines are segments.";
  }

  var seed = Math.floor(Math.random() * 1e6);
  function fresh() { sample = makeSample(seed); describe(); play(); seed = (seed * 1664525 + 1013904223) >>> 0; }

  function nearest(clientX) {
    var rect = canvas.getBoundingClientRect();
    var mb = ((clientX - rect.left - M.l) / (rect.width - M.l - M.r)) * TOTAL;
    if (mb < 0 || mb > TOTAL) return null;
    var best = null, d = 1e9;
    sample.bins.forEach(function (b) { var dd = Math.abs(b.x - mb); if (dd < d) { d = dd; best = b; } });
    return best;
  }
  function hover(e) {
    var x = e.touches ? e.touches[0].clientX : e.clientX;
    var b = nearest(x);
    if (!b) return;
    var call = b.level > 0.2 ? "gain" : b.level < -0.2 ? "loss" : "neutral";
    readout.textContent = "chr" + b.chr + ":" + b.mb + " Mb, log2 ratio " + b.y.toFixed(2) + ", " + call;
  }

  canvas.addEventListener("mousemove", hover);
  canvas.addEventListener("touchstart", hover, { passive: true });
  canvas.addEventListener("mouseleave", describe);
  button.addEventListener("click", fresh);

  function redraw() { resize(); draw(1); }
  if (window.ResizeObserver) {
    var last = 0;
    new ResizeObserver(function () { var w = canvas.getBoundingClientRect().width; if (Math.abs(w - last) > 1) { last = w; redraw(); } }).observe(canvas);
  } else { window.addEventListener("resize", redraw); }
  new MutationObserver(function () { draw(1); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () { draw(1); });
  }

  resize();
  fresh();
})();
