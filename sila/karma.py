"""KARMA_CODE — ලෝකයට අවැද දායක කේත ලේඛනාගාරය.
නීතිය: අරමුණ (purpose) නැති කේතය මෙතනට ඇතුළු වෙන්නේ නෑ.
Header ආකෘතිය (file එකේ පළවෙනි lines 10 ඇතුළේ):
    # KARMA_CODE
    # purpose: <මේක මොකටද>
    # benefit: <කාට, කොහොමද හොඳ>
    # constraints: <කිසිවිටෙක නොකළ යුතු දේ>"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "karma_code"

def parse_header(text: str):
    """KARMA_CODE header parse. None = header නෑ/purpose නෑ → පිළිගන්නේ නෑ."""
    head = text[:1000]
    if not re.search(r"#\s*KARMA_CODE\b", head):
        return None
    def grab(field):
        m = re.search(rf"#\s*{field}\s*:\s*(.+)", head, re.IGNORECASE)
        return m.group(1).strip() if m else None
    purpose = grab("purpose")
    if not purpose:
        return None
    return {"purpose": purpose,
            "benefit": grab("benefit") or "—",
            "constraints": grab("constraints") or "—"}

def list_karma_code():
    """Valid කේත list එක. Header නැති files skip වෙනවා."""
    items = []
    if not ROOT.exists():
        return items
    for p in sorted(ROOT.glob("*.py")):
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        h = parse_header(text)
        if h:
            items.append({"file": p.name, **h})
    return items