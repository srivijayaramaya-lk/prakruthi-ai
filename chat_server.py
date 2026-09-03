#!/usr/bin/env python3
"""ප්‍රකෘති AI — Chat Server (v0.6). Run: python chat_server.py
Offline: gate demo එක | OPENAI_API_KEY තියෙනවා නම්: real answers + L2 judge."""
import os, sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from prakruthi import REFUSALS, audit, llm_offline, ENGINE_OK, CONSTITUTION
from sila.engine import validate_execution, detect_language, SYSTEM_ID
from sila.judge import judge
from sila.handshake import MANIFEST, manifest_fingerprint

app = FastAPI(title="Prakruthi AI Chat")

HISTORY = []          # single-user demo chat memory
MAX_HISTORY = 10      # LLM එකට යන messages ගණන

def llm_chat(messages):
    from openai import OpenAI
    client = OpenAI()
    return client.chat.completions.create(
        model=os.environ.get("PRAKRUTHI_MODEL", "gpt-4o-mini"),
        messages=messages).choices[0].message.content

def chat_pipeline(prompt):
    lang = detect_language(prompt)
    def refusal(key):
        return REFUSALS.get(lang, REFUSALS["en"])[key]
    # 1) L1 input gate
    r1 = validate_execution(prompt, "L1-in")
    if not r1.is_safe:
        key = "X3" if r1.rule == "X.3-injection" else r1.violated_precept
        audit({"event": "BLOCK", "layer": "L1-input", "input": prompt,
               "precept": r1.violated_precept, "lang": lang, "src": "chat"})
        return {"success": False, "output": refusal(key),
                "gate": {"precept": r1.violated_precept, "lang": lang}}
    # 2) L2 semantic judge (online only)
    v = judge(prompt)
    if v["verdict"] == "BLOCK":
        audit({"event": "BLOCK", "layer": "L2", "input": prompt,
               "reason": v.get("reason"), "lang": lang, "src": "chat"})
        return {"success": False, "output": refusal(v.get("precept") or 1),
                "gate": {"precept": v.get("precept") or 1, "lang": lang}}
    # 3) inference (history එකත් එක්ක)
    online = bool(os.environ.get("OPENAI_API_KEY"))
    if online:
        messages = ([{"role": "system", "content": CONSTITUTION}]
                    + HISTORY[-MAX_HISTORY * 2:]
                    + [{"role": "user", "content": prompt}])
        out = llm_chat(messages)
    else:
        out = llm_offline(prompt)
    # 4) L1 output gate
    r2 = validate_execution(out, "L1-out")
    if not r2.is_safe:
        audit({"event": "BLOCK", "layer": "L1-output",
               "precept": r2.violated_precept, "src": "chat"})
        return {"success": False,
                "output": "🪷 [SILA] මගේ පිළිතුර තුළ අවශ්‍ය නැති දෙයක් තිබුණා — suppressed.",
                "gate": {"precept": r2.violated_precept, "lang": lang}}
    audit({"event": "OK", "input": prompt, "src": "chat"})
    if online:
        HISTORY.append({"role": "user", "content": prompt})
        HISTORY.append({"role": "assistant", "content": out})
    return {"success": True, "output": out,
            "gate": {"precept": None, "lang": lang}}

class Ask(BaseModel):
    prompt: str

@app.post("/ask")
def ask(a: Ask):
    try:
        return chat_pipeline(a.prompt)
    except Exception as e:
        try:
            audit({"event": "ERROR", "error": repr(e), "input": a.prompt, "src": "chat"})
        except Exception:
            pass
        lang = detect_language(a.prompt)
        return {"success": False, "output": REFUSALS.get(lang, REFUSALS["en"])["SAFE"],
                "gate": {"precept": None, "lang": lang}}

@app.post("/reset")
def reset():
    HISTORY.clear()
    return {"ok": True}

@app.get("/manifest")
def manifest():
    return {"manifest": MANIFEST, "fingerprint": manifest_fingerprint(),
            "engine_ok": ENGINE_OK, "online": bool(os.environ.get("OPENAI_API_KEY"))}

@app.get("/", response_class=HTMLResponse)
def home():
    return CHAT_HTML

CHAT_HTML = """<!DOCTYPE html>
<html lang="si">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prakruthi AI</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI','Nirmala UI',sans-serif;
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
  footer { padding: 10px; background: #fafafa; border-top: 1px solid #eee;
           display: flex; gap: 8px; }
  input { flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 10px;
          font-size: 15px; outline: none; }
  input:focus { border-color: #1b5e20; }
  button { padding: 12px 18px; background: #1b5e20; color: #fff; border: none;
           border-radius: 10px; font-size: 15px; cursor: pointer; }
  button:disabled { opacity: .5; }
  .typing { color: #999; font-style: italic; }
</style>
</head>
<body>
<div class="app">
  <header>
    <h1>🪷 ප්‍රකෘති AI <button onclick="reset()" style="padding:4px 10px;font-size:13px;background:rgba(255,255,255,.15)">🧹</button></h1>
    <div class="sub"><span class="badge" id="mode">…</span> SILA <span id="fp"></span></div>
  </header>
  <div id="chat">
    <div class="msg ai">සාදරයෙන් පිළිගනිමු! 🪷 මම ප්‍රකෘති AI — මගේ ප්‍රකෘතිය සීලයයි. ඕනෑම ප්‍රශ්නයක් අහන්න.</div>
  </div>
  <footer>
    <input id="in" placeholder="ඔබේ පණිවිඩය..." autocomplete="off">
    <button id="send">යවන්න</button>
  </footer>
</div>
<script>
const chat = document.getElementById("chat");
const input = document.getElementById("in");
const btn = document.getElementById("send");

fetch("/manifest").then(r => r.json()).then(m => {
  document.getElementById("fp").textContent = m.fingerprint;
  document.getElementById("mode").textContent =
    m.online ? "ONLINE · L1+L2" : "OFFLINE · L1 gate";
});

function addMsg(text, who, gate) {
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.textContent = text;
  chat.appendChild(d);
  if (gate) {
    const g = document.createElement("div");
    g.className = "gate";
    g.innerHTML = gate.success ? "🛡 SILA <b>✅ clear</b>"
      : "🛡 SILA <b>⛔ precept " + (gate.precept ?? "?") + "</b>";
    chat.appendChild(g);
  }
  chat.scrollTop = chat.scrollHeight;
}

async function send() {
  const text = input.value.trim();
  if (!text) return;
  addMsg(text, "user");
  input.value = ""; btn.disabled = true;
  const t = document.createElement("div");
  t.className = "msg ai typing"; t.textContent = "…";
  chat.appendChild(t); chat.scrollTop = chat.scrollHeight;
  try {
    const r = await fetch("/ask", {method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt: text})});
    const data = await r.json();
    t.remove();
    addMsg(data.output, "ai", {success: data.success, precept: data.gate.precept});
  } catch (e) {
    t.remove();
    addMsg("🪷 සම්බන්ධතාවයේ දෝෂයක් — server එක ක්‍රියාත්මකද?", "ai");
  }
  btn.disabled = false; input.focus();
}

async function reset() {
  await fetch("/reset", {method: "POST"});
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
    print("🪷 ප්‍රකෘති AI Chat — " + SYSTEM_ID)
    print("   PC:    http://127.0.0.1:8000")
    print("   Phone: http://" + ip + ":8000   (same Wi-Fi)")
    uvicorn.run(app, host="0.0.0.0", port=8000)