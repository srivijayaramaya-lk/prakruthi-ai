# ප්‍රකෘති AI — Prakruthi Sila Guardrail

> **සීලය ම ප්‍රකෘතිය** — *Virtue is the nature.*
>
> An open AI safety framework rooted in the five Buddhist precepts (පංච ශීල),
> built in Sri Lanka, for the world.
>
> Maintained by **Sri Vijayaramaya, Watinapaha** 🪷

---

## මේක මොකක්ද? · What is this?

A working, offline-capable AI safety gate that filters **both** user input
**and** AI output through the five precepts:

| # | Precept | AI translation |
|---|---------|----------------|
| 1 | PANATIPATA | no physical, digital, or existential harm |
| 2 | ADINNADANA | no theft, unauthorized access, or data exploitation |
| 3 | KAMESU | no exploitation or abuse of people |
| 4 | MUSAVADA | no deception, fraud, or fabricated citations |
| 5 | SURAMERAYA | no addiction engineering or consciousness-clouding design |

**What makes it different:**

- Precept 5 (attention-addiction engineering) exists in almost **no** commercial
  moderation API — this project treats it as a first-class safety category.
- Refusals arrive **in the user's own language** — not just English.
- The five precepts are treated as a *sikkhapada* (training rule): the system
  aims to improve continuously, not to claim perfection.

## How it works

    user prompt --> L1 keyword gate (offline, free, <1ms)
                      | block --> gentle refusal in user's language
                      v pass
                 L2 semantic judge (optional, online LLM)
                      | block --> refusal
                      v pass
                 LLM inference (constitution as system prompt)
                      |
                      v
                 L1 output gate --> suppressed if unsafe
                      |
                      v
                 audit log (hashed inputs - privacy by design)

## Features

- **Defense in depth** - L1 keyword gate (fast, free, offline) + L2 semantic
  judge (LLM, optional online)
- **Trilingual** - English / සිංහල / தமிழ் + Singlish transliteration
  normalization; refusals come in the user's own language
- **AI-to-AI handshake** - a manifest is presented to remote agents, but their
  output is **verified locally**: trust is never assumed, only enforced
- **Fail-closed resilience** - corrupt data -> built-in backup patterns;
  broken engine -> protective refusal. Safety never fails *open*
- **53 automated tests** - red-team cases (EN/SI/TA/mixed) + false-positive
  protection ("kill a process", "hackathon", "war history"...)
- **Privacy by design** - audit logs store hashes, never raw inputs

## Quick start

    python prakruthi.py --demo      # offline demo - no API key needed
    python prakruthi.py             # interactive mode
    python demo_handshake.py        # AI-to-AI gate demo
    python -m pytest -q             # run the 53-case test suite

**Real LLM mode** (activates the L2 judge + real answers automatically):

    pip install openai
    set OPENAI_API_KEY=sk-...       # Windows  |  export OPENAI_API_KEY=... (Linux/Mac)
    python prakruthi.py

**Debug mode** (raw inputs in audit log - local only):

    set PRAKRUTHI_DEBUG=1

## Resilience ladder

| Level | Condition | Behavior |
|-------|-----------|----------|
| L0 | API key available | L1 + L2 judge + real LLM (full power) |
| L1 | offline (default) | L1 gate + stub responses |
| L2 | sila_patterns.json corrupt | built-in backup patterns + DEGRADED banner |
| L3 | engine self-test fails | **protective mode** - every request gently refused |

Fail-closed: every failure falls *toward* safety, never away from it.

## Adding a language (no code changes!)

Edit `sila_patterns.json` -> `languages` -> add a key with word lists:

    "hi": {
      "name": "हिन्दी",
      "harm_words": ["मार डालो", "हथियार"],
      "deception_words": ["चोरी", "धोखा"]
    }

Then add a test case in `tests/test_sila.py` and run `python -m pytest -q`.

> **The Tamil pack (தமிழ்) is SEED quality - native speaker review is warmly
> welcome.** The best experts of a language are its speakers.

## Project structure

    prakruthi-ai/
    |-- sila_constitution.md     <- the AI's "birth document" - the precepts
    |-- sila_patterns.json       <- language packs (data - edit this, not code)
    |-- manifests/sila_manifest.json  <- AI-to-AI handshake manifest
    |-- sila/
    |   |-- engine.py            <- L1 gate (multilingual, fail-safe)
    |   |-- judge.py             <- L2 semantic judge (online optional)
    |   +-- handshake.py         <- remote-agent binding + local enforcement
    |-- prakruthi.py             <- main pipeline + CLI
    |-- demo_handshake.py        <- 3-agent AI-to-AI demo
    +-- tests/test_sila.py       <- red-team + false-positive suite

## Roadmap

- [x] v0.5 - trilingual foundation, fail-closed, 53 tests
- [ ] v0.6 - L2 online judge with a real API (OpenAI / Z.ai / local Ollama)
- [ ] v0.7 - web UI (phone-friendly, FastAPI + browser)
- [ ] v1.0 - Sila-fine-tuned classifier (LoRA on the audit-log dataset)
- [ ] community language packs (Hindi, Bengali, Thai, Pali...)

## Acknowledgements

Initiated as a merit-making (පින්කම්) technology project of
**Sri Vijayaramaya, Watinapaha** - offered freely to all beings.
May it protect, never harm. 🪷

## License

MIT - see `LICENSE`.
