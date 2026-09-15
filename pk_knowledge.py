# pk_knowledge.py — Dhamma Knowledge Engine + Level Logic 1→4
# Loads knowledge/*.json, searches user questions, detects the dhamma
# journey level (owner's 1→4 philosophy), builds an attributed context
# block for the Gemini prompt. v1.5.0

import json, os, re

_KB = {"wisdom": [], "chapters": [], "sources": {}}

# ---------- dhamma journey levels (owner's philosophy) ----------
# 1 discovery · 2 acceptance · 3 insight · 4 grounded action
LEVEL_GUIDE = {
    1: "මෙම user දැන් ධර්ම ගමනේ 1 වන මට්ටමේ (කුතුහලය — සොයාගැනීම) සිටියි. "
       "උත්තරය කෙටි හා සරල කරන්න. එක පැහැදිලි අදහසක් පමණයි. "
       "පාලි වචන වැඩියෙන් එපා. අවසානයේ කුතුහලය අවදි කරන මෘදු ප්‍රශ්නයක් අහන්න.",
    2: "මෙම user ධර්ම ගමනේ 2 වන මට්ටමේ (පිළිගැනීම) සිටියි. "
       "හේතු පැහැදිලිව පෙන්වන්න, ඉගැන්වීම් එකිනෙක සම්බන්ධ කරන්න, "
       "විශ්වාසය තහවුරු කරන ආකාරයට උත්තර දෙන්න.",
    3: "මෙම user ධර්ම ගමනේ 3 වන මට්ටමේ (ඔප්පුව — අවබෝධය) සිටියි. "
       "ගැඹුරට උත්තර දෙන්න. තමන්ගේම අත්දැකීම දිහා බලන්න යොමු කරන්න "
       "(අනිත්‍ය / අනාත්ම ඇසින්). අවසානයේ ගැඹුරු සිතුවිල්ලක් අවදි කරන්න.",
    4: "මෙම user ධර්ම ගමනේ 4 වන මට්ටමේ (පියවර — ජීවිතයට ගැනීම) සිටියි. "
       "කෙටි හා ප්‍රායෝගික වන්න. අදම කරන්න පුළුවන් පොඩි පියවරක් යෝජනා කරන්න.",
}

_LEVEL_WORDS = {
    3: ["තේරුණා", "වටහෙන්නේ", "වටහාගත්තා", "දැනෙනවා", "දැක්කා",
        "අවබෝධ", "විපස්සනා", "සිහිය", "මනස"],
    4: ["පුරුදු", "හුරුවෙන්නේ", "ජීවිතේ", "දවසේ", "පටන් ගන්නේ",
        "පටන්ගන්නේ", "කරගන්නේ", "අභ්‍යාස", "ක්‍රියාත්මක", "භාවනා කරන්නේ"],
    2: ["විශ්වාස", "ඇත්තද", "ඇත්තටම", "හරියටම", "එහෙනම්"],
    1: ["මොකක්ද", "මොකද", "කියන්නේ", "ඇයි", "ඇකි", "කවදද",
        "කොහෙද", "මොනවද", "හරිද"],
}

_DHAMMA_WORDS = ["ධර්ම", "බුදු", "බුද්ධ", "කර්ම", "කම්ම", "භාවනා",
                 "සිල්", "ශීල", "අනිත්‍ය", "අනිච්ච", "දුක්ඛ", "අනාත්ම",
                 "නිවන", "නිබ්බාන", "සංසාර", "පටිච්ච", "සතිපට්ඨාන",
                 "සමාධි", "උපාදාන", "වේදනා", "තණහා", "මග්ග", "සත්‍ය"]


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


def detect_level(query):
    """Journey level 1-4 from the user's message style. 0 = unclear."""
    q = (query or "").lower()
    for lvl in (3, 4, 2, 1):
        for w in _LEVEL_WORDS[lvl]:
            if w in q:
                return lvl
    return 0


def kb_context(query, max_chars=4500):
    """Attributed Sinhala context block for Gemini.
    Adds journey-level guidance when the question shows a level.
    Returns '' when nothing dhamma-related is needed."""
    wis, chs = kb_search(query)
    lvl = detect_level(query)
    q_low = (query or "").lower()
    dhamma = bool(wis or chs) or any(w in q_low for w in _DHAMMA_WORDS)
    if not dhamma:
        import urllib.parse
        topic = " ".join((query or "").split())[:80]
        if not topic:
            return ""
        yt = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(topic)
        wp = "https://si.wikipedia.org/wiki/Special:Search?search=" + urllib.parse.quote(topic)
        return (
            "【වැඩිදුර කියවීම් නීතිය】\n"
            "මේ ප්‍රශ්නය තොරතුරු/දැනුම සොයන එකක් නම්, උත්තරේ අවසානයේ "
            "'වැඩිදුර කියවීමට' කොටසක් ලෙස පහත links දෙකම දෙන්න. "
            "මේ නිශ්චිත URLs ම පාවිච්චි කරන්න — අලුත් URL හදන්නේ නැත. "
            "සුහද හරියවස් කතාවක් නම් (උදා: ආයුබෝවන්න, ඔයා කවුද) links දෙන්න එපා:\n"
            f"▶️ YouTube: {yt}\n"
            f"📖 විකිපීඩියා: {wp}"
        )
    
    parts = [
        "පහත දැක්වෙන්නේ මෙම app එකේ අයිතිකරුගේ ගුරු හිමිවරුන්ගේ "
        "(කොස්වත්තේ අරියවිමල හිමි, දේවනන්ද හාමුදුරුවන්, "
        "පරිව්‍රාජක ධම්මපාල හිමි) ධර්ම දේශනා සහ පොත්වලින් ගත් කොටස්."
        " පිළිතුරු දෙන විට: (1) මේ මූලාශ්‍ර මූලික කරගන්න. "
        "(2) ඒවායින් උපුටා දක්වන කරුණු අවසානයේ 📖 මූලාශ්‍රය "
        "(පොත/දේශනාව + හිමිනම්) සඳහන් කරන්න. "
        "(3) ඔබ කිසිදා මෙම දහම් කතෘ ලෙස හඳුන්වා නොගන්න. "
        "(4) link එකක් තියෙනවා නම් 🔗 වැඩිදුර අධ්‍යයනයට දෙන්න."
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
    if lvl:
        parts.append(f"【ධර්ම ගමන — මට්ටම {lvl}/4】\n{LEVEL_GUIDE[lvl]}")
        print("[pk-kb] level:", lvl)
    return "\n\n".join(parts)[:max_chars]