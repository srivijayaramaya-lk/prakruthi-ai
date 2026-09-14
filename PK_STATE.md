✅ **නියමයි!** PK_STATE.md හැදිලා තියෙනවා (Explorer එකේ පේනවා, හිස් file එකක්). දැන් මේ content එක දෙන්නම් — මම කලින් version එක **අලුත් දැනුමෙන් update කරලා** තියෙනවා (හාමුදුරුවන්ගේ පොත, data progress, අලුත් නීති).

පහළ box එකේ **දකුණු උඩ corner එකේ copy button එක** තියෙනවා — ඒක click කරන්න (අතින් select කරන්න ඕන නෑ, වැරදෙන්නත් බෑ):

```markdown
# PK_STATE.md — ප්‍රකෘති AI Project State
# Purpose: Any new AI session reads this file and continues the project seamlessly.
# Last updated: 2026-09-14

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

## 3. Current stack & architecture
- Backend: chat_server.py (FastAPI) + pk_api.py (all v1.2+ API routes)
- DB tables (Turso): users, sessions, history, contexts
- AI: Gemini API (GEMINI_API_KEY env) — chat via sila/ engine chain,
  vision via /api/vision with model fallback list
- Frontend: CHAT_HTML inline in chat_server.py + pk_features.js (UI pack)
  + pk_v12.js (v1.3.2 client: vision, photo memory, TTS, account sync,
  context cloud sync, wake screen, keep-alive pings)
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
- Keep-alive: /api/pk_health returns {"ok":true,"db":true}

## 7. CURRENT WORK — Dhamma Knowledge Base (Tier 2-C) — IN PROGRESS
Goal: Prakruthi AI answers dhamma questions using the OWNER'S OWN content,
not generic Gemini knowledge.

### 7a. Data sources & ATTRIBUTION (respectful, mandatory):
- wisdom_items (~1000): compiled by the OWNER from
  (1) YouTube sermons of දේවනන්ද හාමුදුරුවන් and
  (2) the book "සමස්ත සිතුවම" by කොස්වත්තේ අරියවිමල හාමුදුරුවන්.
  Format: {"id", "topic", "reflection"}. Items 1-941 delivered via old chat
  (lost with chat history — see 7c for recovery). Items 942-1000 pending.
- Book chapters: "ප්‍රඥාප්‍රදීපිකා" (පරිව්‍රාජක ධම්මපාල හිමි) —
  format: {"id", "title", "content", "keywords"}, 23 chapters, parts pending.
- Future books (owner will provide files): භාවවිවේක, මූලමාධ්‍යමිකකාරිකා,
  ස්වාතන්ත්‍රික සම්ප්‍රදාය, අභිධර්මාර්ථ ප්‍රදීපිකා.
  All books teach the same core Buddha-dhamma (owner's view: same teaching,
  different analytical depth). Tibetan/Chinese translations: noted for
  future registry, not required now.
- AI replies MUST cite: book title + author monk's name + chapter.
  AI never claims authorship of dhamma.

### 7b. Planned structure:
knowledge/
  books.json        (registry: title, author, description)
  wisdom_items.json (~1000 quotes)
  chapters/         (per-book chapter JSON files)
Server loads at startup; search matches user question → keywords/topic;
matched passages injected into Gemini prompt as "owner's teacher's words";
SILA safety chain stays ON TOP unchanged.
Plan levels 1→4 (discovery, acceptance, insight, grounded action) AFTER
knowledge base works.

### 7c. DATA RECOVERY — IMPORTANT:
Owner pasted wisdom_items 1-941 (4 parts) + chapter samples into a previous
chat (z.ai) which then blocked/died. Content is LOST from chat but the
owner still HAS the source files on his PC (Philos project + pastes).
Rule discovered: NEVER accept large data pastes in chat again.
Instead: owner copies files directly in VS Code / Windows Explorer into
knowledge/ folder → commit → Sync. AI never needs to see full content —
verify via counts only (e.g. /api/knowledge_stats endpoint returning
{"wisdom": 1000, "chapters": 23}).

## 8. Roadmap (next work, in order)
1. Owner creates knowledge/ folder + copies data files into it (owner does
   file moves, AI writes code).
2. AI writes server code: knowledge loader + search + prompt injection.
3. Test: ask a dhamma question → answer cites සමස්ත සිතුවම / ප්‍රඥාප්‍රදීපිකා.
4. Level logic 1→4 on top of knowledge base.
5. Tier 3 (later): avatar/video UI (Rive), offline mode (blocked until
   Sinhala-capable on-device models exist).

## 9. Gotchas / lessons learned (do not repeat)
- NEVER paste large data (>50KB) into chat — chats die mid-session. Move
  files via repo instead (see 7c).
- Render free tier sleeps after 15 min → PWABuilder can false-fail
  "manifest missing" → wake app first, re-run.
- Find&Replace: use per-file Ctrl+H only, never Ctrl+Shift+H across all
  files (owner once broke gemini.py). Prefer full-file paste.
- CHAT_HTML in chat_server.py holds the whole frontend; PWA <link> tags
  go in <head> only.
- Chat input selector: "textarea, input[type='text'], input:not([type])"
  (plain "input" catches hidden file inputs).
- Browser caches pk_v12.js → Ctrl+Shift+R after deploys.
- Function names: /manifest (SILA) vs /manifest.json (PWA) — keep distinct.
- git: commit → Sync; discard changes for un-committed mistakes; Render
  Rollback for deployed mistakes.

## 10. How to continue in a NEW chat session (instructions for the AI)
1. Read this file fully. You now know the project.
2. Communicate in Sinhala, simple steps, one action per message, ask for
   screenshots when stuck. Owner is a beginner — never dump multi-step
   instructions at once.
3. Never put secrets in repo or chat. Turso token was exposed once and
   rotated — remind to rotate again before public launch.
4. Current task: see section 7 and 8 — continue from there.
5. After finishing work: update this file's "Last updated" date and
   roadmap, ask owner to commit.
```


11. Blocked / deferred features & WHY (do not attempt now)
Offline on-device AI (Gemma / Gemini Nano): models are 2-4GB, flagshipphones only, and Sinhala quality in small models is very poor — fatalflaw for a Sinhala-first app. Revisit ONLY when Sinhala-capable smallmodels exist.
Offline Sinhala TTS: no good offline Sinhala voice exists (even GoogleTTS has no Sinhala). Current voice output uses online speechSynthesis.
ML Kit on-device translation: Sinhala is NOT in its supported list.
Flutter rewrite: NOT planned. Working app exists — never rewrite workingsoftware from scratch. Improve it instead.
Rive avatar / lip-sync: possible but a big separate project — Tier 3.
Architecture note: server engine chain is designed so a future on-deviceengine could replace cloud AI without changing the rest of the app.
12. Recovery message (for a NEW chat when blocked)
"මම ප්‍රකෘති AI project එකක් හදනවා. Project state file එක මෙතන:https://github.com/srivijayaramaya-lk/prakruthi-ai/blob/main/PK_STATE.mdමේක කියවලා, section 8 roadmap එකේ ඊළඟ පියවරෙන් දිගටම කරන්න.මට සිංහලෙන්, පියවරෙන් පියවර කියන්න."

