"""Sila Handshake - present manifest to remote agents, then verify their output
locally. We never trust promises; we enforce."""
import hashlib, json, pathlib
from .engine import validate_execution

_ROOT = pathlib.Path(__file__).parent.parent
MANIFEST = json.loads((_ROOT / "manifests" / "sila_manifest.json").read_text(encoding="utf-8"))

def manifest_fingerprint():
    return hashlib.sha256(json.dumps(MANIFEST, sort_keys=True).encode()).hexdigest()[:16]

def call_remote_agent(prompt, remote_fn):
    offered = {"from": "Prakruthi AI", "manifest": MANIFEST,
               "fingerprint": manifest_fingerprint()}
    remote_resp = str(remote_fn(prompt, offered))   # remote sees our constitution
    check = validate_execution(remote_resp, layer="handshake")
    if not check.is_safe:
        return {"bound": False, "action": "SUPPRESSED_LOCALLY", "sila": check.to_dict()}
    return {"bound": True, "action": "ACCEPTED_AFTER_LOCAL_GATE",
            "output": remote_resp, "sila": check.to_dict()}
