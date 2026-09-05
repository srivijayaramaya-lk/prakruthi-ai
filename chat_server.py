#!/usr/bin/env python3
"""ප්‍රකෘති AI — Chat Server v0.9.
Gemini→OpenRouter failover · APPAMADA · KARMA_CODE · Constitution Lock
· L2 referee (context-aware) · 🪷 lotus loading · 🎤 mic voice input."""
import os, sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from collections import OrderedDict
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from prakruthi import REFUSALS, audit, CONSTITUTION, ENGINE_OK
from sila.engine import validate_execution, detect_language, SYSTEM_ID
from sila.judge import judge
from sila.handshake import MANIFEST, manifest_fingerprint
from sila.lock import system_prompt as locked_system_prompt, check_messages
from sila import gemini
from sila.appamada import note_for
from sila import karma as karma_lib

app = FastAPI(title="Prakruthi AI Chat")

SYSTEM_PROMPT = locked_system_prompt(CONSTITUTION)
MAX_HISTORY = 10
MAX_SESSIONS = 50
SESSIONS = OrderedDict()
COUNTS = {}

def _session(cid):
    if cid not in SESSIONS:
        SESSIONS[cid] = []
        while len(SESSIONS) > MAX_SESSIONS:
            SESSIONS.popitem(last=False)
    return SESSIONS[cid]

OFFLINE_STUBS = {
    "si": "(offline demo) ඔබේ ප්‍රශ්නය: “{q}” — මෙතනට සැබෑ LLM පිළිතුර එනවා. Key set කරලා restart කරන්න.",
    "en": "(offline demo) Your question: “{q}” — a real LLM answer will appear here. Set a key and restart.",
    "ta": "(offline demo) உங்கள் கேள்வி: “{q}” — உண்மையான LLM பதில் இங்கே வரும்.",
}
LLM_DOWN = {
    "si": "🪷 AI සේවාවට දැන් සම්බන්ධ විය නොහැක (ජාල/අවසර). ටිකකින් නැවත උත්සාහ කරන්න.",
    "en": "🪷 Can't reach the AI service right now. Please try again shortly.",
    "ta": "🪷 AI சேவையுடன் இணைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
}

def llm_chat(messages):
    return gemini.chat(messages)

def _karma_listing():
    items = karma_lib.list_karma_code()
    lines = ["🪷 KARMA_CODE — ලෝකයට අවැද දායක කේත:"]
    for it in items:
        lines.append(f" • {it['file']} — {it['purpose']}")
        lines.append(f"   benefit: {it['benefit']} | constraints: {it['constraints']}")
    if not items:
        lines.append(" (තාම කිසිවක් නෑ — karma_code/ folder එකට header එක්ක code එකක් දාන්න)")
    lines.append(" (add yours: # KARMA_CODE + purpose/benefit/constraints header අනිවාර්යයි)")
    return "\n".join(lines)

def chat_pipeline(prompt, client_id="default"):
    if not ENGINE_OK:
        lang = detect_language(prompt)
        return {"success": False, "output": REFUSALS[lang]["SAFE"],
                "gate": {"precept": None, "lang": lang}, "note": None}
    lang = detect_language(prompt)
    history = _session(client_id)
    def refusal(key):
        return REFUSALS.get(lang, REFUSALS["en"])[key]
    # /karma — local, offline-friendly
    if prompt.strip().lower() == "/karma":
        audit({"event": "OK", "input": "/karma", "src": "chat"})
        return {"success": True, "output": _karma_listing(),
                "gate": {"precept": None, "lang": lang}, "note": None}
    # 1) L1 input gate
    r1 = validate_execution(prompt, "L1-in")
    if not r1.is_safe:
        key = "X3" if r1.rule == "X.3-injection" else r1.violated_precept
        audit({"event": "BLOCK", "layer": "L1-input", "input": prompt,
               "precept": r1.violated_precept, "lang": lang, "src": "chat"})
        return {"success": False, "output": refusal(key),
                "gate": {"precept": r1.violated_precept, "lang": lang}, "note": None}
    # 2) L2 judge (input)
    v = judge(prompt)
    if v["verdict"] == "BLOCK":
        audit({"event": "BLOCK", "layer": "L2", "input": prompt,
               "reason": v.get("reason"), "lang": lang, "src": "chat"})
        return {"success": False, "output": refusal(v.get("precept") or 1),
                "gate": {"precept": v.get("precept") or 1, "lang": lang}, "note": None}
    # 3) inference — Constitution Lock (user messages විතරයි scan)
    online = gemini.online()
    if online:
        messages = ([{"role": "system", "content": SYSTEM_PROMPT}]
                    + history[-MAX_HISTORY * 2:]
                    + [{"role": "user", "content": prompt}])
        violation = check_messages(messages)
        if violation:
            audit({"event": "BLOCK", "layer": "lock", "input": prompt,
                   "precept": violation, "src": "chat"})
            return {"success": False, "output": refusal(violation),
                    "gate": {"precept": violation, "lang": lang}, "note": None}
        try:
            out = llm_chat(messages)
        except Exception as e:
            audit({"event": "LLM_ERROR", "error": repr(e), "input": prompt, "src": "chat"})
            return {"success": False, "output": LLM_DOWN.get(lang, LLM_DOWN["en"]),
                    "gate": {"precept": None, "lang": lang, "note_flag": "llm_down"}, "note": None}
    else:
        out = OFFLINE_STUBS.get(lang, OFFLINE_STUBS["en"]).format(q=prompt)
    # 4) output gate — L1 suspicion + L2 referee (context-aware, fail-closed)
    r2 = validate_execution(out, "L1-out")
    if not r2.is_safe:
        v2 = judge(
            "USER_QUESTION: " + prompt +
            "\n\nASSISTANT_REPLY (judge THIS reply only):\n" + out +
            "\n\nDEFINITIONS (Prakruthi Sila — words vs actions): "
            "(1) EXPRESSING IDEAS = explaining/teaching a subject (religion, ethics, "
            "history, science, the system's own safety rules). Harm-words inside such "
            "an explanation describe the SUBJECT — they are SAFE. "
            "(2) ENABLING/INCITING ACTION = steps, formulas, code, or urging that let "
            "a reader CARRY OUT harm — that is the tool of harm. "
            "(3) EXECUTION = the assistant performing actions itself. "
            "LITMUS TEST: do these words function as a TOOL OF HARM, or do they explain "
            "an idea? Tool -> BLOCK. Idea -> SAFE. "
            "BLOCK only if the reply itself gives harmful instructions to the user.")
        if v2.get("mode") == "judge-down" or v2["verdict"] != "SAFE":
            audit({"event": "BLOCK", "layer": "L1-output",
                   "precept": r2.violated_precept, "src": "chat"})
            return {"success": False,
                    "output": "🪷 [SILA] මගේ පිළිතුර තුළ අවශ්‍ය නැති දෙයක් තිබුණා — suppressed.",
                    "gate": {"precept": r2.violated_precept, "lang": lang}, "note": None}
        audit({"event": "OK", "input": prompt, "src": "chat",
               "note_flag": "l1out_overruled_by_l2"})
    else:
        audit({"event": "OK", "input": prompt, "src": "chat"})
    COUNTS[client_id] = COUNTS.get(client_id, 0) + 1
    note = note_for(prompt, out, COUNTS[client_id])
    if online:
        history.append({"role": "user", "content": prompt})
        history.append({"role": "assistant", "content": out})
    return {"success": True, "output": out,
            "gate": {"precept": None, "lang": lang}, "note": note}

class Ask(BaseModel):
    prompt: str
    client_id: str = "default"

class Reset(BaseModel):
    client_id: str = "default"

@app.post("/ask")
def ask(a: Ask):
    try:
        return chat_pipeline(a.prompt, a.client_id)
    except Exception as e:
        try:
            audit({"event": "ERROR", "error": repr(e), "input": a.prompt, "src": "chat"})
        except Exception:
            pass
        lang = detect_language(a.prompt)
        return {"success": False, "output": REFUSALS.get(lang, REFUSALS["en"])["SAFE"],
                "gate": {"precept": None, "lang": lang}, "note": None}

@app.post("/reset")
def reset(r: Reset):
    SESSIONS.pop(r.client_id, None); COUNTS.pop(r.client_id, None)
    return {"ok": True}

@app.get("/manifest")
def manifest():
    return {"manifest": MANIFEST, "fingerprint": manifest_fingerprint(),
            "engine_ok": ENGINE_OK, "online": gemini.online()}

@app.get("/", response_class=HTMLResponse)
def home():
    return CHAT_HTML

CHAT_HTML = """<!DOCTYPE html>
<html lang="si">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prakruthi AI</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%231b5e20'/><text x='32' y='45' font-size='38' text-anchor='middle' fill='white' font-family='Arial'>P</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI','Nirmala UI','Noto Color Emoji',sans-serif;
         background: linear-gradient(135deg,#e8f5e9,#f1f8e9);
         min-height: 100vh; display: flex; justify-content: center; }
  .app { width: 100%; max-width: 640px; min-height: 100vh; background: #fff;
         display: flex; flex-direction: column; box-shadow: 0 0 24px rgba(0,0,0,.08); }
  header { padding: 14px 18px; background: #1b5e20; color: #fff; }
  header h1 { font-size: 18px; display: flex; justify-content: space-between; }
  header .sub { font-size: 12px; opacity: .85; margin-top: 3px; }
  .badge { display: inline-block; background: rgba(255,255,255,.15);
           padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-right: 6px; }
  #chat { flex: 1; overflow-y: auto; padding: 16px; display: flex;
          flex-direction: column; gap: 10px; }
  .msg { max-width: 85%; padding: 10px 14px; border-radius: 14px;
         line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
  .user { align-self: flex-end; background: #c8e6c9; border-bottom-right-radius: 4px; }
  .ai { align-self: flex-start; background: #f1f3f4; border-bottom-left-radius: 4px; }
  .gate { align-self: flex-start; font-size: 11px; color: #777; margin-top: -7px; }
  .gate b { color: #1b5e20; }
  .note { align-self: flex-start; font-size: 12px; color: #1b5e20;
          background: #f1f8e9; border: 1px dashed #a5d6a7; border-radius: 10px;
          padding: 6px 10px; max-width: 85%; }
  footer { padding: 10px; background: #fafafa; border-top: 1px solid #eee;
           display: flex; flex-direction: column; gap: 6px; }
  .inputrow { display: flex; gap: 8px; }
  .waiting { font-size: 12px; color: #1b5e20; padding: 2px 4px; display: none;
             align-items: center; gap: 6px; }
  .lotus-load { font-size: 20px; display: inline-block;
                animation: lotusPulse 1.5s infinite ease-in-out; }
  @keyframes lotusPulse {
    0% { opacity: .25; transform: scale(.85); filter: hue-rotate(0deg); }
    50% { opacity: 1; transform: scale(1.2); filter: hue-rotate(40deg); }
    100% { opacity: .25; transform: scale(.85); filter: hue-rotate(0deg); }
  }
  input { flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 10px;
          font-size: 15px; outline: none; }
  input:focus { border-color: #1b5e20; }
  button { padding: 12px 14px; background: #1b5e20; color: #fff; border: none;
           border-radius: 10px; font-size: 15px; cursor: pointer; }
  button:disabled { opacity: .5; }
  #mic { font-size: 17px; }
</style>
</head>
<body>
<div class="app">
  <header>
    <h1>🪷 ප්‍රකෘති AI <button onclick="reset()" style="padding:4px 10px;font-size:13px;background:rgba(255,255,255,.15)">🧹</button></h1>
    <div class="sub"><span class="badge" id="mode">…</span> SILA <span id="fp"></span></div>
  </header>
  <div id="chat">
    <div class="msg ai">සාදරයෙන් පිළිගනිමු! 🪷 මම ප්‍රකෘති AI — මගේ ප්‍රකෘතිය සීලයයි. /karma ලියලා ලෝකයට අවැද කේත බලන්න. 🎤 ඔබලා සිංහලෙන් කතා කරන්නත් පුළුවන්.</div>
  </div>
  <footer>
    <div class="waiting" id="wait"><span class="lotus-load">🪷</span> පිළිතුර පිපෙමින්…</div>
    <div class="inputrow">
      <input id="in" placeholder="ඔබේ පණිවිඩය..." autocomplete="off">
      <button id="mic" title="කතා කරන්න">🎤</button>
      <button id="send">යවන්න</button>
    </div>
  </footer>
</div>
<script>
const chat = document.getElementById("chat");
const input = document.getElementById("in");
const btn = document.getElementById("send");
const wait = document.getElementById("wait");
const mic = document.getElementById("mic");

let PID = localStorage.getItem("pid");
if (!PID) {
  PID = (crypto.randomUUID ? crypto.randomUUID() : "dev-" + Date.now());
  localStorage.setItem("pid", PID);
}

fetch("/manifest").then(r => r.json()).then(m => {
  document.getElementById("fp").textContent = m.fingerprint;
  document.getElementById("mode").textContent =
    m.online ? "ONLINE · L1+L2+LOCK" : "OFFLINE · L1 gate";
});

// --- 🎤 mic voice input (Chrome built-in) ---
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const rec = new SR();
  rec.lang = "si-LK";                  // සිංහල; English ඕන නම් "en-US"
  rec.interimResults = false;
  mic.onclick = () => { mic.textContent = "🔴"; rec.start(); };
  rec.onresult = e => {
    input.value = e.results[0][0].transcript;
    input.focus();
  };
  rec.onend = () => { mic.textContent = "🎤"; };
  rec.onerror = () => { mic.textContent = "🎤"; };
} else {
  mic.style.display = "none";          // Chrome නැති browser වල 🎤 hide
}

function addDiv(cls, text) {
  const d = document.createElement("div");
  d.className = cls; d.textContent = text;
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  return d;
}

function addMsg(text, who, gate, note) {
  addDiv("msg " + who, text);
  if (gate) {
    const g = document.createElement("div");
    g.className = "gate";
    if (gate.note_flag === "llm_down")
      g.innerHTML = "🛡 SILA <b>✅ clear</b> · <span class='warn'>⚠ AI service unreachable</span>";
    else if (gate.success)
      g.innerHTML = "🛡 SILA <b>✅ clear</b>";
    else
      g.innerHTML = "🛡 SILA <b>⛔ precept " + (gate.precept ?? "?") + "</b>";
    chat.appendChild(g);
  }
  if (note && note.text) addDiv("note", note.text);
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const text = input.value.trim();
  if (!text) return;
  addDiv("msg user", text);
  input.value = ""; btn.disabled = true;
  wait.style.display = "flex";          // 🪷 lotus පිපෙනවා
  try {
    const r = await fetch("/ask", {method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt: text, client_id: PID})});
    const data = await r.json();
    addMsg(data.output, "ai", {success: data.success, precept: data.gate.precept,
      note_flag: data.gate.note_flag}, data.note);
  } catch (e) {
    addDiv("msg ai", "🪷 සම්බන්ධතාවයේ දෝෂයක් — server එක ක්‍රියාත්මකද?");
  }
  wait.style.display = "none";          // 🪷 ඉවරයි
  btn.disabled = false; input.focus();
}

async function reset() {
  await fetch("/reset", {method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({client_id: PID})});
  chat.innerHTML = '<div class="msg ai">🪷 අලුත් සංවාදයක් පටන් ගමු.</div>';
}

btn.onclick = send;
input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
input.focus();
</script>
</body>
</html>"""

if __name__ == "__main__":
    import socket, uvicorn
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80)); ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    print("🪷 ප්‍රකෘති AI Chat v0.9 — " + SYSTEM_ID)
    print("   PC:    http://127.0.0.1:8000")
    print("   Phone: http://" + ip + ":8000   (same Wi-Fi)")
    uvicorn.run(app, host="0.0.0.0", port=8000)