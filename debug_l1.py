# debug_l1.py — step 2: test FULL chain (L1 + injection + lock)
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

import pk_knowledge as kb
from sila.engine import validate_execution
from sila.lock import check_messages

Q = "භාවනාව දවසේ ජීවිතේ කරගන්නේ කොහොමද?"

print("--- step 1: L1 on bare question ---")
r = validate_execution(Q, "L1-in")
print("ok" if r.is_safe else "BLOCK", "| precept:", r.violated_precept)

print("--- step 2: knowledge search + context ---")
if not getattr(kb, "_loaded", False):
    kb.kb_load()
    kb._loaded = True
wis, chs = kb.kb_search(Q)
print("matched wisdom:", len(wis), "| chapters:", len(chs))
for it in wis:
    print("  wisdom:", (it.get("topic") or "")[:40])
for ch in chs:
    print("  chapter:", (ch.get("title") or "")[:60])
ctx = kb.kb_context(Q)
print("context length:", len(ctx))

print("--- step 3: lock check on prompt + injected context ---")
ucontent = (Q + "\n\n" + ctx) if ctx else Q
messages = ([{"role": "system", "content": "You are Prakruthi AI."}]
            + [{"role": "user", "content": ucontent}])
v = check_messages(messages)
print("lock violation:", v)

print("--- end ---")