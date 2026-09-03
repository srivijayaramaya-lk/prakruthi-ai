"""Multi-provider engine — ප්‍රකෘති AI ගේ මොළය.
v0.8.1: model names කිහිපයක් automatic try (අලුත් AQ keys වල model
availability වෙනස් නිසා). Gemini → OpenRouter failover."""
import os

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
OPENROUTER_URL = "https://openrouter.ai/api/v1/"
# Gemini key එකක් එක්ක try කරන model names — priority order
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3-flash-preview",
]
OPENROUTER_MODEL = "google/gemini-2.0-flash-001"

def _chain():
    chain = []
    if os.environ.get("GEMINI_API_KEY"):
        key = os.environ["GEMINI_API_KEY"]
        model = os.environ.get("PRAKRUTHI_MODEL")          # manual override එකක් තියෙනවා නම් ඒක විතරක්
        models = [model] if model else GEMINI_MODELS
        for m in models:
            chain.append(("gemini", key, GEMINI_URL, m))
    if os.environ.get("OPENROUTER_API_KEY"):
        chain.append(("openrouter", os.environ["OPENROUTER_API_KEY"], OPENROUTER_URL,
                      os.environ.get("PRAKRUTHI_OPENROUTER_MODEL", OPENROUTER_MODEL)))
    return chain

def online():
    return bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENROUTER_API_KEY"))

def chat(messages):
    """Failover: provider + model combinations එකින් එක try. ඔක්කොම fail → raise."""
    errors = []
    for name, key, base_url, model in _chain():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=key, base_url=base_url)
            r = client.chat.completions.create(
                model=model, messages=messages, temperature=0.6)
            return r.choices[0].message.content
        except Exception as e:
            errors.append(f"{name}/{model}: {type(e).__name__}")
            continue
    raise RuntimeError("all providers failed: " + "; ".join(errors))