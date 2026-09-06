/* ප්‍රකෘති AI — UI Feature Pack v1.1
   🌙 dark · 🔤 font size · 🌏 UI language · 💾 on-device history
   සියල්ල localStorage — server එකට අමතර දත්ත යන්නේ නෑ. */
(function () {
  "use strict";
  if (window.__pkFeaturesLoaded) return;
  window.__pkFeaturesLoaded = true;

  var LS = { theme: "pk_theme", zoom: "pk_zoom", lang: "pk_lang", hist: "pk_history" };
  var state = {
    dark: localStorage.getItem(LS.theme) === "dark",
    zoom: parseFloat(localStorage.getItem(LS.zoom) || "1") || 1,
    lang: localStorage.getItem(LS.lang) || "si"
  };

  var I18N = {
    si: { settings: "අභිරුචි", dark: "අඳුරු පෙනුම", size: "අකුරු ප්‍රමාණය",
          lang: "භාෂාව", placeholder: "ඔබේ පණිවිඩය...", send: "යවන්න",
          histTitle: "පරණ සංවාදය — ඔබේ උපකරණයේම සුරැකෙනවා",
          clear: "ඉතිහාසය මකන්න", clearAsk: "ඉතිහාසය මකලා දමන්නද?" },
    en: { settings: "Settings", dark: "Dark mode", size: "Font size",
          lang: "Language", placeholder: "Your message...", send: "Send",
          histTitle: "Previous chat — stored on your device only",
          clear: "Clear history", clearAsk: "Clear history?" },
    ta: { settings: "அமைப்புகள்", dark: "இருண்ட தோற்றம்", size: "எழுத்து அளவு",
          lang: "மொழி", placeholder: "உங்கள் செய்தி...", send: "அனுப்பு",
          histTitle: "பழைய உரையாடல் — உங்கள் சாதனத்தில் மட்டும்",
          clear: "வரலாறு அழி", clearAsk: "வரலாற்றை அழிக்கவா?" }
  };

  var css = [
    "#pkBtn{position:fixed;top:8px;right:10px;z-index:99999;background:#1b5e20;color:#ffd97a;",
    "border:1px solid #2e7d32;border-radius:50%;width:38px;height:38px;font-size:18px;cursor:pointer;",
    "box-shadow:0 2px 8px rgba(0,0,0,.35)}",
    "#pkPanel{position:fixed;top:54px;right:10px;z-index:99999;background:#fff;color:#1b3a24;",
    "border:1px solid #2e7d32;border-radius:12px;padding:12px 14px;width:230px;display:none;",
    "box-shadow:0 8px 24px rgba(0,0,0,.3);font-size:13px}",
    "#pkPanel.open{display:block}",
    "#pkPanel h4{margin:0 0 8px;font-size:14px;color:#1b5e20}",
    "#pkPanel .row{display:flex;align-items:center;justify-content:space-between;margin:9px 0}",
    "#pkPanel button{cursor:pointer;border:1px solid #2e7d32;background:#e8f5e9;border-radius:6px;padding:2px 9px}",
    "#pkPanel .full{width:100%;margin-top:8px;padding:6px}",
    "#pkLang{border:1px solid #2e7d32;border-radius:6px;padding:2px 4px;background:#fff}",
    "html.pk-dark #pkPanel{background:#10241a;color:#cfe8d8}",
    "html.pk-dark #pkPanel h4{color:#ffd97a}",
    "html.pk-dark #pkPanel button,html.pk-dark #pkLang{background:#1b3a24;color:#cfe8d8;border-color:#2e7d32}",
    ".pk-hist-label{text-align:center;font-size:12px;color:#6b8f77;margin:12px 0 4px}",
    ".pk-msg{max-width:78%;margin:6px 12px;padding:8px 12px;border-radius:12px;font-size:15px;",
    "line-height:1.5;white-space:pre-wrap;word-wrap:break-word;clear:both}",
    ".pk-user{background:#1b5e20;color:#fff;margin-left:auto}",
    ".pk-ai{background:#fff;color:#1b3a24;border:1px solid #cde5d2;margin-right:auto}",
    "html.pk-dark .pk-ai{background:#122019;color:#d7ead8;border-color:#264a35}"
  ].join("");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- 🌙 dark engine (palette scan) ---------- */
  function lum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

  function processEl(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.id === "pkBtn" || el.id === "pkPanel") return;
    if (el.closest && el.closest("#pkBtn,#pkPanel")) return;
    var cs; try { cs = getComputedStyle(el); } catch (e) { return; }
    var bg = cs.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && !el.dataset.pkBg) {
      var p = bg.match(/[\d.]+/g);
      if (p) {
        var a = p.length > 3 ? parseFloat(p[3]) : 1;
        if (a > 0.05 && lum(+p[0], +p[1], +p[2]) > 110) {
          el.dataset.pkBg = bg;
          el.style.backgroundColor = "#122019";
        }
      }
    }
    if (!el.dataset.pkFg) {
      var q = cs.color && cs.color.match(/\d+/g);
      if (q && lum(+q[0], +q[1], +q[2]) < 100) {
        el.dataset.pkFg = cs.color;
        el.style.color = "#d7ead8";
      }
    }
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    processEl(root);
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) processEl(all[i]);
  }
  function enableDark() {
    state.dark = true;
    document.documentElement.classList.add("pk-dark");
    if (!document.documentElement.dataset.pkHtmlBg) {
      document.documentElement.dataset.pkHtmlBg = "1";
      document.documentElement.style.backgroundColor = "#0f1712";
    }
    scan(document.body);
    localStorage.setItem(LS.theme, "dark");
    var b = document.getElementById("pkDark"); if (b) b.textContent = "☀️";
  }
  function disableDark() {
    state.dark = false;
    document.documentElement.classList.remove("pk-dark");
    if (document.documentElement.dataset.pkHtmlBg) {
      delete document.documentElement.dataset.pkHtmlBg;
      document.documentElement.style.backgroundColor = "";
    }
    var bgs = document.querySelectorAll("[data-pk-bg]");
    for (var i = 0; i < bgs.length; i++) { bgs[i].style.backgroundColor = bgs[i].dataset.pkBg; delete bgs[i].dataset.pkBg; }
    var fgs = document.querySelectorAll("[data-pk-fg]");
    for (var j = 0; j < fgs.length; j++) { fgs[j].style.color = fgs[j].dataset.pkFg; delete fgs[j].dataset.pkFg; }
    localStorage.setItem(LS.theme, "light");
    var b = document.getElementById("pkDark"); if (b) b.textContent = "🌙";
  }
  new MutationObserver(function (muts) {
    if (!state.dark) return;
    for (var i = 0; i < muts.length; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) if (added[j].nodeType === 1) scan(added[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- 🔤 zoom ---------- */
  function applyZoom() {
    document.body.style.zoom = state.zoom === 1 ? "" : String(state.zoom);
    localStorage.setItem(LS.zoom, String(state.zoom));
  }

  /* ---------- 💾 history (fetch + XHR hooks) ---------- */
  function loadHist() { try { return JSON.parse(localStorage.getItem(LS.hist) || "[]"); } catch (e) { return []; } }
  function addHist(role, text) {
    if (!text || typeof text !== "string") return;
    var h = loadHist(); h.push({ r: role, t: text.slice(0, 2000), ts: Date.now() });
    try { localStorage.setItem(LS.hist, JSON.stringify(h.slice(-60))); } catch (e) {}
  }
  function pick(obj, keys) {
    for (var i = 0; i < keys.length; i++) if (obj && typeof obj[keys[i]] === "string" && obj[keys[i]]) return obj[keys[i]];
    return "";
  }
  var _fetch = window.fetch;
  if (_fetch) {
    window.fetch = function () {
      var args = arguments;
      return _fetch.apply(this, args).then(function (res) {
        try {
          var url = (typeof args[0] === "string") ? args[0] : (args[0] && args[0].url) || "";
          var opts = args[1] || {};
          var method = (opts.method || (args[0] && args[0].method) || "GET").toUpperCase();
          if (method === "POST" && /\/chat/.test(url)) {
            var req = {};
            try { req = typeof opts.body === "string" ? JSON.parse(opts.body) : {}; } catch (e) {}
            addHist("u", pick(req, ["message", "prompt", "text", "q", "content"]));
            res.clone().json().then(function (data) {
              addHist("a", pick(data, ["reply", "response", "output", "text", "answer", "message"]));
            }).catch(function () {});
          }
        } catch (e) {}
        return res;
      });
    };
  }
  (function () {
    var _open = XMLHttpRequest.prototype.open, _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) {
      this.__pkChat = (m || "").toUpperCase() === "POST" && /\/chat/.test(u || "");
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
      var xhr = this;
      if (xhr.__pkChat) {
        xhr.addEventListener("load", function () {
          try {
            var req = typeof body === "string" ? JSON.parse(body) : {};
            addHist("u", pick(req, ["message", "prompt", "text", "q", "content"]));
            var data = JSON.parse(xhr.responseText);
            addHist("a", pick(data, ["reply", "response", "output", "text", "answer", "message"]));
          } catch (e) {}
        });
      }
      return _send.apply(this, arguments);
    };
  })();

  function findScroller(el) {
    while (el && el !== document.body) {
      var cs = getComputedStyle(el);
      if ((cs.overflowY === "auto" || cs.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 40) return el;
      el = el.parentElement;
    }
    return null;
  }
  function renderHist() {
    var h = loadHist().slice(-20);
    if (!h.length) return;
    var t = I18N[state.lang] || I18N.si;
    var inp = document.querySelector("textarea, input[type='text'], input:not([type='hidden'])");
    if (!inp) return;
    var box = document.createElement("div"); box.id = "pkHist";
    var lbl = document.createElement("div"); lbl.className = "pk-hist-label";
    lbl.textContent = "── " + t.histTitle + " ──"; box.appendChild(lbl);
    for (var i = 0; i < h.length; i++) {
      var d = document.createElement("div");
      d.className = "pk-msg " + (h[i].r === "u" ? "pk-user" : "pk-ai");
      d.textContent = h[i].t; box.appendChild(d);
    }
    var sc = findScroller(inp), form = inp.closest("form");
    if (sc) sc.insertBefore(box, sc.firstChild);
    else (form || inp).parentElement.insertBefore(box, form || inp);
  }

  /* ---------- 🌏 language ---------- */
  function applyLang() {
    var t = I18N[state.lang] || I18N.si;
    var inp = document.querySelector("textarea, input[type='text'], input:not([type='hidden'])");
    if (inp) inp.placeholder = t.placeholder;
    var btns = document.querySelectorAll("button, input[type='submit']");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.id === "pkBtn" || (b.closest && b.closest("#pkPanel"))) continue;
      if (/යවන්න|send|அனுப்பு/i.test(b.textContent || "")) { b.textContent = t.send; break; }
    }
    var lbl = document.querySelector("#pkHist .pk-hist-label");
    if (lbl) lbl.textContent = "── " + t.histTitle + " ──";
    document.getElementById("pkT1").textContent = t.settings;
    document.getElementById("pkT2").textContent = t.dark;
    document.getElementById("pkT3").textContent = t.size;
    document.getElementById("pkT4").textContent = t.lang;
    document.getElementById("pkClear").textContent = "🗑 " + t.clear;
  }

  /* ---------- panel ---------- */
  function buildPanel() {
    var btn = document.createElement("button");
    btn.id = "pkBtn"; btn.textContent = "🎨"; btn.title = "Prakruthi settings";
    var panel = document.createElement("div"); panel.id = "pkPanel";
    panel.innerHTML =
      '<h4 id="pkT1"></h4>' +
      '<div class="row"><span id="pkT2"></span><button id="pkDark"></button></div>' +
      '<div class="row"><span id="pkT3"></span><span><button id="pkMinus">A−</button> <button id="pkPlus">A+</button></span></div>' +
      '<div class="row"><span id="pkT4"></span><select id="pkLang"><option value="si">සිං</option><option value="en">EN</option><option value="ta">தமிழ்</option></select></div>' +
      '<button class="full" id="pkClear"></button>';
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    btn.onclick = function () { panel.classList.toggle("open"); };
    document.getElementById("pkDark").onclick = function () { state.dark ? disableDark() : enableDark(); };
    document.getElementById("pkMinus").onclick = function () { state.zoom = Math.max(0.8, Math.round((state.zoom - 0.1) * 10) / 10); applyZoom(); };
    document.getElementById("pkPlus").onclick = function () { state.zoom = Math.min(1.5, Math.round((state.zoom + 0.1) * 10) / 10); applyZoom(); };
    var sel = document.getElementById("pkLang");
    sel.value = state.lang;
    sel.onchange = function () { state.lang = sel.value; localStorage.setItem(LS.lang, sel.value); applyLang(); };
    document.getElementById("pkClear").onclick = function () {
      var t = I18N[state.lang] || I18N.si;
      if (confirm(t.clearAsk)) { localStorage.removeItem(LS.hist); var b = document.getElementById("pkHist"); if (b) b.remove(); }
    };
  }

  function init() {
    buildPanel();
    applyLang();
    if (state.zoom !== 1) applyZoom();
    renderHist();
    document.getElementById("pkDark").textContent = state.dark ? "☀️" : "🌙";
    if (state.dark) setTimeout(enableDark, 350);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
