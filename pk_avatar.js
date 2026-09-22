/* =========================================================
   pk_avatar.js — v1.11 "ප්‍රකෘති මුහුණ" (Real-Voice Lip-Sync)
   Layered sketch face + REAL TTS sync via onboundary events.
   Voice ON  → TTS speaks, mouth follows actual speech
               (fallback timer for phones without boundary events).
   Voice OFF → silent mouth animation (as before).
   Male voice (pitch 0.7). Self-contained. No libraries.
   ========================================================= */
(function () {
  if (window.PKFace) return;

  var CAL = {
    eyes: { l: { x: 0.5857, y: 0.5452 }, r: { x: 0.3429, y: 0.5500 }, w: 0.15057 },
    lid: '#f0eae0'
  };

  var W = 280, H = 280;
  var BLINK_MS = 150;

  var css = document.createElement('style');
  css.textContent =
    '.pk-face-wrap{position:fixed;top:6px;left:50%;transform:translateX(-50%);' +
    'z-index:9998;pointer-events:none;}' +
    '.pk-face-wrap canvas{display:block;width:128px;height:128px;border-radius:18px;' +
    'box-shadow:0 6px 22px rgba(0,0,0,.35);background:#efe9df;pointer-events:auto;cursor:pointer;}' +
    '.pk-face-wrap.big canvas{width:min(78vw,60vh);height:min(78vw,60vh);border-radius:24px;}' +
    '@media (max-width:480px){.pk-face-wrap canvas{width:96px;height:96px;border-radius:14px}}';
  document.head.appendChild(css);

  var wrap = document.createElement('div');
  wrap.className = 'pk-face-wrap';
  var cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  wrap.appendChild(cv);
  document.body.appendChild(wrap);
  var ctx = cv.getContext('2d');

  cv.addEventListener('click', function (e) {
    e.stopPropagation();
    wrap.classList.toggle('big');
  });

  /* ---------- layered images ---------- */
  var files = {
    closed: '/face_base.png?v=2', A: '/mouth_a.png?v=2', O: '/mouth_o.png?v=2',
    E: '/mouth_i.png?v=2', SMILE: '/mouth_smile.png?v=2'
  };
  var imgs = {}, arrived = 0;
  Object.keys(files).forEach(function (k) {
    var im = new Image(); im.src = files[k]; imgs[k] = im;
    im.onload = function () { arrived++; };
    im.onerror = function () { arrived++; };
  });
  imgs.closed.onerror = function () { wrap.style.display = 'none'; };

  var geo = null;
  var blinkUntil = 0;
  (function sb() {
    setTimeout(function () { blinkUntil = performance.now() + BLINK_MS; sb(); },
      2600 + Math.random() * 3400);
  })();

  /* ---------- phonetics ---------- */
  function visemeFor(ch) {
    if (!ch || ch === ' ' || '.,!?;:—'.indexOf(ch) >= 0) return 'closed';
    ch = ch.toUpperCase();
    if ('අආඇඈාැඓA'.indexOf(ch) >= 0) return 'A';
    if ('ඔඕඋඌූොෝෞOUW'.indexOf(ch) >= 0) return 'O';
    if ('ඉඊිීඑඒෙේෛEIY'.indexOf(ch) >= 0) return 'E';
    return 'M';
  }

  var busy = false;
  var speak = { active: false, viseme: 'closed' };
  var smileUntil = 0;
  var talkTimer = null;      /* silent-mode timer */
  var fallbackTimer = null;  /* TTS no-boundary fallback */
  var boundaryFired = false;

  function smile(ms) { smileUntil = performance.now() + (ms || 2000); }
  function setBusy(v) { busy = !!v; }

  /* voice toggle state (pk_v12.js exposes window.pkVoiceOn) */
  function voiceOn() {
    try {
      if (typeof window.pkVoiceOn === 'function') return !!window.pkVoiceOn();
    } catch (e) {}
    try { return localStorage.getItem('pk_voice') === '1'; } catch (e) {}
    return false; /* unknown → silent animation (safe default) */
  }

  /* ---------- silent animation path (voice OFF) ---------- */
  function silentTalk(text) {
    clearTimeout(talkTimer);
    var chars = text.split(''); var i = 0; speak.active = true;
    var step = function () {
      if (i >= chars.length) {
        speak.active = false; speak.viseme = 'closed';
        smile(2200); return;
      }
      var ch = chars[i++];
      speak.viseme = visemeFor(ch);
      var d;
      if (speak.viseme === 'closed') {
        d = ('.,!?;:—'.indexOf(ch) >= 0) ? 180 + Math.random() * 70 : 75 + Math.random() * 35;
      } else if (speak.viseme === 'M') { d = 95 + Math.random() * 30; }
      else { d = 140 + Math.random() * 55; }
      talkTimer = setTimeout(step, d);
    };
    step();
  }

  /* ---------- REAL VOICE path (voice ON) ---------- */
  function startFallback(text) {
    boundaryFired = false;
    var idx = 0;
    fallbackTimer = setInterval(function () {
      if (!speak.active || boundaryFired) { clearInterval(fallbackTimer); return; }
      var ch = text.charAt(idx % Math.max(text.length, 1));
      idx++;
      speak.viseme = visemeFor(ch);
    }, 115);
  }

  function ttsTalk(text) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(text);

    /* voice preference: sinhala if exists, else default */
    try {
      var voices = window.speechSynthesis.getVoices() || [];
      var sv = null;
      for (var i = 0; i < voices.length; i++) {
        if (String(voices[i].lang).toLowerCase().indexOf('si') === 0) { sv = voices[i]; break; }
      }
      if (sv) u.voice = sv;
    } catch (e) {}

    u.rate = 0.95;
    u.pitch = 0.7;   /* පිරිමි හඬ (owner decision) — 0.8/0.9 if too deep */

    u.onstart = function () {
      speak.active = true; speak.viseme = 'closed';
      startFallback(text); /* boundary නොඑන phones වලට fallback */
    };
    u.onboundary = function (ev) {
      if (typeof ev.charIndex !== 'number') return;
      if (!boundaryFired) { boundaryFired = true; clearInterval(fallbackTimer); }
      var ch = text.charAt(ev.charIndex);
      speak.viseme = visemeFor(ch);
    };
    u.onend = function () {
      speak.active = false; speak.viseme = 'closed';
      clearInterval(fallbackTimer);
      smile(2200);
    };
    u.onerror = function () {
      speak.active = false; speak.viseme = 'closed';
      clearInterval(fallbackTimer);
    };
    window.speechSynthesis.speak(u);
  }

  function speakSnippet(text) {
    text = String(text || '').replace(/[*#`>_[\]()~]/g, '');
    text = text.split('https://')[0];
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) { smile(2000); return; }

    if ('speechSynthesis' in window && voiceOn()) {
      ttsTalk(text);          /* හඬ ON → ඇත්ත හඬට කට sync */
    } else {
      silentTalk(text);       /* හඬ OFF → නිහඬ animation */
    }
  }

  /* ---------- draw helpers ---------- */
  function drawLid(cx, cy, faceW) {
    var w = CAL.eyes.w * faceW, h = w * 0.42;
    ctx.fillStyle = CAL.lid;
    ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, h / 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(70,60,52,0.5)'; ctx.lineWidth = Math.max(1.2, h * 0.12);
    ctx.beginPath(); ctx.moveTo(cx - w / 2.6, cy + h * 0.05);
    ctx.quadraticCurveTo(cx, cy + h * 0.4, cx + w / 2.6, cy + h * 0.05); ctx.stroke();
  }
  function coverWatermark() {
    if (!geo) return;
    var px = geo.ox + geo.dw * 0.845, py = geo.oy + geo.dh * 0.855;
    var pw = geo.dw * 0.17, ph = geo.dh * 0.17;
    var cx = px + pw * 0.5, cy = py + ph * 0.5;
    var rad = ctx.createRadialGradient(cx, cy, pw * 0.15, cx, cy, pw * 0.8);
    rad.addColorStop(0, 'rgba(234,231,226,1)');
    rad.addColorStop(0.75, 'rgba(234,231,226,0.95)');
    rad.addColorStop(1, 'rgba(234,231,226,0)');
    ctx.fillStyle = rad;
    ctx.fillRect(px - 3, py - 3, pw + 8, ph + 8);
  }
  function pickKey() {
    if (performance.now() < smileUntil && imgs.SMILE &&
        imgs.SMILE.complete && imgs.SMILE.naturalWidth) return 'SMILE';
    var v = speak.viseme;
    var k = (v === 'A' || v === 'O' || v === 'E') ? v : 'closed';
    if (!(imgs[k] && imgs[k].complete && imgs[k].naturalWidth)) k = 'closed';
    return k;
  }

  /* ---------- loop ---------- */
  function loop(t) {
    ctx.clearRect(0, 0, W, H);
    if (imgs.closed && imgs.closed.complete && imgs.closed.naturalWidth) {
      if (!geo) {
        var b = imgs.closed;
        var s = Math.max(W / b.width, H / b.height) * 1.07;
        geo = { dw: b.width * s, dh: b.height * s };
        geo.ox = (W - geo.dw) / 2; geo.oy = (H - geo.dh) / 2;
      }
      var im = imgs[pickKey()];
      var acting = speak.active || busy;
      var bobX = acting ? Math.sin(t / 470) * 0.35 : 0;
      var bobY = acting ? Math.sin(t / 320) * 0.45 : 0;
      var br = 1 + 0.012 * Math.sin(t / 750);
      ctx.save();
      ctx.translate(W / 2 + bobX, geo.oy + geo.dh + bobY);
      ctx.scale(br, br);
      ctx.translate(-W / 2, -(geo.oy + geo.dh));
      ctx.drawImage(im, geo.ox, geo.oy, geo.dw, geo.dh);
      coverWatermark();
      if (performance.now() < blinkUntil) {
        drawLid(geo.ox + CAL.eyes.l.x * geo.dw, geo.oy + CAL.eyes.l.y * geo.dh, geo.dw);
        drawLid(geo.ox + CAL.eyes.r.x * geo.dw, geo.oy + CAL.eyes.r.y * geo.dh, geo.dw);
      }
      ctx.restore();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------- react to chat ---------- */
  function watchChat() {
    if (typeof window.fetch !== 'function') return;
    var orig = window.fetch;
    window.fetch = function (url) {
      var u = '', isChat = false;
      try { u = String(url).split('?')[0]; isChat = /\/(chat|ask)$/.test(u); } catch (e) {}
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
                if (d && typeof d === 'object') t = d.output || d.reply || d.text || d.response_text || '';
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

  if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = function () { window.speechSynthesis.getVoices(); };
  }

  function boot() { watchChat(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  window.PKFace = { smile: smile, speak: speakSnippet };
})();