# pk_knowledge.py — Dhamma Knowledge Engine (Tier 2-C)
# Loads knowledge/*.json, searches user questions, builds
# attributed context for the Gemini prompt. v1.4.0

import json, os, re

_KB = {"wisdom": [], "chapters": [], "sources": {}}


def _load_json(name):
    try:
        p = os.path.join(os.path.dirname(__file__), "knowledge", name)
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print("[pk-kb] load fail:", name, str(e)[:100])
        return None


def kb_load():
    d = _load_json("wisdom_data.json")
    if isinstance(d, dict) and isinstance(d.get("wisdom_items"), list):
        _KB["wisdom"] = d["wisdom_items"]
    elif isinstance(d, list):
        _KB["wisdom"] = d
    d2 = _load_json("samasta_situvama.json")
    if isinstance(d2, list):
        _KB["chapters"] = d2
    elif isinstance(d2, dict) and isinstance(d2.get("chapters"), list):
        _KB["chapters"] = d2["chapters"]
    d3 = _load_json("sources.json")
    if isinstance(d3, dict):
        _KB["sources"] = d3
    print(f"[pk-kb] loaded: wisdom={len(_KB['wisdom'])} "
          f"chapters={len(_KB['chapters'])} "
          f"sources={'ok' if _KB['sources'] else 'none'}")


def _tokens(text):
    return [t for t in re.split(r"[\s,.;:!?()\"'\u201c\u201d\u2018\u2019]+",
                                (text or "").lower()) if len(t) >= 3]


def kb_search(query, limit=4):
    """Top matched wisdom items + chapters for a user query."""
    q = set(_tokens(query))
    if not q:
        return [], []
    sw, sc = [], []
    for it in _KB["wisdom"]:
        hay = set(_tokens((it.get("topic") or "") + " " +
                          (it.get("reflection") or "")))
        n = len(q & hay)
        if n > 0:
            sw.append((n, it))
    for ch in _KB["chapters"]:
        kws = " ".join(ch.get("keywords") or [])
        hay = set(_tokens((ch.get("title") or "") + " " + kws + " " +
                          (ch.get("content") or "")))
        n = len(q & hay) + len(q & set(_tokens(kws))) * 3
        if n > 0:
            sc.append((n, ch))
    sw.sort(key=lambda x: -x[0])
    sc.sort(key=lambda x: -x[0])
    return [it for _, it in sw[:limit]], [c for _, c in sc[:limit]]


def _book_info(title):
    books = (_KB["sources"].get("books") or []) if _KB["sources"] else []
    for b in books:
        if b.get("title") and b["title"] in (title or ""):
            return b
    return None


def kb_context(query, max_chars=4500):
    """Attributed Sinhala context block for Gemini. '' if no match."""
    wis, chs = kb_search(query)
    if not wis and not chs:
        return ""
    parts = [
        "පහත දැක්වෙන්නේ මෙම app එකේ අයිතිකරුගේ ගුරු හිමිවරුන්ගේ "
        "(කොස්වත්තේ අරියවිමල හිමි, දේවනන්ද හාමුදුරුවන්, "
        "පරිව්\u200dරාජක ධම්මපාල හිමි) ධර්ම දේශනා සහ පොත්වලින් ගත් කොටස්."
        " පිළිතුරු දෙන විට: (1) මේ මූලාශ\u200d්‍ර මූලික කරගන්න. "
        "(2) ඒවායින් උපුටා දක්වන කරුණු අවසානයේ 📖 මූලාශ\u200d්‍රය "
        "(පොත/දේශනාව + හිමිනම්) සඳහන් කරන්න. "
        "(3) ඔබ කිසිදා මෙම දහම් කතෘ ලෙස හඳුන්වා නොගන්න. "
        "(4) link එකක් තියෙනවා නම් 🔗 වැඩිදුර අධ\u200d්‍යයනයට දෙන්න."
    ]
    for it in wis:
        parts.append(f"【ධර්ම කරුණ — {it.get('topic', '')}】\n"
                     f"{it.get('reflection', '')}")
    for ch in chs:
        b = _book_info("සමස්ත සිතුවම")
        name = (b or {}).get("title") or "සමස්ත සිතුවම"
        author = (b or {}).get("author") or ""
        url = (b or {}).get("url") or ""
        src = f"📖 {name}" + (f" — {author}" if author else "")
        link = f" | 🔗 වැඩිදුර: {url}" if url else ""
        content = (ch.get("content") or "")[:1200]
        parts.append(f"【{src} · {ch.get('title', '')}】{link}\n{content}")
    return "\n\n".join(parts)[:max_chars]