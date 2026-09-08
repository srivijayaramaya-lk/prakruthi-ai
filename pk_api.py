# pk_api.py — ප්‍රකෘති AI v1.2: Turso DB + Accounts + Gemini Vision + Health
# v1.2.3: vision — model fallback + real error reporting
import os, re, time, hmac, hashlib, secrets
import requests as rq
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, FileResponse

TURSO_URL = (os.environ.get("TURSO_URL") or "").replace("libsql://", "https://").rstrip("/")
TURSO_KEY = os.environ.get("TURSO_KEY") or ""
GEMINI_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
V_MODEL = os.environ.get("PK_VISION_MODEL") or "gemini-2.0-flash"

pk_router = APIRouter()

# ---------- Turso (cloud SQLite) helpers ----------
def _args(vals):
    out = []
    for v in vals:
        out.append({"type": "integer", "value": str(v)} if isinstance(v, int)
                   else {"type": "text", "value": str(v)})
    return out

def _cell(c):
    if isinstance(c, dict):
        v = c.get("value")
        if v is None:
            return None
        t = c.get("type")
        if t == "integer":
            try: return int(v)
            except Exception: return v
        if t == "real":
            try: return float(v)
            except Exception: return v
        return v
    return c

def db_exec(sql, vals=None, rows=False):
    if not (TURSO_URL and TURSO_KEY):
        raise RuntimeError("TURSO_URL / TURSO_KEY Render env එකේ නෑ")
    body = {"requests": [
        {"type": "execute", "stmt": {"sql": sql, "args": _args(vals or [])}},
        {"type": "close"}]}
    try:
        r = rq.post(TURSO_URL + "/v2/pipeline", json=body,
                    headers={"Authorization": "Bearer " + TURSO_KEY}, timeout=15)
        r.raise_for_status()
        res = r.json()["results"][0]
    except Exception as e:
        print("[pk] db_exec:", sql[:60], "->", e)
        raise
    if res.get("type") == "error":
        print("[pk] sql error:", res.get("error"))
        raise RuntimeError(str(res.get("error")))
    if not rows:
        return []
    result = (res.get("response") or {}).get("result") or {}
    cols = [c["name"] for c in result.get("cols", [])]
    return [{cols[i]: _cell(row[i]) for i in range(min(len(cols), len(row)))}
            for row in result.get("rows", [])]

SCHEMA = [
    "CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, created INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, ts INTEGER NOT NULL)",
]
try:
    for s in SCHEMA:
        db_exec(s)
    print("[pk] Turso OK ✓")
except Exception as e:
    print("[pk] Turso init failed:", e)

# ---------- passwords ----------
def hash_pw(pw, salt=None):
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 60000)
    return salt + "$" + dk.hex()

def check_pw(pw, stored):
    try:
        return hmac.compare_digest(hash_pw(pw, stored.split("$", 1)[0]), stored)
    except Exception:
        return False

def current_user(req):
    tok = (req.headers.get("authorization") or "").replace("Bearer ", "").strip()
    if not tok:
        return None, None
    s = db_exec("SELECT user_id FROM sessions WHERE token=?", [tok], rows=True)
    if not s:
        return None, None
    u = db_exec("SELECT id, username FROM users WHERE id=?", [int(s[0]["user_id"])], rows=True)
    return (tok, u[0]) if u else (None, None)

def j(data, code=200):
    return JSONResponse(data, status_code=code)

# ---------- health ----------
@pk_router.get("/api/pk_health")
def health():
    return {"ok": True, "db": bool(TURSO_URL and TURSO_KEY)}

# ---------- accounts ----------
@pk_router.post("/api/register")
async def register(req: Request):
    try:
        b = await req.json()
        name = str(b.get("username") or "").strip()
        pw = str(b.get("password") or "")
        if not re.fullmatch(r"[A-Za-z0-9_]{3,20}", name):
            return j({"error": "Username: අකුරු 3-20 (a-z, 0-9, _)"}, 400)
        if len(pw) < 6:
            return j({"error": "Password අකුරු 6කට වැඩි වෙන්න"}, 400)
        if db_exec("SELECT id FROM users WHERE username=?", [name], rows=True):
            return j({"error": "මේ username දැනටමත් තියෙනවා"}, 409)
        db_exec("INSERT INTO users(username,pass,created) VALUES(?,?,?)",
                [name, hash_pw(pw), int(time.time() * 1000)])
        uid = int(db_exec("SELECT id FROM users WHERE username=?", [name], rows=True)[0]["id"])
        tok = secrets.token_hex(24)
        db_exec("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)",
                [tok, uid, int(time.time() * 1000)])
        return j({"ok": True, "token": tok, "username": name})
    except Exception as e:
        print("[pk] register error:", e)
        return j({"error": "server error — නැවත උත්සාහ කරන්න"}, 500)

@pk_router.post("/api/login")
async def login(req: Request):
    try:
        b = await req.json()
        name = str(b.get("username") or "").strip()
        rows = db_exec("SELECT * FROM users WHERE username=?", [name], rows=True)
        if not rows or not check_pw(str(b.get("password") or ""), str(rows[0]["pass"])):
            return j({"error": "Username හෝ password වැරදියි"}, 401)
        tok = secrets.token_hex(24)
        db_exec("INSERT INTO sessions(token,user_id,created) VALUES(?,?,?)",
                [tok, int(rows[0]["id"]), int(time.time() * 1000)])
        return j({"ok": True, "token": tok, "username": name})
    except Exception as e:
        print("[pk] login error:", e)
        return j({"error": "server error — නැවත උත්සාහ කරන්න"}, 500)

@pk_router.post("/api/logout")
async def logout(req: Request):
    t, _ = current_user(req)
    if t:
        db_exec("DELETE FROM sessions WHERE token=?", [t])
    return j({"ok": True})

@pk_router.get("/api/history")
async def hist_get(req: Request):
    t, u = current_user(req)
    if not u:
        return j({"error": "login වෙන්න"}, 401)
    items = db_exec("SELECT role,text,ts FROM history WHERE user_id=? ORDER BY ts DESC LIMIT 200",
                    [int(u["id"])], rows=True)
    return j({"ok": True, "items": list(reversed(items))})

@pk_router.post("/api/history")
async def hist_add(req: Request):
    t, u = current_user(req)
    if not u:
        return j({"ok": False}, 401)
    b = await req.json()
    text = str(b.get("text") or "").strip()[:2000]
    if text:
        db_exec("INSERT INTO history(user_id,role,text,ts) VALUES(?,?,?,?)",
                [int(u["id"]), "u" if b.get("role") == "u" else "a", text, int(b.get("ts") or time.time() * 1000)])
        db_exec("DELETE FROM history WHERE user_id=? AND id NOT IN (SELECT id FROM history WHERE user_id=? ORDER BY id DESC LIMIT 500)",
                [int(u["id"]), int(u["id"])])
    return j({"ok": True})

@pk_router.delete("/api/history")
async def hist_del(req: Request):
    t, u = current_user(req)
    if u:
        db_exec("DELETE FROM history WHERE user_id=?", [int(u["id"])])
    return j({"ok": True})

# ---------- Gemini Vision (📷) — model fallback + real errors ----------
VISION_PROMPT = ("You are ප්‍රකෘති AI, a warm helpful Sinhala assistant. The user sent a photo. "
                 "Look carefully and answer in natural Sinhala (technical terms may stay English). "
                 "Friendly, safe, concise.")

@pk_router.post("/api/vision")
async def vision(req: Request):
    b = await req.json()
    img = str(b.get("image") or "")
    msg = str(b.get("message") or "").strip()[:1000] or "මේ මොකක්ද?"
    m = re.match(r"^data:(image/(?:png|jpe?g|webp));base64,(.+)$", img, re.S)
    if not m:
        return j({"error": "පින්තූරය වැරදියි"}, 400)
    if not GEMINI_KEY:
        return j({"error": "GEMINI_API_KEY Render env එකේ නෑ"}, 500)
    body = {"contents": [{"role": "user", "parts": [
        {"text": VISION_PROMPT}, {"text": msg},
        {"inline_data": {"mime_type": m.group(1), "data": m.group(2)}}]}]}
    tried, last_err = [], ""
    for model in [V_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"]:
        if model in tried:
            continue
        tried.append(model)
        try:
            r = rq.post("https://generativelanguage.googleapis.com/v1beta/models/" + model +
                        ":generateContent?key=" + GEMINI_KEY, json=body, timeout=60)
            d = r.json()
            if r.status_code != 200:
                last_err = model + " HTTP" + str(r.status_code) + ": " + \
                    str((d.get("error") or {}).get("message") or d)[:140]
                print("[pk] vision", last_err)
                continue
            cand = (d.get("candidates") or [{}])[0]
            parts = (cand.get("content") or {}).get("parts") or []
            reply = "".join(p.get("text", "") for p in parts).strip()
            if reply:
                t, u = current_user(req)
                if u:
                    ts = int(time.time() * 1000)
                    db_exec("INSERT INTO history(user_id,role,text,ts) VALUES(?,?,?,?)",
                            [int(u["id"]), "u", msg, ts])
                    db_exec("INSERT INTO history(user_id,role,text,ts) VALUES(?,?,?,?)",
                            [int(u["id"]), "a", reply[:2000], ts])
                return j({"ok": True, "reply": reply, "model": model})
            last_err = model + " empty (finish=" + str(cand.get("finishReason")) + ")"
            print("[pk] vision", last_err)
        except Exception as e:
            last_err = model + " " + str(e)[:120]
            print("[pk] vision", last_err)
    return j({"error": "Vision fail — " + last_err}, 502)

# ---------- pk_v12.js serve ----------
@pk_router.get("/pk_v12.js")
def pk_v12_js():
    return FileResponse(os.path.join(os.path.dirname(__file__), "pk_v12.js"),
                        media_type="application/javascript")