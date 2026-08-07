"""IPv4 to country lookup (geo-whois-asn-country database, CC0, sapics/ip-location-db).

A CSV of "start_ip,end_ip,CC" rows is baked into the image at build time.
"""
from __future__ import annotations

import bisect
import gzip
import ipaddress
import logging
import os

log = logging.getLogger("geo")

CSV_PATH = os.environ.get("GEO_CSV", os.path.join(os.path.dirname(__file__), "..", "geo-ipv4.csv"))

_starts: list[int] = []
_ends: list[int] = []
_codes: list[str] = []


def _open(path: str):
    """The database ships gzipped to keep the image small; plain CSV still works."""
    if os.path.exists(path + ".gz"):
        return gzip.open(path + ".gz", "rt", encoding="ascii")
    return open(path, encoding="ascii")


def _load() -> None:
    # split() makes a fresh string per row, so the ~250 distinct country codes
    # would otherwise be held as one object per range. Reusing them costs a
    # dict lookup and saves most of what the code column would take in memory.
    pool: dict[str, str] = {}
    try:
        with _open(CSV_PATH) as f:
            for line in f:
                parts = line.strip().split(",")
                if len(parts) != 3:
                    continue
                try:
                    _starts.append(int(ipaddress.IPv4Address(parts[0])))
                    _ends.append(int(ipaddress.IPv4Address(parts[1])))
                    code = parts[2]
                    _codes.append(pool.setdefault(code, code))
                except ipaddress.AddressValueError:
                    continue
        log.info("geo db loaded: %d ranges", len(_starts))
    except OSError as exc:
        log.warning("geo db not available (%s) — countries will not be shown", exc)


_load()


def flag(code: str) -> str:
    if len(code) != 2:
        return ""
    return "".join(chr(0x1F1E6 + ord(ch) - 65) for ch in code.upper())


def lookup(ip: str) -> dict:
    """{"code": "RU", "flag": "🇷🇺"} | {"code": "local"} | {} when unknown."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return {}
    if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_multicast:
        return {"code": "local"}
    if addr.version != 4 or not _starts:
        return {}
    value = int(addr)
    idx = bisect.bisect_right(_starts, value) - 1
    if idx >= 0 and value <= _ends[idx]:
        code = _codes[idx]
        return {"code": code, "flag": flag(code)}
    return {}
