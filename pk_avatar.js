/* =========================================================
   pk_avatar.js — v1.6.1 "ප්‍රකෘති මුහුණ" (Avatar-lite)
   Pure CSS/JS live face: breathing + blinking + think/happy.
   No libraries. Touches no AI logic, no other file.
   Mount: #pk-face-slot if present, else floats top-center.
   API: window.PKAvatar.set('idle' | 'think')
   ========================================================= */
(function () {
  if (window.PKAvatar) return; // double-load guard

  var CSS = `
  .pk-face-wrap{display:flex;justify-content:center;align-items:center;}
  .pk-face-wrap.floating{position:fixed;top:12px;left:50%;transform:translateX(-50%);
    z-index:9998;pointer-events:none;}
  .pk-face{position:relative;width:84px;height:84px;border-radius:50%;
    background:radial-gradient(circle at 50% 35%, #f2fbf5 0%, #d3ecdd 55%, #b7ddc6 100%);
    box-shadow:0 6px 20px rgba(46,125,80,.25), inset 0 -6px 14px rgba(46,125,80,.10);
    animation:pk-breathe 4.4s ease-in-out infinite;}
  @keyframes pk-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  .pk-eye{position:absolute;top:32px;width:11px;height:15px;border-radius:50%;
    background:#28513b;transition:transform .12s ease, height .25s ease, top .25s ease;}
  .pk-eye.l{left:22px}.pk-eye.r{right:22px}
  .pk-face.blink .pk-eye{transform:scaleY(.08)}
  .pk-face.think .pk-eye{height:8px;top:35px}
  .pk-face.happy{animation:pk-breathe 4.4s ease-in-out infinite, pk-happy .7s ease;}
  @keyframes pk-happy{0%{transform:scale(1)}35%{transform:scale(1.14)}70%{transform:scale(.98)}100%{transform:scale(1)}}
  .pk-smile{position:absolute;left:50%;bottom:18px;width:34px;height:17px;
    transform:translateX(-50%);border-bottom:3.5px solid #28513b;
    border-radius:0 0 34px 34px;}
  .pk-leaf{position:absolute;top:-10px;left:50%;
    transform:translateX(-50%) rotate(-18deg);font-size:15px;}
  @media (max-width:480px){
    .pk-face{width:64px;height:64px}
    .pk-eye{top:24px;width:9px;height:12px}
    .pk-eye.l{left:16px}.pk-eye.r{right:16px}
    .pk-face.think .pk-eye{height:7px;top:26px}
    .pk-smile{bottom:13px;width:26px;height:13px}
    .pk-leaf{font-size:12px;top:-8px}
  }
  @media (prefers-reduced-motion: reduce){.pk-face{animation:none}}
  `;

  function injectCss() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function buildFace() {
    var wrap = document.createElement('div');
    wrap.className = 'pk-face-wrap';
    wrap.innerHTML =
      '<div class="pk-face" id="pkFace">' +
        '<span class="pk-leaf">🍃</span>' +
        '<span class="pk-eye l"></span>' +
        '<span class="pk-eye r"></span>' +
        '<span class="pk-smile"></span>' +
      '</div>';
    return wrap;
  }

  function startLife(el) {
    function blink() {
      el.classList.add('blink');
      setTimeout(function () { el.classList.remove('blink'); }, 160);
      setTimeout(blink, 2500 + Math.random() * 4500);
    }
    setTimeout(blink, 1800);
  }

  function mount() {
    var slot = document.getElementById('pk-face-slot');
    var face = buildFace();
    if (slot) { slot.appendChild(face); }
    else {
      face.classList.add('floating');
      document.body.appendChild(face);
    }
    startLife(face.querySelector('.pk-face'));
  }

  /* React to chat: /chat request in flight -> think;
     finished -> idle + happy bounce. Self-contained fetch
     wrapper — modifies NO other file. */
  function watchChat() {
    if (typeof window.fetch !== 'function') return;
    var orig = window.fetch;
    window.fetch = function (url) {
      var isChat = false;
      try { isChat = (typeof url === 'string' && url.indexOf('/chat') !== -1); } catch (e) {}
      if (!isChat) return orig.apply(this, arguments);
      window.PKAvatar.set('think');
      var p = orig.apply(this, arguments);
      var done = function () {
        window.PKAvatar.set('idle');
        var el = document.getElementById('pkFace');
        if (el) {
          el.classList.add('happy');
          setTimeout(function () { el.classList.remove('happy'); }, 750);
        }
      };
      try { if (p && p.finally) { p.finally(done); } else if (p) { p.then(done, done); } } catch (e) {}
      return p;
    };
  }

  window.PKAvatar = {
    set: function (state) {
      var el = document.getElementById('pkFace');
      if (el) el.classList.toggle('think', state === 'think');
    }
  };

  function boot() { injectCss(); mount(); watchChat(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();