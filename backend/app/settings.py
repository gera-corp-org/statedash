"""Runtime settings: values from .env can be overridden from the UI.

Overrides live in a JSON file (SETTINGS_PATH) and apply on the fly, without
restarting the container. If that file is not writable the settings still
work, but only until the next restart.
"""
from __future__ import annotations

import json
import logging
import os

from . import config

log = logging.getLogger("settings")

PATH = os.environ.get("SETTINGS_PATH", "/srv/data/settings.json")

# key: (type, default from .env, minimum, maximum)
SPEC: dict[str, tuple] = {
    "opnsense_url": ("str", config.OPNSENSE_URL, None, None),
    "tls_verify": ("bool", config.TLS_VERIFY, None, None),
    "ifaces": ("str", config.IFACES, None, None),
    "poll_seconds": ("float", config.POLL_SECONDS, 1, 60),
    "states_seconds": ("float", config.STATES_SECONDS, 2, 600),
    "enrich_seconds": ("float", config.ENRICH_SECONDS, 10, 3600),
    "direction_swap": ("bool", config.DIRECTION_SWAP, None, None),
    "history_points": ("int", config.HISTORY_POINTS, 60, 5000),
    "spark_points": ("int", config.SPARK_POINTS, 10, 600),
    "idle_seconds": ("int", 600, 60, 86400),  # how long a silent host stays listed
    "conn_limit": ("int", 500, 50, 5000),     # how many connections we ask OPNsense for
    "block_limit": ("int", 1000, 100, 10000),  # log entries fetched per poll
    "block_window": ("int", 3600, 300, 86400), # how long a block group stays listed
}

DEFAULTS = {key: spec[1] for key, spec in SPEC.items()}
_values: dict = dict(DEFAULTS)
# secrets (password hash, API keys) — kept apart and never returned to the client
_secrets: dict[str, str] = {"password_hash": "", "opnsense_key": "", "opnsense_secret": ""}
persisted = False  # whether saving to disk succeeded


def _coerce(key: str, raw):
    kind, _default, low, high = SPEC[key]
    if kind == "bool":
        if isinstance(raw, str):
            return raw.strip().lower() in ("1", "true", "yes", "on")
        return bool(raw)
    if kind == "str":
        return str(raw).strip()
    number = float(raw) if kind == "float" else int(float(raw))
    if low is not None:
        number = max(number, low)
    if high is not None:
        number = min(number, high)
    return number


def load() -> None:
    global persisted
    try:
        with open(PATH, encoding="utf-8") as f:
            stored = json.load(f)
    except FileNotFoundError:
        persisted = _writable()
        return
    except (OSError, ValueError) as exc:
        log.warning("cannot read %s: %s", PATH, exc)
        return
    for key, raw in (stored or {}).items():
        if key in SPEC:
            try:
                _values[key] = _coerce(key, raw)
            except (TypeError, ValueError):
                log.warning("invalid value %s=%r, falling back to the default", key, raw)
    for key in _secrets:
        value = (stored or {}).get(key)
        if isinstance(value, str):
            _secrets[key] = value
    persisted = True
    log.info("settings loaded from %s", PATH)


def _writable() -> bool:
    try:
        os.makedirs(os.path.dirname(PATH) or ".", exist_ok=True)
        with open(PATH, "a", encoding="utf-8"):
            pass
        return True
    except OSError:
        return False


def save() -> bool:
    """Stores the overrides; True when they reached the disk."""
    global persisted
    changed = {key: value for key, value in _values.items() if value != DEFAULTS[key]}
    changed.update({key: value for key, value in _secrets.items() if value})
    try:
        os.makedirs(os.path.dirname(PATH) or ".", exist_ok=True)
        with open(PATH, "w", encoding="utf-8") as f:
            json.dump(changed, f, ensure_ascii=False, indent=2)
        persisted = True
    except OSError as exc:
        log.warning("settings not saved to disk (%s) — they apply until restart", exc)
        persisted = False
    return persisted


def get(key: str):
    return _values[key]


def get_secret(key: str) -> str:
    """Value from settings.json, otherwise from .env (used for the API keys)."""
    stored = _secrets.get(key, "")
    if stored:
        return stored
    if key == "opnsense_key":
        return config.OPNSENSE_KEY
    if key == "opnsense_secret":
        return config.OPNSENSE_SECRET
    return ""


def set_secret(key: str, value: str) -> None:
    if key in _secrets:
        _secrets[key] = value or ""
        save()


def mask(value: str) -> str:
    """'…8Cg6' — lets you confirm which key is in use without revealing it."""
    if not value:
        return ""
    return "•" * 8 + value[-4:] if len(value) > 4 else "•" * 8


def all_values() -> dict:
    return dict(_values)


def update(patch: dict) -> dict:
    """Applies the submitted values, ignoring unknown keys."""
    for key, raw in (patch or {}).items():
        if key not in SPEC:
            continue
        try:
            _values[key] = _coerce(key, raw)
        except (TypeError, ValueError):
            continue
    save()
    return all_values()


def reset() -> dict:
    _values.clear()
    _values.update(DEFAULTS)
    save()
    return all_values()


load()
