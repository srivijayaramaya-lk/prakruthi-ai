"""Multi-provider engine — ප්‍රකෘති AI ��� ���.
v0.8.3: 2.5-flash ��� thinking OFF attempt (fast) — ��� ��� ��� ��� ��� ���
එකම ��� ��� ��� ��� (වැඩ ��� ��� ���). Gemini → OpenRouter failover."""
import os

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
OPENROUTER_URL = "https://openrouter.ai/api/v1/"
GEMINI_MODELS = [
    "gemini-2.5-flash",          # ��� ��� ��� ���
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-3-flash-preview",
]
OPENROUTER_MODEL = "google/gemini-2.0-flash-001"

def _chain():
    chain = []
    if os.environ.get("GEMINI_API_KEY"):
        key = os.environ["GEMINI_API_KEY"]
        model = os.environ.get("PRAKRUTHI_MODEL")
        models = [model] if model else GEMINI_MODELS
        for m in models:
            chain.append(("gemini", key, GEMINI_URL, m))
    if os.environ.get("OPENROUTER_API_KEY"):
        chain.append(("openrouter", os.environ["OPENROUTER_API_KEY"], OPENROUTER_URL,
                      os.environ.get("PRAKRUTHI_OPENROUTER_MODEL", OPENROUTER_MODEL)))
    return chain

def online():
    return bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENROUTER_API_KEY"))

def _call(client, model, messages):
    """පළවෙනියට thinking OFF (fast) → ��� ��� ��� ��� ��� ��� ��� ��� ��� ��� ��� ��� ���."""
    try:
        return client.chat.completions.create(
            model=model, messages=messages, temperature=0.6,
            extra_body={"google": {"thinking_config": {"thinking_budget": 0}}})
    except Exception:
        return client.chat.completions.create(
            model=model, messages=messages, temperature=0.6)

def chat(messages):
    errors = []
    for name, key, base_url, model in _chain():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=key, base_url=base_url)
            r = _call(client, model, messages)
            return r.choices[0].message.content
        except Exception as e:
            errors.append(f"{name}/{model}: {type(e).__name__}")
            continue
    raise RuntimeError("all providers failed: " + "; ".join(errors))
def chat_fast(messages):
    """Judge/referee/whisper වලට — OpenRouter පළවෙනියට (fast),
    නැත්නම් Gemini chain. chat() එකේ හැසිරීමට බාධාවක් නෑ."""
    chain = _chain()
    fast_items = [c for c in chain if c[0] == "openrouter"]
    others = [c for c in chain if c[0] != "openrouter"]
    errors = []
    for name, key, base_url, model in (fast_items + others):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=key, base_url=base_url)
            r = _call(client, model, messages)
            return r.choices[0].message.content
        except Exception as e:
            errors.append(f"{name}/{model}: {type(e).__name__}")
            continue
    raise RuntimeError("chat_fast all failed: " + "; ".join(errors))