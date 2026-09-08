/* ප්‍රකෘති AI v1.2 client — 📷 vision + 👤 accounts + ☁ sync + 🪷 wake screen
   v1.2.1: menu match — "See Account ☁ below" text එකත් හම්බවෙනවා */
(function () {
  "use strict";
  if (window.__pkV12) return;
  window.__pkV12 = true;
  var K = { tok: "pk_token", user: "pk_user", sync: "pk_sync", last: "pk_last_sync" };
  var pendingImage = null;

  function $(id) { return document.getElementById(id); }
  function tok() { return localStorage.getItem(K.tok) || ""; }
  function me() { return localStorage.getItem(K.user) || ""; }
  function syncOn() { return localStorage.getItem(K.sync) !== "0"; }
  function toast(msg) {
    var t = $("pkToast"); if (!t) return;
    t.textContent = msg; t.style.display = "block";
    clearTimeout(t.__h); t.__h = setTimeout(function () { t.style.display = "none"; }, 2200);
  }
  function api(path, opts, cb) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (tok()) opts.headers.Authorization = "Bearer " + tok();
    fetch(path, opts).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) { cb(d); }).catch(function () { cb({ error: "network" }); });
  }

  /* ---------- CSS ---------- */
  var st = document.createElement("style");
  st.textContent = [
    "#pkWake{position:fixed;inset:0;z-index:100003;display:none;align-items:center;justify-content:center;",
    "background:linear-gradient(160deg,#0d2a1e,#1c4d38 42%,#7ab294);}",
    "#pkWake .card{text-align:center;color:#eaf6ee;font-family:sans-serif}",
    "#pkWake .lot{font-size:52px;display:inline-block;animation:pkPulse 1.4s infinite ease-in-out}",
    "#pkWake .t{margin-top:12px;font-size:15px;text-shadow:0 1px 3px rgba(0,0,0,.4)}",
    "#pkWake .s{margin-top:6px;font-size:12px;opacity:.85}",
    "@keyframes pkPulse{0%,100%{transform:scale(.9);opacity:.6}50%{transform:scale(1.15);opacity:1}}",
    "#pkCamBtn{position:absolute;left:10px;bottom:10px;z-index:5;width:38px;height:38px;border-radius:50%;",
    "border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.16);backdrop-filter:blur(12px);",
    "-webkit-backdrop-filter:blur(12px);color:#fff;font-size:17px;cursor:pointer}",
    "#pkCamBtn:hover{background:rgba(255,255,255,.3)}",
    "#pkImgChip{position:absolute;bottom:calc(100% + 8px);left:8px;display:none;align-items:center;gap:8px;padding:6px;",
    "border-radius:14px;background:rgba(15,45,30,.55);backdrop-filter:blur(16px);",
    "-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.35);z-index:6}",
    "#pkImgChip img{width:46px;height:46px;object-fit:cover;border-radius:9px;display:block}",
    "#pkImgChip span{color:#eaf6ee;font-size:12px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "#pkImgChip button{border:none;background:none;color:#fff;font-size:15px;cursor:pointer}",
    ".pkv-msg{max-width:85%;padding:10px 14px;border-radius:14px;line-height:1.5;white-space:pre-wrap;",
    "word-wrap:break-word;margin:6px 0;font-size:14.5px}",
    ".pkv-u{align-self:flex-end;background:#c8e6c9;border-radius:14px 14px 4px 14px}",
    ".pkv-a{align-self:flex-start;background:#f1f3f4;border-radius:14px 14px 14px 4px}",
    "#pkAccModal{position:fixed;inset:0;z-index:100002;display:none;align-items:center;justify-content:center;background:rgba(5,20,12,.45)}",
    "#pkAccModal.open{display:flex}",
    "#pkAccCard{width:300px;max-width:92vw;border-radius:20px;padding:18px;background:rgba(18,48,34,.65);",
    "backdrop-filter:blur(28px) saturate(1.6);-webkit-backdrop-filter:blur(28px) saturate(1.6);",
    "border:1px solid rgba(255,255,255,.4);color:#eaf6ee;font-size:13px}",
    "#pkAccCard h4{margin:0 0 12px;font-size:15px}",
    "#pkAccCard input{width:100%;box-sizing:border-box;margin-bottom:9px;padding:8px 10px;border-radius:10px;",
    "border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.14);color:#eaf6ee;font:inherit}",
    "#pkAccCard .btns{display:flex;gap:8px}",
    "#pkAccCard .btns button{flex:1;cursor:pointer;border:1px solid rgba(255,255,255,.35);border-radius:10px;",
    "background:rgba(255,255,255,.14);color:#eaf6ee;padding:8px 0;font:inherit;font-weight:600}",
    "#pkAccMsg{min-height:16px;margin-top:8px;font-size:12px;color:#ffd9d9}",
    "#pkAccMsg.ok{color:#bdeccf}"
  ].join("");
  document.head.appendChild(st);

  /* ---------- 🪷 wake screen + keep-alive ---------- */
  var wake = document.createElement("div"); wake.id = "pkWake";
  wake.innerHTML = '<div class="card"><span class="lot">🪷</span>' +
    '<div class="t">ප්‍රකෘති අවදි වෙනවා…</div><div class="s">විනාඩියක් ඉන්න</div></div>';
  document.body.appendChild(wake);
  var wakeShown = 0;
  function wakeShow() {
    if (!wakeShown) { wakeShown = Date.now(); wake.style.display = "flex"; }
  }
  function wakeHide() { wake.style.display = "none"; }
  function wakeCheck(tries) {
    fetch("/api/pk_health", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) wakeHide(); else retry(); })
      .catch(retry);
    function retry() {
      if (tries <= 0) { wakeHide(); return; }
      wakeShow();
      setTimeout(function () { wakeCheck(tries - 1); }, 4000);
    }
  }
  setTimeout(function () { wakeCheck(22); }, 1500);
  setInterval(function () {
    if (document.visibilityState === "visible") fetch("/api/pk_health", { cache: "no-store" }).catch(function () {});
  }, 9 * 60 * 1000);

  /* ---------- 📷 camera ---------- */
  function chatInput() {
    var list = document.querySelectorAll("textarea, input[type='text']");
    for (var j = 0; j < list.length; j++) {
      if (list[j].closest && list[j].closest("#pkDrawer,#pkMenu,#pkAccCard,#pkWake")) continue;
      return list[j];
    }
    return null;
  }
  function chatBox(inp) {
    if (inp) {
      var n = inp, i = 0;
      while (n && n !== document.body && i++ < 12) {
        var cs = getComputedStyle(n);
        if ((cs.overflowY === "auto" || cs.overflowY === "scroll") && n.scrollHeight > n.clientHeight) return n;
        n = n.parentElement;
      }
    }
    return document.querySelector("#chat, .chat, main") || document.body;
  }
  function bubble(cls, txt) {
    var d = document.createElement("div");
    d.className = "pkv-msg " + cls; d.textContent = txt;
    return d;
  }
  function compress(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1024, sc = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * sc));
        c.height = Math.max(1, Math.round(img.height * sc));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function clearImage() {
    pendingImage = null;
    var chip = $("pkImgChip"); if (chip) chip.style.display = "none";
  }
  function buildCamera() {
    var inp = chatInput();
    if (!inp || $("pkCamBtn")) return;
    var host = inp.parentElement; if (!host) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    inp.style.paddingLeft = "48px";
    var btn = document.createElement("button");
    btn.id = "pkCamBtn"; btn.type = "button"; btn.title = "පින්තූරයක් යවන්න"; btn.textContent = "📷";
    var file = document.createElement("input");
    file.type = "file"; file.accept = "image/*"; file.style.display = "none";
    btn.onclick = function () { file.click(); };
    file.onchange = function () {
      var f = file.files && file.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast("පින්තූර විතරයි 📷"); return; }
      compress(f, function (dataUrl) {
        pendingImage = dataUrl;
        var chip = $("pkImgChip");
        chip.querySelector("img").src = dataUrl;
        chip.querySelector("span").textContent = f.name || "photo";
        chip.style.display = "flex";
        var inp2 = chatInput();
        if (inp2 && !(inp2.value || "").trim()) inp2.value = "මේ මොකක්ද?";
        toast("පින්තූරය attach වුණා ✓ යවන්න");
      });
      file.value = "";
    };
    var chip = document.createElement("div"); chip.id = "pkImgChip";
    chip.innerHTML = '<img alt=""><span></span><button type="button" title="අයින් කරන්න">✕</button>';
    chip.querySelector("button").onclick = clearImage;
    host.appendChild(btn); host.appendChild(file); host.appendChild(chip);
  }

  /* ---------- 📷 send takeover ---------- */
  function sendVision(text) {
    var inp = chatInput();
    var box = chatBox(inp);
    if (inp) inp.value = "";
    var img = pendingImage; clearImage();
    if (text) box.appendChild(bubble("pkv-u", text));
    var wait = bubble("pkv-a", "🪷 පින්තූරය බලනවා…");
    box.appendChild(wait); box.scrollTop = box.scrollHeight;
    var headers = { "Content-Type": "application/json" };
    if (tok()) headers.Authorization = "Bearer " + tok();
    fetch("/api/vision", { method: "POST", headers: headers, body: JSON.stringify({ message: text, image: img }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        wait.textContent = d && d.reply ? d.reply : "⚠ " + ((d && d.error) || "fail");
        box.scrollTop = box.scrollHeight;
      })
      .catch(function () { wait.textContent = "⚠ ජාලය — නැවත උත්සාහ කරන්න"; });
  }
  document.addEventListener("keydown", function (e) {
    if (!pendingImage || e.key !== "Enter" || e.shiftKey) return;
    var t = e.target;
    if (!t || (t.tagName !== "TEXTAREA" && t.tagName !== "INPUT")) return;
    if (t.closest && t.closest("#pkDrawer,#pkMenu,#pkAccCard,#pkWake")) return;
    e.preventDefault(); e.stopPropagation();
    sendVision((t.value || "").trim());
  }, true);
  document.addEventListener("click", function (e) {
    if (!pendingImage) return;
    var b = e.target.closest && e.target.closest("button, input[type='submit']");
    if (!b || b.id === "pkCamBtn" || (b.closest && b.closest("#pkImgChip,#pkMenu,#pkDrawer"))) return;
    if (/යවන්න|send|அனுப்பு/i.test(b.textContent || b.value || "")) {
      e.preventDefault(); e.stopPropagation();
      var inp = chatInput();
      sendVision(inp ? (inp.value || "").trim() : "");
    }
  }, true);

  /* ---------- 👤 accounts ---------- */
  function buildModal() {
    if ($("pkAccModal")) return;
    var m = document.createElement("div"); m.id = "pkAccModal";
    m.innerHTML = '<div id="pkAccCard"><h4>👤 Account</h4>' +
      '<input id="pkUser" type="text" maxlength="20" placeholder="Username (a-z, 0-9, _)">' +
      '<input id="pkPass" type="password" placeholder="Password (6+ අකුරු)">' +
      '<div class="btns"><button id="pkLoginB">Log in</button><button id="pkRegB">Register</button></div>' +
      '<div id="pkAccMsg"></div></div>';
    document.body.appendChild(m);
    m.onclick = function (e) { if (e.target === m) m.classList.remove("open"); };
    $("pkLoginB").onclick = function () { doAuth("/api/login"); };
    $("pkRegB").onclick = function () { doAuth("/api/register"); };
  }
  function doAuth(path) {
    var u = $("pkUser").value.trim(), p = $("pkPass").value;
    var msg = $("pkAccMsg"); msg.className = ""; msg.textContent = "…";
    api(path, { method: "POST", body: JSON.stringify({ username: u, password: p }) }, function (d) {
      if (d && d.ok && d.token) {
        localStorage.setItem(K.tok, d.token);
        localStorage.setItem(K.user, d.username || u);
        localStorage.setItem(K.last, String(Date.now()));
        msg.className = "ok"; msg.textContent = "✓ ආයුබෝවන් " + (d.username || u);
        setTimeout(function () { $("pkAccModal").classList.remove("open"); renderAcc(); pullHistory(); }, 500);
      } else msg.textContent = (d && d.error) || "Fail";
    });
  }
  function logout() {
    api("/api/logout", { method: "POST" }, function () {});
    localStorage.removeItem(K.tok); localStorage.removeItem(K.user);
    renderAcc(); toast("Logout වුණා");
  }
  function renderAcc() {
    var box = $("pkAccBox"); if (!box) return;
    box.innerHTML = "";
    if (tok()) {
      [["👤 " + me(), null],
       ["Sync to cloud ☁", "chk"],
       ["ඕනෑම device එකකින් login = history එක", "note"],
       ["Logout", "btn"]].forEach(function (row) {
        var r = document.createElement("div"); r.className = "row";
        var s = document.createElement("span"); s.textContent = row[0]; r.appendChild(s);
        if (row[1] === "chk") {
          var c = document.createElement("input"); c.type = "checkbox"; c.checked = syncOn();
          c.onchange = function () { localStorage.setItem(K.sync, c.checked ? "1" : "0"); };
          r.appendChild(c);
        }
        if (row[1] === "btn") {
          var b = document.createElement("button"); b.textContent = "Logout"; b.onclick = logout; r.appendChild(b);
        }
        box.appendChild(r);
      });
    } else {
      var r = document.createElement("div"); r.className = "row";
      var s = document.createElement("span"); s.textContent = "Multi-device history";
      var b = document.createElement("button"); b.textContent = "Log in";
      b.onclick = function () { buildModal(); $("pkAccModal").classList.add("open"); $("pkUser").focus(); };
      r.appendChild(s); r.appendChild(b); box.appendChild(r);
    }
  }
  function upgradeMenu() {
    var menu = $("pkMenu");
    if (!menu) { setTimeout(upgradeMenu, 800); return; }
    var btns = menu.querySelectorAll("button");
    for (var i = 0; i < btns.length; i++) {
      if (/v1\.2|soon|below/i.test(btns[i].textContent || "")) {
        var sec = btns[i].closest(".sec");
        if (sec) {
          sec.innerHTML = "<h5>Account ☁</h5>";
          var box = document.createElement("div"); box.id = "pkAccBox";
          sec.appendChild(box); renderAcc(); return;
        }
      }
    }
    setTimeout(upgradeMenu, 900);
  }

  /* ---------- ☁ cloud sync ---------- */
  var _si = Storage.prototype.setItem, _ri = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    _si.call(this, k, v);
    try {
      if (k === "pk_history" && tok() && syncOn() && v) {
        var arr = JSON.parse(v), last = arr[arr.length - 1];
        var ls = +(localStorage.getItem(K.last) || 0);
        if (last && last.ts > ls) {
          _si.call(localStorage, K.last, String(last.ts));
          api("/api/history", { method: "POST", body: JSON.stringify(last) }, function () {});
        }
      }
    } catch (e) {}
  };
  Storage.prototype.removeItem = function (k) {
    _ri.call(this, k);
    if (k === "pk_history" && tok()) api("/api/history", { method: "DELETE" }, function () {});
  };
  function pullHistory() {
    if (!tok()) return;
    api("/api/history", {}, function (d) {
      if (!d || !Array.isArray(d.items)) return;
      var local = [];
      try { local = JSON.parse(localStorage.getItem("pk_history") || "[]"); } catch (e) {}
      var have = {};
      local.forEach(function (m) { have[m.r + "|" + m.t] = 1; });
      var added = false;
      d.items.forEach(function (m) {
        if (!have[(m.role === "u" ? "u" : "a") + "|" + m.text]) {
          local.push({ r: m.role, t: m.text, ts: m.ts }); added = true;
        }
      });
      if (added) {
        local.sort(function (a, b) { return a.ts - b.ts; });
        _si.call(localStorage, "pk_history", JSON.stringify(local.slice(-60)));
        toast("Cloud history sync වුණා ☁");
      }
    });
  }

  function init() {
    buildCamera();
    upgradeMenu();
    if (tok()) pullHistory();
    setInterval(function () { if (!$("pkCamBtn")) buildCamera(); }, 2000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();