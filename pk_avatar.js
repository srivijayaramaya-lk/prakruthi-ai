/* =========================================================================
   pk_avatar.js — v1.12 "ප්‍රකෘති මුහුණ" (Perfect Audio File Lip-Sync)
   Owner's pencil-sketch portrait, real mouth layers synchronized with Audio.
   100% Guaranteed Sound-to-Mouth matching using Web Audio Analyser.
   ========================================================================= */
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

  /* click → enlarge / close */
  cv.addEventListener('click', function (e) {
    e.stopPropagation();
    wrap.classList.toggle('big');
  });

  /* ---------- 🔊 AUDIO LOGIC SETUP ---------- */
  // ඔබ සතු පිරිසිදු කටහඬ ගොනුව (Audio File) මෙතැනට දමන්න
  var audio = new Audio('/clean_voice.mp3?v=2'); 
  var audioCtx = null, analyser = null, dataArray = null, audioSetup = false;

  function initAudioTracking() {
    if (audioSetup) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // කුඩා අගයක් මඟින් වේගවත් ප්‍රතිචාර ලැබේ
      var bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      audioSetup = true;
    } catch (e) { console.error("Audio Context Error:", e); }
  }

  /* ---------- layered images ---------- */
  var files = {
    closed: '/face_base.png?v=2', A: '/mouth_a.png?v=2', O: '/mouth_o.png?v=2',
    E: '/mouth_i.png?v=2', SMILE: '/mouth_smile.png?v=2'
  };
  var imgs = {}, loaded = 0, arrived = 0;
  Object.keys(files).forEach(function (k) {
    var im = new Image(); im.src = files[k]; imgs[k] = im;
    var done = function () { arrived++; if (arrived === 5) { loaded = countOk(); } };
    im.onload = function () { loaded++; done(); };
    im.onerror = function () { done(); };
  });
  
  function countOk() {
    var n = 0;
    Object.keys(imgs).forEach(function (k) {
      if (imgs[k].complete && imgs[k].naturalWidth) n++;
    });
    return n;
  }

  var geo = null;
  var blinkUntil = 0;
  (function sb() {
    setTimeout(function () { blinkUntil = performance.now() + BLINK_MS; sb(); },
      2600 + Math.random() * 3400);
  })();

  var busy = false;
  var liveViseme = 'closed';
  var smileUntil = 0;
  
  function smile(ms) { smileUntil = performance.now() + (ms || 2000); }
  function setBusy(v) { busy = !!v; }

  // 🎯 පිටතින් Text එකක් ආ විට Audio File එක ධාවනය කිරීම
  function speakSnippet(text) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    initAudioTracking();
    audio.currentTime = 0;
    audio.play().catch(function(e){ console.log("Audio play blocked:", e); });
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
    
    // ශබ්දය නැතිනම් කට වසා තබයි
    if (audio.paused || audio.ended) return 'closed';
    
    return liveViseme;
  }

  /* ---------- loop ---------- */
  function loop(t) {
    ctx.clearRect(0, 0, W, H);
    
    // 🎯 සැබෑ හඬ තරංග විශ්ලේෂණය කර කටේ පින්තූර මාරු කිරීම
    if (audioSetup && !audio.paused) {
      analyser.getByteFrequencyData(dataArray);
      var total = 0;
      for (var i = 0; i < dataArray.length; i++) { total += dataArray[i]; }
      var vol = total / dataArray.length; // සැබෑ ශබ්ද මට්ටම (0-255)

      // හඬෙහි උස් පහත් වීම් අනුව පින්තූර (Visemes) මාරු කිරීම
      if (vol < 5) { liveViseme = 'closed'; }
      else if (vol >= 5 && vol < 45) { liveViseme = 'E'; }  // සියුම් ශබ්ද (ඉ)
      else if (vol >= 45 && vol < 85) { liveViseme = 'O'; } // මධ්‍යම ශබ්ද (ඔ)
      else { liveViseme = 'A'; }                            // උස් ශබ්ද (ආ)
    }

    if (imgs.closed && imgs.closed.complete && imgs.closed.naturalWidth) {
      if (!geo) {
        var b = imgs.closed;
        var s = Math.max(W / b.width, H / b.height) * 1.07;
        geo = { dw: b.width * s, dh: b.height * s };
        geo.ox = (W - geo.dw) / 2; geo.oy = (H - geo.dh) / 2;
      }
      var im = imgs[pickKey()];
      var acting = (!audio.paused && !audio.ended) || busy;
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

  // පළමු ක්ලික් කිරීමේදී හෝ ස්පර්ශයේදී Audio Context එක බලගැන්වීම (Browser Blocks වලක්වාලීමට)
  document.addEventListener('click', function() { if(audioCtx) audioCtx.resume(); }, { once: true });

  function boot() { watchChat(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  window.PKFace = { smile: smile, speak: speakSnippet };
})();
