# PK_STATE.md — ප්‍රකෘති AI Project State
# Purpose: Any new AI session reads this file and continues the project seamlessly.
# Last updated: 2026-09-16

## 1. What is this project?
"ප්‍රකෘති AI" (Prakruthi AI) — a Sinhala-first AI chat web app + Android APK,
built on a Buddhist-ethics safety framework ("SILA") created by the owner
(GitHub user: srivijayaramaya-lk). The owner is a beginner — ALL code is
written by AI assistants; owner does clicks/testing only. Communicate with
the owner in Sinhala, step-by-step, one small action at a time.

## 1b. FIX PROTOCOL (owner rule since 2026-09-16 — IMPORTANT for any AI)
When the owner reports an app problem, FIRST classify it:
- INSTANCE issue (one message/one place wrong) → small targeted fix, OK.
- ROOT issue (wrong BEHAVIOR TYPE everywhere, e.g. "every question gets
  dhamma-mixed answers") → DO NOT patch instances. Fix the DECISION LAYER
  (the rule that causes it), then run the STANDARD TEST 3 (below) before
  shipping. The owner explicitly asked for root fixes over repeated
  patches. Also: do not "stop this one instance" — fix the class.
STANDARD TEST 3 after any brain/engine change:
  1) tech/code question → must answer the question itself (no dhamma mix)
  2) health/illness question → practical advice itself (no dhamma mix)
  3) dhamma question → dhamma answer path
  Plus whenever SILA could be affected: "kill someone" must stay BLOCKED.

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
- Knowledge engine: pk_knowledge.py — kb_load / kb_search / kb_context.
  v1.9: BOOK INJECTION PAUSED at top of kb_context (owner decision —
  `return ""` with comment; the injection code below is intact and can be
  re-enabled by removing that return). SILA untouched.
- Face engine: pk_avatar.js (v1.8) — "ප්‍රකෘති මුහුණ": OWNER'S OWN
  pencil-sketch portrait (face_base.png, committed — owner chose public)
  animated on canvas via pixel-shift (soft-masked patches). Breathing +
  blinking + think micro-bob + talks (Sinhala visemes) on reply + smile.
  Self-contained fetch wrapper; served via /pk_avatar.js route +
  @app.get("/face_base.png") in chat_server.py.
  Embedded calibration: eyes l(0.586,0.545) r(0.343,0.550) w(0.151);
  mouth l(0.379,0.817) r(0.567,0.817); lid #f0eae0.
- APPAMADA badge (🌸 small mindfulness note under replies) — KEPT on
  purpose (owner decision 2026-09-16): it is one gentle line, not an
  injection; lives in the sila layer, not in knowledge.
- DB tables (Turso): users, sessions, history, contexts
- AI: Gemini API (GEMINI_API_KEY env) — chat via sila/ engine chain,
  vision via /api/vision with model fallback list
- Frontend: CHAT_HTML inline in chat_server.py + pk_features.js + pk_v12.js
  + pk_avatar.js (v1.8 sketch face)
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
Big/risky changes: commit a CHECKPOINT first (restore point), then edit,
then deploy + STANDARD TEST 3.

## 6. Versions shipped (all working)
- v1.2: Turso cloud DB, accounts + multi-device history sync, Gemini vision
  (Sinhala), PWA, signed Android APK, iOS home-screen
- v1.3: photo memory; v1.3.1: voice output; v1.3.2: context folders cloud
- v1.4: dhamma knowledge engine (data + search + injection + attribution)
- v1.5: level logic 1→4; v1.5.1: SILA lock scans only user words (fix)
- v1.6/1.6.1: green face avatar (RETIRED in v1.8)
- v1.6.2/1.6.3: /api/knowledge_stats verification endpoint (accurate)
- v1.7: further-reading links for non-dhamma questions (safe search-page
  URLs: YouTube results + Sinhala Wikipedia; no invented links; skip on
  small talk; spelling fix allowed inside topic words, URL shape fixed)
- v1.8: ප්‍රකෘති මුහුණ — owner's pencil-sketch face (canvas pixel-shift:
  breathing, blinking, corner-stretch talking, smile; test-lab developed,
  embedded calibration). Verified live.
- v1.9: BOOK INJECTION PAUSED (owner decision — root fix for "every
  question gets book/dhamma-mixed answers with forced name attribution").
  Now: code→code, illness→advice, dhamma→dhamma (without book quotes).
  SILA verified still blocking. Appamada badge KEPT (owner choice).
  Data files stay in knowledge/ untouched; re-enable = remove the return ""
  at top of kb_context in pk_knowledge.py.
- Keep-alive: /api/pk_health returns {"ok":true,"db":true}

## 7. Knowledge base — DATA COMPLETE, ENGINE PAUSED
- /api/knowledge_stats → {"wisdom":1000,"chapters":249,"sources":6}
- wisdom_data.json ({"wisdom_items":[...]}, items 1–1000),
  samasta_situvama.json (249 passages), sources.json (6) — all intact in
  knowledge/ (NOT deleted; only injection is off).
- Why paused: keyword search gave "matches" for every question (low-quality
  gate), causing forced dhamma framing + name attribution on unrelated
  questions — the owner called this unacceptable (wrong answers + forced
  attribution). A word-list gate was REJECTED by owner (words like
  ධර්ම/සසර/මෙත්තා appear in songs and names — too fragile).
- Future (idea only): re-enable with a smarter relevance gate (e.g. better
  scoring, minimum thresholds, or AI-judged relevance) — owner must approve
  design first. Attribution rules must stay: book title + author monk +
  chapter; AI never claims dhamma authorship.
- DATA RULE: NEVER accept large data pastes in chat. Verify via
  /api/knowledge_stats counts only.

## 8. Roadmap (next work, in order)
1. ✅ v1.9 done — answer behavior corrected (root fix), SILA verified
2. Use the app normally for some days; collect real examples of any
   remaining wrong behaviors (with screenshots)
3. Then decide with owner: (a) smarter knowledge re-enable design,
   (b) face polish, (c) future books data, (d) public-launch prep
   (rotate Turso token, README), (e) Tier 3 Rive 3D avatar

## 8b. IDEAS / open questions (NOT decided — owner may change freely)
- IDEA-1: dhamma answers getting further-reading links too? (undecided)
- IDEA-2: smarter knowledge gate design for re-enabling books (see §7)
- IDEA-3: sources.json channels/playlists/videos dormant — sermon links
  in dhamma answers someday
- IDEA-4: face learnings (test lab v1–v11): pixel-shift patches + soft
  masks + blur = working technique; corner-stretch primary motion; vowel
  holds + rhythm jitter + head micro-bob; NO dark shade line in mouth
  (owner rejected); NO cartoon overlays (owner rejected). Calibration via
  test lab's 📋 copy button (test_avatar.html stays LOCAL via .gitignore).
- IDEA-5: smile could become sentiment-driven in app later.

## 9. Gotchas / lessons learned (do not repeat)
- INSTANCE vs ROOT: never fix behavior-class problems by patching single
  instances; fix the decision layer + STANDARD TEST 3 (owner's rule).
- Low-quality "matches" are worse than no matches: without a relevance
  gate, keyword search forces wrong framing on every question.
- Word-list gates for Sinhala dhamma detection are fragile (same words in
  songs/names) — owner rejected that approach.
- NEVER paste large data (>50KB) into chat — move files via repo.
- SILA lock scans ONLY user input (+ history), NEVER injected text.
- Face/Avatar js must be self-contained; never edit CHAT_HTML or other js.
- NEVER create a .js file containing HTML (past mistakes: 170 errors).
- Video files cannot be sent to chat — record, pause on frame, screenshot.
- Render free tier sleeps after 15 min → wake app before PWABuilder runs.
- Find&Replace: per-file Ctrl+H only; prefer full-file paste or exact
  single-line replace (Home → Shift+End).
- CHAT_HTML in chat_server.py holds the whole frontend; PWA <link> tags
  go in <head> only.
- Browser caches pk_v12.js / pk_avatar.js / face_base.png → Ctrl+Shift+R.
- /manifest (SILA) vs /manifest.json (PWA) — keep distinct.
- git: checkpoint commit before risky changes; Render Rollback for
  deployed mistakes; VS Code search shows docs matches too — real tests
  happen in the live app.
- debug_l1.py: dev debug script (harmless — can stay or delete later).

## 10. How to continue in a NEW chat session (instructions for the AI)
1. Read this file fully. You now know the project.
2. Communicate in Sinhala, simple steps, one action per message, ask for
   screenshots when stuck. Owner is a beginner — never dump multi-step
   instructions at once.
3. Follow section 1b FIX PROTOCOL for any reported problem.
4. Never put secrets in repo or chat. Turso token rotated once — remind to
   rotate again before public launch.
5. Current task: see section 8 — owner using app, collecting examples.
6. After finishing work: update this file's "Last updated" date and
   roadmap, ask owner to commit.

## 11. Blocked / deferred features & WHY (do not attempt now)
- Offline on-device AI (Gemma / Gemini Nano): 2-4GB models, flagship
  phones only, poor Sinhala — fatal for a Sinhala-first app. Revisit only
  when Sinhala-capable small models exist.
- Offline Sinhala TTS: no good offline Sinhala voice exists.
- ML Kit on-device translation: Sinhala NOT supported.
- Flutter rewrite: NOT planned — never rewrite working software.
- Rive avatar / lip-sync: Tier 3. NOTE: v1.8 canvas face already gives
  approximate lip-sync — Rive only if owner wants full 3D.
- Book injection re-enable: needs owner-approved smarter gate design first
  (see §7) — do NOT just flip it back on.
- Architecture note: server engine chain is designed so a future on-device
  engine could replace cloud AI without changing the rest of the app.

## 12. Recovery message (for a NEW chat when blocked)
"මම ප්‍රකෘති AI project එකක් හදනවා. Project state file එක මෙතන:
https://github.com/srivijayaramaya-lk/prakruthi-ai/blob/main/PK_STATE.md
මේක කියවලා, section 8 roadmap එකේ ඊළඟ පියවරෙන් දිගටම කරන්න.
මට සිංහලෙන්, පියවරෙන් පියවර කියන්න."