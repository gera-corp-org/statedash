import logging
from contextlib import asynccontextmanager
from pathlib import Path
import ipaddress
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from . import auth, config, geo, listen_conf, settings
from .poller import SERVICES, Tracker, _is_own_zone, _own_networks

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("statedash")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def make_client():
    if config.MOCK:
        from .mock import MockClient
        return MockClient()
    key = settings.get_secret("opnsense_key")
    secret = settings.get_secret("opnsense_secret")
    url = settings.get("opnsense_url")
    if not (url and key and secret):
        raise SystemExit(
            "Fill in OPNSENSE_URL / OPNSENSE_KEY / OPNSENSE_SECRET in .env (or run with MOCK=1)"
        )
    from .opnsense import OPNsenseClient
    return OPNsenseClient(url, key, secret, verify=settings.get("tls_verify"))


tracker = Tracker(make_client())


@asynccontextmanager
async def lifespan(app: FastAPI):
    tracker.start()
    yield
    await tracker.stop()


app = FastAPI(title="Statedash", lifespan=lifespan)


def client_ip(request: Request) -> str:
    """Client IP; behind a reverse proxy take the first address from X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else ""


# paths reachable without signing in
OPEN_PATHS = ("/login", "/static/", "/api/auth/")


@app.middleware("http")
async def no_cache_static(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static/") or request.url.path in ("/", "/login"):
        response.headers["Cache-Control"] = "no-store, must-revalidate"
    return response


@app.middleware("http")
async def require_auth(request: Request, call_next):
    if not auth.enabled() or request.url.path.startswith(OPEN_PATHS):
        return await call_next(request)
    if auth.valid_session(request.cookies.get(auth.COOKIE)):
        return await call_next(request)
    if request.url.path.startswith("/api/"):
        return JSONResponse({"detail": "err.auth_required"}, status_code=401)
    return RedirectResponse("/login")


@app.get("/api/auth/status")
async def auth_status(request: Request):
    return {
        "enabled": auth.enabled(),
        "authenticated": not auth.enabled() or auth.valid_session(request.cookies.get(auth.COOKIE)),
    }


@app.post("/api/auth/login")
async def auth_login(payload: dict, response: Response):
    if not auth.enabled():
        return {"ok": True}
    if not auth.check_password(str(payload.get("password") or "")):
        raise HTTPException(status_code=401, detail="err.bad_password")
    response.set_cookie(
        auth.COOKIE, auth.create_session(),
        httponly=True, samesite="lax", max_age=auth.SESSION_TTL, path="/",
    )
    return {"ok": True}


@app.post("/api/auth/logout")
async def auth_logout(request: Request, response: Response):
    auth.drop_session(request.cookies.get(auth.COOKIE))
    response.delete_cookie(auth.COOKIE, path="/")
    return {"ok": True}


@app.post("/api/auth/password")
async def auth_set_password(payload: dict, request: Request):
    """Set, change or clear the password. Changing and clearing require the current one."""
    new_password = str(payload.get("new") or "")
    if auth.enabled():
        current = str(payload.get("current") or "")
        # an authorised session also proves the right to change the password
        if not (auth.valid_session(request.cookies.get(auth.COOKIE)) or auth.check_password(current)):
            raise HTTPException(status_code=403, detail="err.bad_current_password")
    if new_password and len(new_password) < 6:
        raise HTTPException(status_code=400, detail="err.password_too_short")
    auth.set_password(new_password)
    return {"enabled": auth.enabled(), "persisted": settings.persisted}


@app.get("/api/credentials")
async def get_credentials():
    return {
        "url": settings.get("opnsense_url"),
        "tls_verify": settings.get("tls_verify"),
        "key_mask": settings.mask(settings.get_secret("opnsense_key")),
        "secret_mask": settings.mask(settings.get_secret("opnsense_secret")),
        "from_env": not settings._secrets["opnsense_key"],
        "mock": config.MOCK,
    }


@app.put("/api/credentials")
async def put_credentials(payload: dict):
    """Changes the address and/or keys. New values are probed against OPNsense first
    and applied only if it answered — otherwise nothing is touched."""
    url = str(payload.get("url") or settings.get("opnsense_url")).strip().rstrip("/")
    new_key = str(payload.get("key") or "").strip()
    new_secret = str(payload.get("secret") or "").strip()
    key = new_key or settings.get_secret("opnsense_key")
    secret = new_secret or settings.get_secret("opnsense_secret")
    tls_verify = bool(payload.get("tls_verify", settings.get("tls_verify")))

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(status_code=400, detail="err.bad_url")
    if not key or not secret:
        raise HTTPException(status_code=400, detail="err.need_key_and_secret")

    if not config.MOCK:
        from .opnsense import OPNsenseClient
        probe = OPNsenseClient(url, key, secret, verify=tls_verify)
        try:
            await probe.ping()
        except Exception as exc:
            await probe.close()
            reason = str(exc) or type(exc).__name__
            raise HTTPException(status_code=400,
                                detail={"code": "err.connect_failed", "info": reason})
        await tracker.replace_client(probe)

    settings.update({"opnsense_url": url, "tls_verify": tls_verify})
    if new_key and new_secret:  # keys from .env are not duplicated into the settings file
        settings.set_secret("opnsense_key", new_key)
        settings.set_secret("opnsense_secret", new_secret)
    return {
        "ok": True, "url": url, "key_mask": settings.mask(key), "persisted": settings.persisted,
    }


@app.get("/api/hosts")
async def hosts():
    return tracker.snapshot()


@app.get("/api/interfaces")
async def interfaces():
    """Interface list for the checkboxes on the settings page."""
    try:
        available = await tracker.client.interfaces()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OPNsense API: {exc}")
    chosen = [name.strip() for name in settings.get("ifaces").split(",") if name.strip()]
    known = {iface["name"] for iface in available}
    # a selected interface missing from the list is kept as is, not dropped
    for name in chosen:
        if name not in known:
            available.append({"name": name, "label": name, "device": ""})
    return {"interfaces": available, "selected": chosen}


@app.get("/api/listen")
async def get_listen():
    return {
        "value": listen_conf.read(),      # what is written in .env
        "effective": config.LISTEN,       # what the container was started with
        "pending": listen_conf.read() != config.LISTEN,
        "writable": listen_conf.writable(),
    }


@app.put("/api/listen")
async def put_listen(payload: dict):
    value = str(payload.get("value") or "").strip()
    if not listen_conf.valid(value):
        raise HTTPException(status_code=400, detail="err.bad_listen")
    if not listen_conf.write(value):
        raise HTTPException(status_code=500, detail="err.env_not_writable")
    return {"value": value, "effective": config.LISTEN, "pending": value != config.LISTEN}


@app.get("/api/settings")
async def get_settings(request: Request):
    ip = client_ip(request)
    try:  # the docker bridge replaces the client address with its gateway (172.16.0.0/12)
        behind_nat = ipaddress.ip_address(ip) in ipaddress.ip_network("172.16.0.0/12")
    except ValueError:
        behind_nat = False
    return {
        "client_ip": ip,
        "behind_nat": behind_nat,
        "values": settings.all_values(),
        "defaults": settings.DEFAULTS,
        "persisted": settings.persisted,
        "env": {
            "listen": "0.0.0.0:8080" if config.NET_MODE == "host" else config.LISTEN,
            "listen_public": config.NET_MODE == "host" or not config.LISTEN.startswith(("127.", "localhost")),
            "net_mode": config.NET_MODE,
            "url": config.OPNSENSE_URL,
            "mock": config.MOCK,
            "tls_verify": config.TLS_VERIFY,
        },
    }


@app.put("/api/settings")
async def put_settings(patch: dict):
    values = settings.update(patch)
    return {"values": values, "persisted": settings.persisted}


@app.post("/api/settings/reset")
async def reset_settings():
    return {"values": settings.reset(), "persisted": settings.persisted}


@app.get("/api/wireguard")
async def wireguard():
    return tracker.wg_snapshot()


@app.get("/api/wireguard/history")
async def wireguard_history(key: str):
    history = tracker.wg_history.get(key)
    if history is None:
        raise HTTPException(status_code=404, detail="err.peer_not_found")
    return {"key": key, "history": [list(point) for point in history]}


@app.get("/api/host/{ip}/detail")
async def host_detail(ip: str):
    detail = tracker.host_detail(ip)
    if detail is None:
        raise HTTPException(status_code=404, detail="err.host_not_found")
    return detail


@app.get("/api/rules")
async def rules():
    """Rule activity plus the configuration itself, when the API exposes it."""
    activity = {rule["key"]: rule for rule in tracker.rules}

    def decorate(row: dict) -> dict:
        used = activity.get(str(row.get("uuid") or ""), {})
        return {
            "uuid": row.get("uuid") or "",
            "action": row.get("action") or "",
            "interface": row.get("%interface") or row.get("interface") or "",
            "protocol": row.get("%protocol") or row.get("protocol") or "",
            "source": row.get("source_net") or "any",
            "source_port": row.get("source_port") or "",
            "destination": row.get("destination_net") or "any",
            "destination_port": row.get("destination_port") or "",
            "target": row.get("target") or "",
            "description": (row.get("description") or "").strip(),
            "enabled": str(row.get("enabled")) == "1" and not row.get("disabled"),
            "automatic": bool(row.get("is_automatic")),
            "conns": used.get("conns", 0),
            "bytes": used.get("bytes", 0),
        }

    config = tracker.rule_config
    # which networks on the map belong to OPNsense itself — detected automatically
    own_nets = _own_networks(tracker.firewall_ips, tracker.wg_peers, config)
    zones = {path[key] for path in tracker.flow.get("paths", []) for key in ("src", "dst")}
    # networks on WAN interfaces form their own group: they face outwards
    wan = tracker.wan_zones()
    return {
        "ts": tracker.last_poll_ok,
        "rules": tracker.rules,
        "paths": tracker.flow.get("paths", []),
        "dnat_nodes": tracker.flow.get("dnat", []),
        "snat_nodes": tracker.flow.get("snat", []),
        "own_zones": sorted(z for z in zones if _is_own_zone(z, own_nets) and z not in wan),
        "wan_zones": sorted(z for z in zones if z in wan),
        "zone_ifaces": tracker.zone_interfaces(),
        "own_nets": [str(net) for net in own_nets],
        "config_error": config.get("error", ""),
        "filter": [decorate(row) for row in config.get("filter", [])],
        "snat": [decorate(row) for row in config.get("snat", [])],
    }


@app.post("/api/state/kill")
async def kill_state(payload: dict):
    """Drops the connection as a whole.

    Through NAT a single TCP connection lives in pf as two states (the LAN side
    and the WAN side) — we drop both, otherwise the flow keeps running through
    the second one.
    """
    state_id = str(payload.get("id") or "").strip()
    if "/" not in state_id:
        raise HTTPException(status_code=400, detail="err.bad_state_id")
    try:
        rows = await tracker.client.states("", limit=20000)
    except Exception:
        rows = tracker.states_raw  # no fresh snapshot — fall back to the last one

    target = next((row for row in rows if str(row.get("id")) == state_id), None)
    ids = {state_id}
    if target:
        # client addresses: before and after translation
        client_sides = {(str(target.get("src_addr")), str(target.get("src_port")))}
        if target.get("nat_addr"):
            client_sides.add((str(target.get("nat_addr")), str(target.get("nat_port"))))
        dst = (str(target.get("dst_addr")), str(target.get("dst_port")))
        for row in rows:
            if (str(row.get("dst_addr")), str(row.get("dst_port"))) != dst:
                continue
            same = ((str(row.get("src_addr")), str(row.get("src_port"))) in client_sides
                    or (str(row.get("nat_addr")), str(row.get("nat_port"))) in client_sides)
            if same and row.get("id"):
                ids.add(str(row["id"]))

    killed, failed = [], []
    for sid in ids:
        try:
            await tracker.client.kill_state(sid)
            killed.append(sid)
        except Exception as exc:
            failed.append(f"{sid}: {exc}")
    if not killed:
        raise HTTPException(status_code=502,
                            detail={"code": "err.kill_failed", "info": "; ".join(failed)})
    log.info("states dropped: %s (failures: %s)", killed, failed or "none")
    return {"ok": True, "killed": len(killed), "ids": killed}


@app.post("/api/states/kill_between")
async def kill_between(payload: dict):
    """Drops every connection between two addresses — an entire download from one
    server running over several parallel streams, for example."""
    a = str(payload.get("a") or "").strip()
    b = str(payload.get("b") or "").strip()
    for value in (a, b):
        try:
            ipaddress.ip_address(value)
        except ValueError:
            raise HTTPException(status_code=400, detail="err.need_two_addresses")
    try:
        rows = await tracker.client.states("", limit=20000)
    except Exception:
        rows = tracker.states_raw

    ids = set()
    for row in rows:
        sides = {str(row.get("src_addr") or ""), str(row.get("dst_addr") or ""), str(row.get("nat_addr") or "")}
        if a in sides and b in sides and row.get("id"):
            ids.add(str(row["id"]))

    killed = []
    for sid in ids:
        try:
            await tracker.client.kill_state(sid)
            killed.append(sid)
        except Exception as exc:
            log.warning("could not drop %s: %s", sid, exc)
    log.info("dropped %d states between %s and %s", len(killed), a, b)
    return {"ok": True, "killed": len(killed)}


@app.post("/api/host/{ip}/kill_states")
async def kill_host_states(ip: str):
    """Drops every connection of the host."""
    try:
        ipaddress.ip_address(ip)
    except ValueError:
        raise HTTPException(status_code=400, detail="err.bad_address")
    try:
        result = await tracker.client.kill_states(ip)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OPNsense API: {exc}")
    log.info("states of host %s dropped: %s", ip, result)
    return {"ok": True, "result": result}


@app.get("/api/rule/connections")
async def rule_connections(key: str):
    """Connections passing through one rule (from the latest state snapshot)."""
    rows = [
        row for row in tracker.states_raw
        if str(row.get("label") or row.get("rule") or row.get("descr") or "—") == key
    ]
    return {"key": key, "connections": await _build_connections(
        rows[:settings.get("conn_limit")], reference=tracker.states_raw)}


@app.get("/api/host/{ip}/connections")
async def connections(ip: str):
    try:
        rows = await tracker.client.states(search=ip, limit=settings.get("conn_limit"))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OPNsense API: {exc}")
    rows = [row for row in rows if ip in (row.get("src_addr"), row.get("dst_addr"), row.get("nat_addr"))]
    return {"ip": ip, "connections": await _build_connections(rows, host_ip=ip)}


async def _build_connections(rows: list[dict], host_ip: str | None = None,
                             reference: list[dict] | None = None) -> list[dict]:
    """Builds the connection list for the detail panel.

    One NATed connection lives in pf as two states: the LAN side with the real
    client address and the WAN side after translation. The second one is not shown
    as its own row — it would look like a foreign connection from the firewall
    address — instead its address is folded into the nat_via field of the first.
    """
    # (client address, port, destination, port) -> the address it was translated to
    snat_by_flow: dict[tuple, str] = {}
    for row in (reference if reference is not None else rows):
        if not row.get("nat_addr") or (row.get("direction") or "") != "out":
            continue
        key = (str(row.get("nat_addr")), str(row.get("nat_port") or ""),
               str(row.get("dst_addr") or ""), str(row.get("dst_port") or ""))
        snat_by_flow[key] = str(row.get("src_addr") or "")

    conns = []
    all_ips: set[str] = set()
    for row in rows:
        # WAN side of a NAT flow — a duplicate, represented by the original row
        if row.get("nat_addr") and (row.get("direction") or "") == "out":
            continue
        src, src_port = _addr_port(row, "src_addr", "src_port", "source")
        dst, dst_port = _addr_port(row, "dst_addr", "dst_port", "destination")
        # a rule has no "own" host — take the direction from the state itself
        incoming = (dst == host_ip) if host_ip else (row.get("direction") == "in")
        raw_bytes = row.get("bytes")
        if isinstance(raw_bytes, (list, tuple)) and len(raw_bytes) == 2:
            fwd, back = float(raw_bytes[0] or 0), float(raw_bytes[1] or 0)
        else:
            fwd, back = float(raw_bytes or 0), 0.0
        # bytes = [in state direction (src->dst), back]; convert to host rx/tx
        tx, rx = (back, fwd) if incoming else (fwd, back)
        try:
            service_name = SERVICES.get(int(dst_port or 0), "")
        except ValueError:
            service_name = ""
        conns.append({
            "id": str(row.get("id") or ""),
            "dir": "in" if incoming else "out",
            "rule": row.get("descr") or "",
            "proto": (row.get("proto") or "").lower(),
            "service": (f"{dst_port}/{row.get('proto') or '?'}" + (f" · {service_name}" if service_name else "")) if dst_port else "",
            "src_ip": src, "src_port": src_port,
            "dst_ip": dst, "dst_port": dst_port,
            "src_country": geo.lookup(src), "dst_country": geo.lookup(dst),
            "gateway": row.get("gateway") or "",
            "state": row.get("state") or "",
            "age": row.get("age") or "",
            "rx": rx, "tx": tx,
            "nat_via": snat_by_flow.get((src, src_port, dst, dst_port), ""),
        })
        all_ips.update((src, dst))
    names = await tracker.resolve_names(all_ips)
    for conn in conns:
        conn["src_name"] = names.get(conn["src_ip"], "")
        conn["dst_name"] = names.get(conn["dst_ip"], "")
    return conns


def _addr_port(row: dict, addr_key: str, port_key: str, legacy_key: str) -> tuple[str, str]:
    addr = row.get(addr_key)
    if addr:
        return str(addr), str(row.get(port_key) or "")
    legacy = str(row.get(legacy_key) or "")
    if ":" in legacy and not legacy.startswith("["):
        ip_part, _, port_part = legacy.rpartition(":")
        return ip_part, port_part
    return legacy, ""


@app.get("/login")
async def login_page():
    return FileResponse(STATIC_DIR / "login.html")


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
