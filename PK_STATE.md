# PK_STATE.md — ප්‍රකෘති AI Project State
# Purpose: Any new AI session reads this file and continues the project seamlessly.
# Last updated: 2026-09-15

## 1. What is this project?
"ප්‍රකෘති AI" (Prakruthi AI) — a Sinhala-first AI chat web app + Android APK,
built on a Buddhist-ethics safety framework ("SILA") created by the owner
(GitHub user: srivijayaramaya-lk). The owner is a beginner — ALL code is
written by AI assistants; owner does clicks/testing only. Communicate with
the owner in Sinhala, step-by-step, one small action at a time.

## 2. Live URLs & Accounts
- App: https://prakruthi-ai.onrender.com
- GitHub repo: https://github.com/srivijayaramaya-lk/prakruthi-ai (public, main branch)
- Hosting: Render free tier (Python 3 / FastAPI / uvicorn)
- DB: Turso cloud SQLite (libsql, Mumbai region) — persists across redeploys
- Keep-alive: cron-job.org pings /api/pk_health every 10 min
- Test account: test_user / test123
- Owner's phone: iPhone (Safari Add to Home Screen); friend's phone: Android (signed APK)
- Knowledge counts: /api/knowledge_stats → {"wisdom":1000,"chapters":249,"sources":6}

## 3. Current stack & architecture
- Backend: chat_server.py (FastAPI) + pk_api.py (all v1.2+ API routes)
- Knowledge engine: pk_knowledge.py (v1.4+) — loads knowledge/ at startup,
  kb_search / kb_context, prompt injection, attribution, LEVEL LOGIC (v1.5)
- Avatar: pk_avatar.js (v1.6+) — pure CSS/JS live face "ප්‍රකෘති මුහුණ":
  breathing + random blinking + think state while /chat in flight +
  happy bounce when reply lands. Served via @app.get("/pk_avatar.js")
  route in chat_server.py + <script> tag after pk_v12.js. Self-contained
  fetch wrapper — modifies NO other file. window.PKAvatar.set('idle'|'think')
- DB tables (Turso): users, sessions, history, contexts
- AI: Gemini API (GEMINI_API_KEY env) — chat via sila/ engine chain,
  vision via /api/vision with model fallback list
- Frontend: CHAT_HTML inline in chat_server.py + pk_features.js (UI pack)
  + pk_v12.js (v1.3.2 client) + pk_avatar.js (v1.6 face)
- PWA: manifest.json, sw.js, icon-192.png, icon-512.png
- Android: PWABuilder TWA, signed, package id com.onrender.prakruthi_ai.twa;
  assetlinks.json served at /.well-known/assetlinks.json

## 4. Environment variables (Render → Environment)
- TURSO_URL, TURSO_KEY, GEMINI_API_KEY
- APK signing key: signing-key.keystore + signing-key-info.txt in owner's OneDrive. NEVER lose.

## 5. Deploy workflow
VS Code (F:\prakruthi-ai) → Source Control → commit message → Sync →
Render auto deploy → verify log "[pk] Turso OK ✓". If no auto-deploy:
Render → Manual Deploy → Deploy latest commit.

## 6. Versions shipped (all working)
- v1.2: Turso cloud DB, accounts + multi-device history sync, Gemini vision
  (Sinhala), PWA, signed Android APK, iOS home-screen
- v1.3: photo memory (5-min follow-up questions reuse photo)
- v1.3.1: voice output (TTS toggle, markdown/emoji stripped)
- v1.3.2: context folders (3 slots) cloud-persisted (GET/POST /api/contexts)
- v1.4: dhamma knowledge engine — knowledge/ data + search +
  prompt injection + attribution with links in replies (verified)
- v1.5: level logic 1→4 — auto-detects user's dhamma level from the question
  (1 curiosity / 2 acceptance / 3 insight / 4 grounded action) and changes
  answer style accordingly (verified)
- v1.5.1: SILA lock fix — lock scans ONLY user words + history, never the
  injected book text. Verified: dhamma Q passes; "kill someone" blocked.
- v1.6: avatar-lite "ප්‍රකෘති මුහුණ" — floating live face top-center,
  breathing + blinking (verified visible, does not block UI)
- v1.6.1: face reacts to chat — think while waiting, happy bounce on reply
- v1.6.2: /api/knowledge_stats endpoint (count-only verification tool;
  counts read wisdom_data.json / samasta_situvama.json / sources.json)
- v1.6.3: counter recognizes "wisdom_items" key → stats now accurate
- Keep-alive: /api/pk_health returns {"ok":true,"db":true}

## 7. Knowledge base — COMPLETE ✅ (verified 2026-09-15)
- /api/knowledge_stats → {"wisdom":1000,"chapters":249,"sources":6}
- wisdom_data.json: {"wisdom_items":[...]} — owner-compiled items 1–1000
  (from දේවනන්ද හාමුදුරුවන් sermons + "සමස්ත සිතුවම" by
  කොස්වත්තේ අරියවිමල හාමුදුරුවන්). Format: {"id","topic","reflection"}
- samasta_situvama.json: 249 passages, format {"id","title","content",
  "keywords"} (ids are strings, unordered — fine, search is keyword-based)
- sources.json: registry, 6 entries
- Attribution mandatory: book title + author monk + chapter; AI never
  claims authorship of dhamma.
- Future books (owner will provide files later): භාවවිවේක,
  මූලමාධ්‍යමිකකාරිකා, ස්වාතන්ත්‍රික සම්ප්‍රදාය, අභිධර්මාර්ථ ප්‍රදීපිකා.
  Tibetan/Chinese translations: future registry only.
- DATA RULE: NEVER accept large data pastes in chat. Owner copies files
  directly into knowledge/ via VS Code/Explorer → commit → Sync. Verify via
  /api/knowledge_stats counts only.

## 8. Roadmap (next work, in order)
1. ✅ DONE v1.4: knowledge base + injection + attribution
2. ✅ DONE v1.5 + v1.5.1: level logic 1→4 + lock fix
3. ✅ DONE v1.6 + v1.6.1: avatar-lite "ප්‍රකෘති මුහුණ"
4. ✅ DONE: knowledge data — wisdom 1000 + chapters 249 + sources 6 verified
5. NEXT: decide with owner — options: (a) future books data when provided,
   (b) Tier 3 Rive 3D avatar, (c) public-launch prep (rotate Turso token,
   README, etc.)
6. Tier 3 (later): Rive 3D avatar, offline mode

## 9. Gotchas / lessons learned (do not repeat)
- NEVER paste large data (>50KB) into chat — chats die mid-session. Move
  files via repo instead (see section 7).
- SILA lock must scan ONLY user input (+ history), NEVER injected knowledge
  text — book quotes contain sensitive-looking words; v1.5.1 fixed this.
- Avatar js must be self-contained (own CSS injection, own fetch wrapper) —
  never edit CHAT_HTML or other js files for UI add-ons.
- When writing a count/verify endpoint, first check the REAL key names in
  the data files (wisdom_data.json uses "wisdom_items" — generic guesses
  like "items" return wrong counts).
- Render free tier sleeps after 15 min → PWABuilder can false-fail
  "manifest missing" → wake app first, re-run.
- Find&Replace: use per-file Ctrl+H only, never Ctrl+Shift+H across all
  files (owner once broke gemini.py). Prefer full-file paste.
- CHAT_HTML in chat_server.py holds the whole frontend; PWA <link> tags
  go in <head> only.
- Chat input selector: "textarea, input[type='text'], input:not([type])"
  (plain "input" catches hidden file inputs).
- Browser caches pk_v12.js / pk_avatar.js → Ctrl+Shift+R after deploys.
- Function names: /manifest (SILA) vs /manifest.json (PWA) — keep distinct.
- git: commit → Sync; discard changes for un-committed mistakes; Render
  Rollback for deployed mistakes.
- debug_l1.py: dev debug script (harmless — can stay or delete later).

## 10. How to continue in a NEW chat session (instructions for the AI)
1. Read this file fully. You now know the project.
2. Communicate in Sinhala, simple steps, one action per message, ask for
   screenshots when stuck. Owner is a beginner — never dump multi-step
   instructions at once.
3. Never put secrets in repo or chat. Turso token was exposed once and
   rotated — remind to rotate again before public launch.
4. Current task: see section 8 — item 5 (decide next direction with owner).
5. After finishing work: update this file's "Last updated" date and
   roadmap, ask owner to commit.

## 11. Blocked / deferred features & WHY (do not attempt now)
- Offline on-device AI (Gemma / Gemini Nano): models are 2-4GB, flagship
  phones only, and Sinhala quality in small models is very poor — fatal
  flaw for a Sinhala-first app. Revisit ONLY when Sinhala-capable small
  models exist.
- Offline Sinhala TTS: no good offline Sinhala voice exists (even Google
  TTS has no Sinhala). Current voice output uses online speechSynthesis.
- ML Kit on-device translation: Sinhala is NOT in its supported list.
- Flutter rewrite: NOT planned. Working app exists — never rewrite working
  software from scratch. Improve it instead.
- Rive avatar / lip-sync: possible but a big separate project — Tier 3.
- Architecture note: server engine chain is designed so a future on-device
  engine could replace cloud AI without changing the rest of the app.

## 12. Recovery message (for a NEW chat when blocked)
"මම ප්‍රකෘති AI project එකක් හදනවා. Project state file එක මෙතන:
https://github.com/srivijayaramaya-lk/prakruthi-ai/blob/main/PK_STATE.md
මේක කියවලා, section 8 roadmap එකේ ඊළඟ පියවරෙන් දිගටම කරන්න.
මට සිංහලෙන්, පියවරෙන් පියවර කියන්න."