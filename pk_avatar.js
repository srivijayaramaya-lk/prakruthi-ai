/* =========================================================
   pk_avatar.js — v1.8 "ප්‍රකෘති මුහුණ" (Sketch Face Engine)
   Owner's pencil-sketch portrait: breathing + blinking +
   talking visemes + gentle smile. Pure canvas pixel-shift.
   Self-contained: own CSS, own fetch wrapper, no libraries.
   Replaces the green face (retired with thanks 🍃).
   Calibration: owner's test-lab measurements (embedded).
   ========================================================= */
(function () {
  if (window.PKFace) return;

  /* ---------- owner calibration ---------- */
  var CAL = {
    eyes: { l: { x: 0.5857, y: 0.5452 }, r: { x: 0.3429, y: 0.5500 }, w: 0.15057 },
    mouth: { l: { x: 0.3786, y: 0.8167 }, r: { x: 0.5667, y: 0.8167 } },
    lid: '#f0eae0'
  };

  var W = 280, H = 280;
  var BREATH = 0.012, BLINK_MS = 150;

  /* ---------- inject CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.pk-face-wrap{position:fixed;top:6px;left:50%;transform:translateX(-50%);' +
    'z-index:9998;pointer-events:none;}' +
    '.pk-face-wrap canvas{display:block;width:128px;height:128px;border-radius:18px;' +
    'box-shadow:0 6px 22px rgba(0,0,0,.35);background:#efe9df;}' +
    '@media (max-width:480px){.pk-face-wrap canvas{width:96px;height:96px;border-radius:14px}}';
  document.head.appendChild(css);

  /* ---------- build ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'pk-face-wrap';
  var cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  wrap.appendChild(cv);
  document.body.appendChild(wrap);
  var ctx = cv.getContext('2d');

  var base = document.createElement('canvas'); base.width = W; base.height = H;
  var bctx = base.getContext('2d');
  var tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  var tctx = tmp.getContext('2d');

  var img = new Image();
  img.src = '/face_base.png';
  var ready = false, geo = null;
  img.onload = function () {
    var s = Math.min(W / img.width, H / img.height);
    geo = { dw: img.width * s, dh: img.height * s };
    geo.ox = (W - geo.dw) / 2; geo.oy = (H - geo.dh) / 2;
    ready = true;
  };
  img.onerror = function () { wrap.style.display = 'none'; };

  /* ---------- blink ---------- */
  var blinkUntil = 0;
  (function sb() {
    setTimeout(function () { blinkUntil = performance.now() + BLINK_MS; sb(); },
      2600 + Math.random() * 3400);
  })();

  /* ---------- visemes ---------- */
  function visemeFor(ch) {
    if (ch === ' ' || '.,!?;:—'.indexOf(ch) >= 0) return 'closed';
    ch = ch.toUpperCase();
    if ('අආඇඈාැඓA'.indexOf(ch) >= 0) return 'A';
    if ('ඔඕඋඌූොෝෞOUW'.indexOf(ch) >= 0) return 'O';
    if ('ඉඊිීඑඒෙේෛEIY'.indexOf(ch) >= 0) return 'E';
    return 'M';
  }
  var busy = false;
  var speak = { active: false, viseme: 'closed', timer: null };
  var targetOpen = 0, targetStretch = 0;
  var curOpen = 0, curStretch = 0, curSmile = 0, smileUntil = 0;
  function jit(v) { return v * (0.85 + Math.random() * 0.3); }

  function speakSnippet(text) {
    text = String(text || '').replace(/[*#`>_[\]()~]/g, '');
    text = text.split('https://')[0];
    text = text.replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!text) { smile(2000); return; }
    clearTimeout(speak.timer);
    var chars = text.split(''); var i = 0; speak.active = true;
    var step = function () {
      if (i >= chars.length) {
        speak.active = false; speak.viseme = 'closed';
        targetOpen = 0; targetStretch = 0;
        smile(2200); return;
      }
      var ch = chars[i++];
      speak.viseme = visemeFor(ch);
      if (speak.viseme === 'A') { targetStretch = jit(0.55); targetOpen = jit(0.55); }
      else if (speak.viseme === 'O') { targetStretch = jit(-0.4); targetOpen = jit(0.4); }
      else if (speak.viseme === 'E') { targetStretch = jit(0.95); targetOpen = jit(0.18); }
      else if (speak.viseme === 'M') { targetStretch = 0.12; targetOpen = 0.04; }
      else { targetStretch = 0; targetOpen = 0; }
      var d;
      if (speak.viseme === 'closed') {
        d = ('.,!?;:—'.indexOf(ch) >= 0) ? 180 + Math.random() * 70 : 75 + Math.random() * 35;
      } else if (speak.viseme === 'M') { d = 90 + Math.random() * 25; }
      else { d = 140 + Math.random() * 55; }
      speak.timer = setTimeout(step, d);
    };
    step();
  }
  function smile(ms) { smileUntil = performance.now() + (ms || 2000); }
  function setBusy(v) { busy = !!v; }

  /* ---------- patch helpers ---------- */
  function patchShift(sx0, sy0, sw, sh, dx, dy, mcx, mcy, mrx, mry) {
    tctx.clearRect(0, 0, W, H);
    tctx.filter = 'blur(0.7px)';
    tctx.drawImage(base, sx0, sy0, sw, sh, sx0 + dx, sy0 + dy, sw, sh);
    tctx.filter = 'none';
    tctx.save();
    tctx.globalCompositeOperation = 'destination-in';
    tctx.translate(mcx, mcy); tctx.scale(mrx / mry, 1);
    var g = tctx.createRadialGradient(0, 0, 0, 0, 0, mry);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.97)');
    g.addColorStop(0.8, 'rgba(0,0,0,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    tctx.fillStyle = g;
    tctx.fillRect(-mry * 2.2, -mry * 2.2, mry * 4.4, mry * 4.4);
    tctx.restore();
    bctx.drawImage(tmp, 0, 0);
  }
  function drawLid(cx, cy, faceW) {
    var w = CAL.eyes.w * faceW, h = w * 0.42;
    ctx.fillStyle = CAL.lid;
    ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, h / 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(70,60,52,0.5)'; ctx.lineWidth = Math.max(1.2, h * 0.12);
    ctx.beginPath(); ctx.moveTo(cx - w / 2.6, cy + h * 0.05);
    ctx.quadraticCurveTo(cx, cy + h * 0.4, cx + w / 2.6, cy + h * 0.05); ctx.stroke();
  }

  /* ---------- loop ---------- */
  function loop(t) {
    ctx.clearRect(0, 0, W, H);
    if (ready && geo) {
      var dw = geo.dw, dh = geo.dh, ox = geo.ox, oy = geo.oy;
      bctx.clearRect(0, 0, W, H);
      bctx.drawImage(img, ox, oy, dw, dh);

      var mx = ox + (CAL.mouth.l.x + CAL.mouth.r.x) / 2 * dw;
      var my = oy + (CAL.mouth.l.y + CAL.mouth.r.y) / 2 * dh;
      var mw = Math.abs(CAL.mouth.r.x - CAL.mouth.l.x) * dw;

      var openGoal = speak.active ? targetOpen : 0;
      var stretchGoal = speak.active ? targetStretch : 0;
      curOpen += (openGoal - curOpen) * 0.25;
      curStretch += (stretchGoal - curStretch) * 0.25;
      var smileGoal = (performance.now() < smileUntil) ? 0.6 : 0;
      curSmile += (smileGoal - curSmile) * 0.12;

      var stretchPx = (curStretch + curSmile * 0.5) * mw * 0.10;
      var smileUp = curSmile * mw * 0.07;
      var openPx = curOpen * mw * 0.13;

      if (Math.abs(stretchPx) > 0.25 || smileUp > 0.2) {
        var lcx = ox + CAL.mouth.l.x * dw;
        var rcx = ox + CAL.mouth.r.x * dw;
        patchShift(lcx - mw * 0.52, my - mw * 0.28, mw * 0.78, mw * 0.56,
          -stretchPx, -smileUp, lcx, my, mw * 0.60, mw * 0.42);
        patchShift(rcx - mw * 0.26, my - mw * 0.28, mw * 0.78, mw * 0.56,
          stretchPx, -smileUp, rcx, my, mw * 0.60, mw * 0.42);
      }
      if (openPx > 0.4) {
        var up = openPx * 0.3, down = openPx * 0.7;
        patchShift(mx - mw * 0.9, my - mw * 0.36, mw * 1.8, mw * 0.36, 0, -up,
          mx, my - mw * 0.10, mw * 1.15, mw * 0.34);
        patchShift(mx - mw * 1.0, my, mw * 2.0, H - my, 0, down,
          mx, my + mw * 0.30, mw * 1.35, mw * 1.0);
      }
    }

    var acting = speak.active || busy;
    var bobX = acting ? Math.sin(t / 470) * 0.35 : 0;
    var bobY = acting ? Math.sin(t / 320) * 0.45 : 0;
    var b = 1 + BREATH * Math.sin(t / 750);
    ctx.save();
    ctx.translate(W / 2 + bobX, oy + dh + bobY);
    ctx.scale(b, b);
    ctx.translate(-W / 2, -(oy + dh));
    ctx.drawImage(base, 0, 0);
    if (performance.now() < blinkUntil) {
      drawLid(ox + CAL.eyes.l.x * dw, oy + CAL.eyes.l.y * dh, dw);
      drawLid(ox + CAL.eyes.r.x * dw, oy + CAL.eyes.r.y * dh, dw);
    }
    ctx.restore();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------- react to chat (self-contained fetch wrapper) ---------- */
  function watchChat() {
    if (typeof window.fetch !== 'function') return;
    var orig = window.fetch;
    window.fetch = function (url) {
      var u = '', isChat = false;
      try { u = String(url).split('?')[0]; isChat = /\/chat$/.test(u); } catch (e) {}
      if (!isChat) return orig.apply(this, arguments);
      setBusy(true);
      var p = orig.apply(this, arguments);
      try {
        if (p && p.then) {
          var p2 = p.then(function (res) {
            try {
              res.clone().json().then(function (d) {
                setBusy(false);
                var t = '';
                if (d && typeof d === 'object') t = d.output || d.reply || d.text || '';
                speakSnippet(t);
              }).catch(function () { setBusy(false); smile(1500); });
            } catch (e) { setBusy(false); }
            return res;
          });
          p2.catch(function () { setBusy(false); });
          return p2;
        }
      } catch (e) {}
      return p;
    };
  }

  function boot() { watchChat(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  window.PKFace = { smile: smile, speak: speakSnippet };
})();