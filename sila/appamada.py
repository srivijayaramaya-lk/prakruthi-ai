"""APPAMADA — සිහිකැඳවීම් ස්ථරය.
v0.9.3: Dharma whisper — ඒ ප්‍රශ්නයට ගැළපෙන කෙටි බුද්ධ උපදේශය
(rhythm: every_n_dharma එකට පස්සේ පමණයි — හැම පාරම නෙවෙයි).
නීතිය: මෘදු, අඩුවෙන්, බලහත්කාර නැතිව (අපේම Indriya-samvara)."""
import json, pathlib, re

from .engine import detect_language

_FILE = pathlib.Path(__file__).resolve().parent.parent / "sila_appamada.json"

BACKUP = {
    "version": "0-backup", "every_n_responses": 4, "every_n_dharma": 6,
    "dharma_whisper": True,
    "whisper_prompt": "One short (max 2 sentences) gently-appropriate Buddhist teaching "
                      "for this exact moment, in {lang}: {context}",
    "by_language": {
        "si": {"code": "🪷 APPAMADA — මේ කේතය භාවිතයේ අරමුණ සුබසාධනයම වේවා.",
               "general": "🪷 APPAMADA — අවශ්‍ය නැති තැන නවතින එකත් සිහියකි."},
        "en": {"code": "🪷 APPAMADA — may this code be used only for benefit.",
               "general": "🪷 APPAMADA — pausing when enough is enough is also mindfulness."},
        "ta": {"code": "🪷 APPAMADA — இந்த குறியீடு நன்மைக்கே.", "general": "🪷 APPAMADA — நன்மை அளிக்கட்டும்."}
    }
}

def _load():
    try:
        d = json.loads(_FILE.read_text(encoding="utf-8"))
        if d.get("version"):
            return d
    except Exception:
        pass
    return BACKUP

DATA = _load()
_CODE_RX = re.compile(r"```|<html|<script|def\s+\w+\(|class\s+\w+|function\s+\w+", re.IGNORECASE)
_LANG_NAMES = {"si": "සිංහල", "en": "English", "ta": "தமிழ்"}

def note_for(prompt, output, assistant_count):
    """L1-style notes (code/general) — කලින් වගේම."""
    lang = detect_language(prompt)
    per = DATA["by_language"].get(lang) or DATA["by_language"]["en"]
    if _CODE_RX.search(output or ""):
        return {"text": per["code"], "kind": "code"}
    n = DATA.get("every_n_responses", 4)
    if assistant_count and assistant_count % n == 0:
        return {"text": per["general"], "kind": "general"}
    return None

def dharma_whisper(prompt, output, assistant_count):
    """🪷 ඒ ප්‍රශ්නයට ගැළපෙන කෙටි බුද්ධ උපදේශය — every_n_dharma එකට පස්සේ පමණයි."""
    n = DATA.get("every_n_dharma", 6)
    if not (assistant_count and assistant_count % n == 0):
        return None                          # මේ වතාවේ whisper නෑ (rhythm එක රැකීමට)
    if not DATA.get("dharma_whisper", True):
        return None                          # JSON එකෙන් ON/OFF
    try:
        from . import gemini
        if not gemini.online():
            return None
        lang = detect_language(prompt)
        p = DATA.get("whisper_prompt", BACKUP["whisper_prompt"])
        out = gemini.chat([
            {"role": "system", "content":
             "You are a gentle Buddhist teacher. Reply ONLY with the teaching itself — "
             "max 2 short sentences, no headers, no quote marks. Warm, timeless, "
             "plain language, tied to the person's exact question/situation."},
            {"role": "user", "content":
             p.format(lang=_LANG_NAMES.get(lang, "Sinhala"),
                      context=(prompt + "\n\n(Their context: " + output[:300] + ")"))}])
        t = (out or "").strip()
        if not t:
            return None
        return {"text": "🪷 " + t, "kind": "dharma"}
    except Exception:
        return None