import os


def _bool(name: str, default: str = "0") -> bool:
    return os.environ.get(name, default).strip().lower() in ("1", "true", "yes", "on")


OPNSENSE_URL = os.environ.get("OPNSENSE_URL", "").rstrip("/")
OPNSENSE_KEY = os.environ.get("OPNSENSE_KEY", "")
OPNSENSE_SECRET = os.environ.get("OPNSENSE_SECRET", "")

# Interfaces for traffic top, comma separated (API names: lan, opt1, ...)
IFACES = os.environ.get("IFACES", "lan")

POLL_SECONDS = float(os.environ.get("POLL_SECONDS", "2"))
ENRICH_SECONDS = float(os.environ.get("ENRICH_SECONDS", "60"))
# How often per-host connection counts are recalculated
STATES_SECONDS = float(os.environ.get("STATES_SECONDS", "10"))

# Verify the OPNsense TLS certificate (0 for self-signed)
TLS_VERIFY = _bool("TLS_VERIFY", "0")

# By default rate_bits_in is traffic TO the host (download). Set to 1 if yours is reversed.
DIRECTION_SWAP = _bool("DIRECTION_SWAP", "0")

# Demo mode: runs without OPNsense
# Where the long-term history lives. Empty means "beside settings.json",
# which is the mounted volume when there is one. Without a writable path
# the store switches itself off and only the live view remains.
HISTORY_PATH = os.environ.get("HISTORY_PATH", "")

MOCK = _bool("MOCK", "0")
# A public demonstration: everything can be looked at, nothing can be changed.
# Without it the first visitor to an instance with no password set can give it
# one and lock everybody else out, which is the ordinary first-run flow on your
# own network and a hazard on a public one.
DEMO = _bool("DEMO", "0")

# History points kept for the charts: 450 * 2s = 15 minutes
HISTORY_POINTS = int(os.environ.get("HISTORY_POINTS", "450"))
# Sparkline points returned per host
SPARK_POINTS = int(os.environ.get("SPARK_POINTS", "90"))

# Size of the invented network in mock mode. The default is the small fixed
# set; a larger one is what a demonstration wants, since paging and the spread
# on the chart only show up once there is a crowd.
MOCK_HOSTS = int(os.environ.get("MOCK_HOSTS", "0"))

# Where docker publishes the port (shown in the settings page only)
LISTEN = os.environ.get("LISTEN", "127.0.0.1:8080")
# host — container on the host network: real client IPs stay visible
NET_MODE = os.environ.get("STATEDASH_NET", "bridge")

# stamped into the image at build time; "dev" for a local build
VERSION = os.environ.get("STATEDASH_VERSION", "dev").strip() or "dev"
