"""Reading and writing the LISTEN variable in .env.

The host port is published by docker when the container is created, so the app can
only write a new value — it takes effect on the next `docker compose up -d`.
"""
from __future__ import annotations

import ipaddress
import logging
import os
import re

from . import config

log = logging.getLogger("listen")

ENV_PATH = os.environ.get("ENV_FILE", "/srv/.env")
DEFAULT = "127.0.0.1:8080"
_LINE = re.compile(r"^\s*LISTEN\s*=", re.IGNORECASE)


def valid(value: str) -> bool:
    """'127.0.0.1:8080' or '0.0.0.0:8080'."""
    if value.count(":") != 1:
        return False
    host, _, port = value.partition(":")
    try:
        ipaddress.ip_address(host)
        return 1 <= int(port) <= 65535
    except ValueError:
        return False


def read() -> str:
    try:
        with open(ENV_PATH, encoding="utf-8") as f:
            for line in f:
                if _LINE.match(line):
                    value = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if valid(value):
                        return value
    except OSError:
        pass
    return config.LISTEN or DEFAULT


def writable() -> bool:
    return os.access(ENV_PATH, os.W_OK)


def write(value: str) -> bool:
    """Replaces the LISTEN line, keeping the rest of the file untouched."""
    try:
        with open(ENV_PATH, encoding="utf-8") as f:
            lines = f.readlines()
    except OSError as exc:
        log.warning("cannot read %s: %s", ENV_PATH, exc)
        return False

    replaced = False
    for i, line in enumerate(lines):
        if _LINE.match(line):
            lines[i] = f"LISTEN={value}\n"
            replaced = True
    if not replaced:
        if lines and not lines[-1].endswith("\n"):
            lines[-1] += "\n"
        lines.append("\n# Where the Statedash web UI listens (set from the settings page)\n")
        lines.append(f"LISTEN={value}\n")

    try:
        with open(ENV_PATH, "w", encoding="utf-8") as f:
            f.writelines(lines)
    except OSError as exc:
        log.warning("cannot write %s: %s", ENV_PATH, exc)
        return False
    return True
