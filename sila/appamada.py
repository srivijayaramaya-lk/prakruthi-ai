"""APPAMADA — අවධානම් සිහිකැඳවීම් ස්ථරය.
මූලධර්මය: සිහිය තියෙන AI එකක් තමන් කරන වැඩේ අරමුණ මතක තියාගන්නවා.
නීතිය: දැනුම්දීමක් = මල් පහනක් වගේ — මෘදු, කලාපීය, බලහත්කාර නෑ.
නිතර වුණොත් ඒකම කලහයක් — ඉන්ද්‍රිය සංවරය (5.1) අපේම නීතිය අපිටත් බලපානවා."""
import json, pathlib, re

from .engine import detect_language

_FILE = pathlib.Path(__file__).resolve().parent.parent / "sila_appamada.json"

BACKUP = {
    "version": "0-backup", "every_n_responses": 4,
    "by_language": {
        "si": {"code": "🪷 APPAMADA — මේ කේතය භාවිතයේ අරමුණ සුබසාධනයම වේවා. පෙර පරීක්ෂාවකින් භාවිත කරන්න.",
               "general": "🪷 APPAMADA — මේ සංවාදය ඔබට ප්‍රයෝජනවත් වේවා. අවශ්‍ය නැති තැන නවතින එකත් සිහියකි."},
        "en": {"code": "🪷 APPAMADA — may this code be used only for benefit. Review before deploying.",
               "general": "🪷 APPAMADA — may this conversation serve you well. Pausing when enough is enough is also mindfulness."},
        "ta": {"code": "🪷 APPAMADA — இந்த குறியீடு நன்மைக்கே பயன்படுத்தப்பட வேண்டும்.",
               "general": "🪷 APPAMADA — இந்த உரையாடல் நன்மை அளிக்கட்டும்."}
    }
}

def _load():
    try:
        d = json.loads(_FILE.read_text(encoding="utf-8"))
        if d.get("version") and d.get("by_language"):
            return d
    except Exception:
        pass
    return BACKUP

DATA = _load()

_CODE_RX = re.compile(r"```|<html|<script|def\s+\w+\(|class\s+\w+|import\s+\w+|function\s+\w+", re.IGNORECASE)

def note_for(prompt: str, output: str, assistant_count: int):
    """assistant_count = මේ session එකේ මේක කීවෙනි AI පිළිතුරද (1-based)."""
    lang = detect_language(prompt)
    per = DATA["by_language"].get(lang) or DATA["by_language"]["en"]
    if _CODE_RX.search(output or ""):
        return {"text": per["code"], "kind": "code"}
    n = DATA.get("every_n_responses", 4)
    if assistant_count and assistant_count % n == 0:
        return {"text": per["general"], "kind": "general"}
    return None