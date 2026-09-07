/* ප්‍රකෘති AI — UI Pack v1.5 (Liquid Glass — iOS 26 style)
   Panel = clear glass: background shows through. Inner opaque layers cleared.
   ☰ menu · 🔤 font · 🌏 language · 💾 history drawer · 📌 context folders. All data local. */
(function () {
  "use strict";
  if (window.__pkFeaturesLoaded) return;
  window.__pkFeaturesLoaded = true;

  var LS = { zoom: "pk_zoom", lang: "pk_lang", hist: "pk_history", ctx: "pk_ctx" };
  var CHAT_STRINGS = {
    si: { placeholder: "ඔබේ පණිවිඩය...", send: "යවන්න" },
    en: { placeholder: "Your message...", send: "Send" },
    ta: { placeholder: "உங்கள் செய்தி...", send: "அனுப்பு" }
  };
  var state = {
    zoom: parseFloat(localStorage.getItem(LS.zoom) || "1") || 1,
    lang: localStorage.getItem(LS.lang) || "si"
  };
  localStorage.removeItem("pk_theme");

  /* ---------- CSS ---------- */
  var css = [
    "html,body{min-height:100%!important}",
    "body{background:linear-gradient(160deg,#0d2a1e 0%,#1c4d38 42%,#7ab294 100%)!important;background-attachment:fixed!important}",
    "#pkGlassBg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}",
    "#pkGlassBg .b{position:absolute;border-radius:50%}",
    "#pkGlassBg .b1{width:46vmax;height:46vmax;left:-12vmax;top:-16vmax;background:radial-gradient(circle at 35% 32%,#41806f,#1d4a3e 68%);opacity:.9;filter:blur(4px)}",
    "#pkGlassBg .b2{width:36vmax;height:36vmax;right:-11vmax;top:16vh;background:radial-gradient(circle at 35% 35%,#2c6b58,#122f24 75%);opacity:.85;filter:blur(6px)}",
    "#pkGlassBg .b3{width:32vmax;height:32vmax;left:-9vmax;bottom:-11vmax;background:radial-gradient(circle at 40% 35%,#93d3b8,#3d7a5f 75%);opacity:.8;filter:blur(8px)}",
    "#pkGlassBg .b4{width:15vmax;height:15vmax;right:12vw;bottom:5vh;background:radial-gradient(circle at 40% 35%,#ffe3a1,#d9a94e 80%);opacity:.55;filter:blur(10px)}",
    "#pkGlassBg .b5{width:12vmax;height:12vmax;right:22vw;top:6vh;background:radial-gradient(circle at 40% 35%,#a9dcc3,#4d8a6b 80%);opacity:.6;filter:blur(9px)}",
    "#pkGlassBg .b6{width:40vmax;height:40vmax;left:27vw;top:4vh;background:radial-gradient(circle at 38% 34%,#8fd0b4,#3f7d60 72%);opacity:.85;filter:blur(5px)}",
    "#pkGlassBg .b7{width:32vmax;height:32vmax;left:42vw;top:42vh;background:radial-gradient(circle at 36% 34%,#2c6b58,#12352a 75%);opacity:.75;filter:blur(6px)}",
    "#pkGlassBg .b8{width:26vmax;height:26vmax;left:30vw;bottom:-8vh;background:radial-gradient(circle at 40% 35%,#ffe9b8,#cfa64f 78%);opacity:.55;filter:blur(9px)}",
    "#pkMenuBtn{position:fixed;top:10px;right:64px;z-index:99998;display:flex;align-items:center;gap:6px;",
    "padding:7px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.55);",
    "background:rgba(255,255,255,.25);backdrop-filter:blur(20px) saturate(1.6);",
    "-webkit-backdrop-filter:blur(20px) saturate(1.6);color:#fff;font-size:13px;font-weight:600;",
    "text-shadow:0 1px 2px rgba(0,0,0,.35);cursor:pointer;box-shadow:0 4px 18px rgba(11,60,35,.25)}",
    "#pkMenuBtn:hover{background:rgba(255,255,255,.38)}",
    "#pkMenu{position:fixed;top:50px;right:64px;z-index:99999;width:256px;display:none;border-radius:20px;",
    "border:1px solid rgba(255,255,255,.45);background:rgba(20,50,36,.45);",
    "backdrop-filter:blur(30px) saturate(1.6);-webkit-backdrop-filter:blur(30px) saturate(1.6);",
    "color:#eaf6ee;font-size:13px;box-shadow:0 18px 50px rgba(5,25,15,.5);overflow:hidden}",
    "#pkMenu.open{display:block}",
    "#pkMenu .sec{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.14)}",
    "#pkMenu .sec:last-child{border-bottom:none}",
    "#pkMenu h5{margin:0 0 7px;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#a9d3ba}",
    "#pkMenu .row{display:flex;align-items:center;justify-content:space-between;gap:8px}",
    "#pkMenu button{cursor:pointer;border:1px solid rgba(255,255,255,.3);border-radius:10px;",
    "background:rgba(255,255,255,.12);color:#eaf6ee;padding:4px 11px;font:inherit;font-weight:600}",
    "#pkMenu button:hover{background:rgba(255,255,255,.22)}",
    "#pkMenu button:disabled{opacity:.45;cursor:default}",
    "#pkLangSel{border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:3px 6px;background:rgba(255,255,255,.15);color:#eaf6ee;font:inherit}",
    "#pkLangSel option{color:#173a26}",
    "#pkScrim{position:fixed;inset:0;z-index:99998;background:rgba(5,20,12,.35);display:none}",
    "#pkScrim.open{display:block}",
    "#pkDrawer{position:fixed;top:0;right:-380px;width:350px;max-width:94vw;height:100%;z-index:100000;",
    "display:flex;flex-direction:column;background:rgba(18,45,32,.5);",
    "backdrop-filter:blur(30px) saturate(1.5);-webkit-backdrop-filter:blur(30px) saturate(1.5);",
    "border-left:1px solid rgba(255,255,255,.3);box-shadow:-14px 0 44px rgba(5,25,15,.5);",
    "transition:right .28s ease;color:#eaf6ee;font-size:13px}",
    "#pkDrawer.open{right:0}",
    "#pkDrawer .hd{display:flex;justify-content:space-between;align-items:center;padding:13px 16px;",
    "border-bottom:1px solid rgba(255,255,255,.16)}",
    "#pkDrawer .hd b{font-size:14px}",
    "#pkDrawer .bd{flex:1;overflow-y:auto;padding:12px 14px}",
    "#pkDrawer .note{color:#a9d3ba;font-size:11.5px;margin:2px 0 10px}",
    ".pk-msg{max-width:86%;margin:6px 0;padding:8px 12px;border-radius:12px;line-height:1.5;",
    "white-space:pre-wrap;word-wrap:break-word;clear:both;font-size:13.5px}",
    ".pk-u{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);margin-left:auto}",
    ".pk-a{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.22);margin-right:auto}",
    ".pk-time{font-size:10px;color:#a9d3ba;clear:both;margin:0 2px 4px}",
    ".pk-slot{border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:10px;margin-bottom:10px;background:rgba(255,255,255,.08)}",
    ".pk-slot .nm{font-weight:700;margin-bottom:6px;font-size:12px;color:#cdeeda}",
    ".pk-slot input[type=text],.pk-slot textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.3);",
    "border-radius:9px;padding:6px 8px;font:inherit;background:rgba(255,255,255,.14);color:#eaf6ee;margin-bottom:6px}",
    ".pk-slot input::placeholder,.pk-slot textarea::placeholder{color:#9fc4ad}",
    ".pk-slot textarea{min-height:70px;resize:vertical}",
    ".pk-slot .ops{display:flex;align-items:center;gap:8px;font-size:12px}",
    "#pkToast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:100001;display:none;",
    "padding:8px 18px;border-radius:999px;background:rgba(20,50,36,.75);backdrop-filter:blur(14px);",
    "border:1px solid rgba(255,255,255,.3);color:#fff;font-size:13px;",
    "box-shadow:0 6px 22px rgba(0,0,0,.3)}"
  ].join("");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- helpers ---------- */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function toast(msg) {
    var t = document.getElementById("pkToast");
    t.textContent = msg; t.style.display = "block";
    clearTimeout(t.__h);
    t.__h = setTimeout(function () { t.style.display = "none"; }, 1800);
  }
  function applyZoom() {
    document.body.style.zoom = state.zoom === 1 ? "" : String(state.zoom);
    localStorage.setItem(LS.zoom, String(state.zoom));
  }
  function lum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function ours(elx) {
    return elx.id === "pkGlassBg" || elx.id === "pkMenuBtn" || elx.id === "pkMenu" ||
           elx.id === "pkScrim" || elx.id === "pkDrawer" || elx.id === "pkToast" ||
           /^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(elx.tagName);
  }

  /* ---------- background ---------- */
  function buildGlassBg() {
    var bg = el("div"); bg.id = "pkGlassBg";
    bg.innerHTML = '<div class="b b1"></div><div class="b b2"></div><div class="b b3"></div><div class="b b4"></div><div class="b b5"></div>' +
                   '<div class="b b6"></div><div class="b b7"></div><div class="b b8"></div>';
    document.body.appendChild(bg);
  }
  function liftContent() {
    var kids = document.body.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (ours(k)) continue;
      var cs; try { cs = getComputedStyle(k); } catch (e) { continue; }
      if (cs.position === "static") { k.style.position = "relative"; k.style.zIndex = 1; }
      else { var z = parseInt(cs.zIndex, 10); if (isNaN(z) || z < 1) k.style.zIndex = 1; }
    }
  }

  /* ---------- LIQUID GLASS core ---------- */
  /* inner opaque layers → clear; bubbles (rounded, small) stay readable */
  function clearLayers(panel) {
    var kids = panel.querySelectorAll("*");
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.dataset && k.dataset.pkGlass) continue;
      var cs; try { cs = getComputedStyle(k); } catch (e) { continue; }
      var bg = cs.backgroundColor;
      if (!bg || bg === "rgba(0, 0, 0, 0)") continue;
      var p = bg.match(/[\d.]+/g); if (!p) continue;
      var a = p.length > 3 ? parseFloat(p[3]) : 1;
      if (a < 0.35) continue;
      var w = k.offsetWidth || 0, h = k.offsetHeight || 0;
      if (w < 60 && h < 24) continue;                    /* tiny bits — keep */
      var rad = parseFloat(cs.borderTopLeftRadius) || 0;
      if (rad >= 8 && w < 480) continue;                 /* bubble-ish — keep own bg */
      var r = +p[0], g = +p[1], b = +p[2], L = lum(r, g, b);
      k.dataset.pkGlass = "child";
      if (L < 110) {
        /* dark layer (header) → dark glass; white text stays readable */
        k.style.setProperty("backdrop-filter", "blur(14px) saturate(1.3)", "important");
        k.style.setProperty("-webkit-backdrop-filter", "blur(0.08px) saturate(1.3)", "important");
        k.style.setProperty("background-color", "rgba(" + r + "," + g + "," + b + ",0.5)", "important");
        k.style.setProperty("border-color", "rgba(255,255,255,.35)", "important");
      } else {
        /* light layer → nearly clear so the spheres show through */
        k.style.setProperty("background-image", "none", "important");
        k.style.setProperty("background-color", "rgba(255,255,255,0.10)", "important");
      }
    }
  }
  function makeLiquid(panel) {
    panel.dataset.pkGlass = "1";
    panel.style.setProperty("backdrop-filter", "blur(30px) saturate(1.6)", "important");
    panel.style.setProperty("-webkit-backdrop-filter", "blur(30px) saturate(1.6)", "important");
    panel.style.setProperty("background-image", "none", "important");
    panel.style.setProperty("background-color", "rgba(255,255,255,0.14)", "important");
    panel.style.setProperty("border", "1px solid rgba(255,255,255,0.4)", "important");
    panel.style.setProperty("border-radius", "22px", "important");
    panel.style.setProperty("box-shadow",
      "inset 0 1px 0 rgba(255,255,255,.5), 0 18px 50px rgba(8,36,22,.32)", "important");
    clearLayers(panel);
  }
  function findMainPanel() {
    var best = null, bestA = 0;
    var kids = document.body.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (ours(k)) continue;
      var w = k.offsetWidth || 0, h = k.offsetHeight || 0;
      if (w * h > bestA) { bestA = w * h; best = k; }
    }
    return best;
  }
  /* other (outside-panel) light/dark surfaces → subtle glass */
  function glassify(elx) {
    if (elx.dataset && elx.dataset.pkGlass) return;
    if (elx === document.body || elx === document.documentElement) return;
    if (ours(elx)) return;
    var cs; try { cs = getComputedStyle(elx); } catch (e) { return; }
    var bg = cs.backgroundColor;
    if (!bg || bg === "rgba(0, 0, 0, 0)") return;
    var p = bg.match(/[\d.]+/g); if (!p) return;
    var a = p.length > 3 ? parseFloat(p[3]) : 1;
    if (a < 0.2) return;
    var r = +p[0], g = +p[1], b = +p[2], L = lum(r, g, b);
    elx.dataset.pkGlass = "solo";
    elx.style.setProperty("backdrop-filter", "blur(22px) saturate(1.5)", "important");
    elx.style.setProperty("-webkit-backdrop-filter", "blur(22px) saturate(1.5)", "important");
    if (L < 110) {
      elx.style.setProperty("background-color", "rgba(" + r + "," + g + "," + b + ",0.5)", "important");
    } else {
      elx.style.setProperty("background-image", "none", "important");
      elx.style.setProperty("background-color", "rgba(255,255,255,0.30)", "important");
    }
  }
  function scan() {
    var panel = findMainPanel();
    if (panel) {
      if (panel.dataset.pkGlass !== "1") { liftContent(); makeLiquid(panel); }
      else clearLayers(panel);
    } else liftContent();
    var all = document.body.querySelectorAll("*");
    var panelEl = panel;
    for (var i = 0; i < all.length; i++) {
      var k = all[i];
      if (panelEl && panelEl.contains(k)) continue;
      glassify(k);
    }
  }

  /* ---------- history store ---------- */
  function loadHist() { try { return JSON.parse(localStorage.getItem(LS.hist) || "[]"); } catch (e) { return []; } }
  function addHist(role, text) {
    if (!text || typeof text !== "string") return;
    var h = loadHist(); h.push({ r: role, t: text.slice(0, 2000), ts: Date.now() });
    try { localStorage.setItem(LS.hist, JSON.stringify(h.slice(-60))); } catch (e) {}
  }

  /* ---------- context folders ---------- */
  function loadCtx() {
    var a; try { a = JSON.parse(localStorage.getItem(LS.ctx) || "[]"); } catch (e) { a = []; }
    if (!Array.isArray(a)) a = [];
    while (a.length < 3) a.push({ name: "", content: "", on: false });
    return a.slice(0, 3);
  }
  function saveCtx(a) { localStorage.setItem(LS.ctx, JSON.stringify(a)); }
  function activeCtxText() {
    var a = loadCtx(), parts = [];
    for (var i = 0; i < a.length; i++) {
      if (!a[i].on) continue;
      var nm = (a[i].name || "").trim(), ct = (a[i].content || "").trim();
      var txt = ct || nm; /* either box works */
      if (txt) parts.push((nm && ct) ? nm + ": " + ct : txt);
    }
    return parts.join(" | ");
  }

  /* ---------- network hooks: history + auto context ---------- */
  var REQ_KEYS = ["message", "prompt", "text", "q", "content"];
  var RESP_KEYS = ["reply", "response", "output", "text", "answer", "message"];
  function pick(obj, keys) {
    for (var i = 0; i < keys.length; i++)
      if (obj && typeof obj[keys[i]] === "string" && obj[keys[i]]) return obj[keys[i]];
    return "";
  }
  function pickDeep(obj, keys) {
    var v = pick(obj, keys); if (v) return v;
    var best = "";
    try {
      for (var k in obj) {
        if (typeof obj[k] === "string" && obj[k].length > best.length) best = obj[k];
        else if (obj[k] && typeof obj[k] === "object") {
          var inner = pick(obj[k], keys);
          if (inner && inner.length > best.length) best = inner;
          else for (var k2 in obj[k])
            if (typeof obj[k][k2] === "string" && obj[k][k2].length > best.length) best = obj[k][k2];
        }
      }
    } catch (e) {}
    return best;
  }
  function prepareBody(bodyStr) {
    var obj; try { obj = JSON.parse(bodyStr); } catch (e) { return null; }
    if (!obj || typeof obj !== "object") return null;
    for (var i = 0; i < REQ_KEYS.length; i++) {
      var k = REQ_KEYS[i];
      if (typeof obj[k] === "string" && obj[k]) {
        var orig = obj[k];
        addHist("u", orig);
        var ctx = activeCtxText();
        if (ctx) obj[k] = "[Context — applies to all my messages: " + ctx + "]\n" + orig;
        return JSON.stringify(obj);
      }
    }
    return null;
  }
  var _fetch = window.fetch;
  if (_fetch) {
    window.fetch = function () {
      var args = [].slice.call(arguments);
      try {
        var url = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
        var opts = args[1] = args[1] || {};
        var method = (opts.method || (args[0] && args[0].method) || "GET").toUpperCase();
        if (method === "POST" && /\/chat/.test(url) && typeof opts.body === "string") {
          var nb = prepareBody(opts.body);
          if (nb) opts.body = nb;
        }
      } catch (e) {}
      return _fetch.apply(this, args).then(function (res) {
        try {
          var u2 = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
          var m2 = ((args[1] && args[1].method) || "GET").toUpperCase();
          if (m2 === "POST" && /\/chat/.test(u2))
            res.clone().json().then(function (d) { addHist("a", pickDeep(d, RESP_KEYS)); }).catch(function () {});
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
      if (xhr.__pkChat && typeof body === "string") {
        var nb = prepareBody(body); if (nb) body = nb;
        xhr.addEventListener("load", function () {
          try { addHist("a", pickDeep(JSON.parse(xhr.responseText), RESP_KEYS)); } catch (e) {}
        });
      }
      return _send.apply(this, arguments);
    };
  })();

  /* ---------- chat page language ---------- */
  function applyLang() {
    var s = CHAT_STRINGS[state.lang] || CHAT_STRINGS.si;
    var inp = document.querySelector("textarea, input[type='text'], input:not([type='hidden'])");
    if (inp) inp.placeholder = s.placeholder;
    var btns = document.querySelectorAll("button, input[type='submit']");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.id === "pkMenuBtn" || (b.closest && b.closest("#pkMenu,#pkDrawer"))) continue;
      if (/යවන්න|send|அனுப்பு/i.test((b.textContent || b.value || ""))) {
        if (b.tagName === "INPUT") b.value = s.send; else b.textContent = s.send;
        break;
      }
    }
  }

  /* ---------- drawer views ---------- */
  function renderHistoryView(box) {
    box.innerHTML = "";
    var h = loadHist().slice().reverse();
    if (!h.length) { box.appendChild(el("div", "note", "No saved messages yet.")); return; }
    for (var i = 0; i < h.length; i++) {
      var d = new Date(h[i].ts);
      box.appendChild(el("div", "pk-time",
        d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        (h[i].r === "u" ? " · You" : " · Prakruthi")));
      box.appendChild(el("div", "pk-msg " + (h[i].r === "u" ? "pk-u" : "pk-a"), h[i].t));
    }
  }
  function renderContextView(box) {
    box.innerHTML = "";
    box.appendChild(el("div", "note",
      "Saved folders are added automatically to every message you send — no need to repeat your purpose. Keep wording clean and purpose-focused."));
    var slots = loadCtx();
    for (var i = 0; i < slots.length; i++) (function (i) {
      var card = el("div", "pk-slot");
      card.appendChild(el("div", "nm", "Folder " + (i + 1)));
      var name = document.createElement("input"); name.type = "text";
      name.placeholder = "Name (e.g. Security research)";
      name.value = slots[i].name || "";
      var ta = document.createElement("textarea");
      ta.placeholder = "Describe your ongoing purpose / rules for the AI...";
      ta.value = slots[i].content || "";
      var ops = el("div", "ops");
      var chk = document.createElement("input"); chk.type = "checkbox"; chk.id = "pkOn" + i;
      chk.checked = !!slots[i].on;
      var lbl = el("label", null, "Always include"); lbl.htmlFor = chk.id;
      var save = el("button", null, "Save");
      save.onclick = function () {
        var a = loadCtx();
        a[i] = { name: name.value, content: ta.value, on: chk.checked };
        saveCtx(a); toast("Folder " + (i + 1) + " saved ✓");
      };
      ops.appendChild(chk); ops.appendChild(lbl); ops.appendChild(save);
      card.appendChild(name); card.appendChild(ta); card.appendChild(ops);
      box.appendChild(card);
    })(i);
  }

  /* ---------- build UI ---------- */
  function buildUI() {
    var toastEl = el("div"); toastEl.id = "pkToast"; document.body.appendChild(toastEl);
    var btn = el("button"); btn.id = "pkMenuBtn"; btn.textContent = "☰ Menu ▾";
    var menu = el("div"); menu.id = "pkMenu";

    var s1 = el("div", "sec"); s1.appendChild(el("h5", null, "Font size"));
    var r1 = el("div", "row");
    var bDec = el("button", null, "A−"), bRes = el("button", null, "Reset"), bInc = el("button", null, "A+");
    bDec.onclick = function () { state.zoom = Math.max(0.8, Math.round((state.zoom - 0.1) * 10) / 10); applyZoom(); };
    bInc.onclick = function () { state.zoom = Math.min(1.5, Math.round((state.zoom + 0.1) * 10) / 10); applyZoom(); };
    bRes.onclick = function () { state.zoom = 1; applyZoom(); };
    r1.appendChild(bDec); r1.appendChild(bRes); r1.appendChild(bInc); s1.appendChild(r1);

    var s2 = el("div", "sec"); s2.appendChild(el("h5", null, "Language"));
    var r2 = el("div", "row");
    r2.appendChild(el("span", null, "Chat interface"));
    var sel = el("select"); sel.id = "pkLangSel";
    [["si", "සිංහල"], ["en", "English"], ["ta", "தமிழ்"]].forEach(function (o) {
      var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op);
    });
    sel.value = state.lang;
    sel.onchange = function () { state.lang = sel.value; localStorage.setItem(LS.lang, sel.value); applyLang(); };
    r2.appendChild(sel); s2.appendChild(r2);

    var s3 = el("div", "sec"); s3.appendChild(el("h5", null, "History"));
    var r3 = el("div", "row");
    r3.appendChild(el("span", null, "No account needed — device only"));
    var bHist = el("button", null, "Open");
    r3.appendChild(bHist); s3.appendChild(r3);

    var s4 = el("div", "sec"); s4.appendChild(el("h5", null, "Context folders"));
    var r4 = el("div", "row");
    r4.appendChild(el("span", null, "3 slots · auto-sent"));
    var bCtx = el("button", null, "Manage");
    r4.appendChild(bCtx); s4.appendChild(r4);

    var s5 = el("div", "sec");
    var r5 = el("div", "row");
    r5.appendChild(el("span", null, "Accounts"));
    var bAcc = el("button", null, "v1.2 — soon"); bAcc.disabled = true;
    r5.appendChild(bAcc); s5.appendChild(r5);

    menu.appendChild(s1); menu.appendChild(s2); menu.appendChild(s3); menu.appendChild(s4); menu.appendChild(s5);
    document.body.appendChild(btn); document.body.appendChild(menu);
    btn.onclick = function (e) { e.stopPropagation(); menu.classList.toggle("open"); };
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && e.target !== btn) menu.classList.remove("open");
    });

    var scrim = el("div"); scrim.id = "pkScrim";
    var drawer = el("div"); drawer.id = "pkDrawer";
    var hd = el("div", "hd");
    var title = el("b", null, "History");
    var close = el("button", null, "✕");
    hd.appendChild(title); hd.appendChild(close);
    var bd = el("div", "bd");
    var vHist = el("div"), vCtx = el("div"); vCtx.style.display = "none";
    bd.appendChild(vHist); bd.appendChild(vCtx);
    drawer.appendChild(hd); drawer.appendChild(bd);
    document.body.appendChild(scrim); document.body.appendChild(drawer);

    function openDrawer(which) {
      title.textContent = which === "ctx" ? "Context folders" : "History";
      vHist.style.display = which === "ctx" ? "none" : "block";
      vCtx.style.display = which === "ctx" ? "block" : "none";
      if (which === "ctx") renderContextView(vCtx); else renderHistoryView(vHist);
      scrim.classList.add("open"); drawer.classList.add("open");
      menu.classList.remove("open");
    }
    function closeDrawer() { scrim.classList.remove("open"); drawer.classList.remove("open"); }
    bHist.onclick = function () { openDrawer("hist"); };
    bCtx.onclick = function () { openDrawer("ctx"); };
    close.onclick = closeDrawer;
    scrim.onclick = closeDrawer;
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeDrawer(); menu.classList.remove("open"); } });
  }

  /* ---------- init ---------- */
  function init() {
    buildGlassBg();
    buildUI();
    applyLang();
    if (state.zoom !== 1) applyZoom();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { scan(); });
    });
    var pending = null;
    new MutationObserver(function () {
      if (!pending) pending = requestAnimationFrame(function () { pending = null; scan(); });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
