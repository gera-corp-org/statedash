"""Background polling of OPNsense with rate history kept in memory."""
from __future__ import annotations

import asyncio
import ipaddress
import logging
import re
from urllib.parse import urlparse
import time
from collections import deque
from dataclasses import dataclass, field

from . import config, settings

log = logging.getLogger("poller")

# popular services by destination port
SERVICES = {
    21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS", 67: "DHCP", 80: "HTTP", 110: "POP3",
    123: "NTP", 143: "IMAP", 161: "SNMP", 443: "HTTPS", 445: "SMB", 465: "SMTPS",
    587: "SMTP", 853: "DoT", 993: "IMAPS", 995: "POP3S", 1194: "OpenVPN",
    3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL", 6443: "Kubernetes",
    8080: "HTTP", 8443: "HTTPS", 9100: "JetDirect/metrics", 51820: "WireGuard",
}

# "wan", "WAN2", "WAN_DSL" — but not "wireguard" and not "lan"
_WAN_RE = re.compile(r"(?:^|[^a-z])wan", re.I)

# Carrier-grade NAT (RFC 6598). ipaddress does not count it as private, but a
# WAN address in this range belongs on the map like an RFC 1918 one — that is
# what a subscriber sitting behind an ISP NAT is given.
_CGNAT = ipaddress.ip_network("100.64.0.0/10")


def _reserved(addr) -> bool:
    """Address that never appears on the public internet."""
    return addr.is_private or addr in _CGNAT


def _first_ipv4(allowed_ips: str) -> str:
    """'10.10.10.2/32, fd00::2/128' -> '10.10.10.2'."""
    for token in allowed_ips.split(","):
        token = token.strip().split("/")[0]
        if token.count(".") == 3:
            return token
    return ""


def _endpoint_ip(endpoint: str) -> str:
    """'192.168.1.5:443' -> '192.168.1.5'; '[fe80::1]:443' -> 'fe80::1'."""
    endpoint = endpoint.strip()
    if not endpoint:
        return ""
    if endpoint.startswith("["):
        return endpoint[1:endpoint.find("]")] if "]" in endpoint else ""
    if endpoint.count(":") == 1:
        return endpoint.split(":")[0]
    return endpoint  # IPv6 without a port, or a bare address


def _is_private(ip: str) -> bool:
    try:
        return _reserved(ipaddress.ip_address(ip))
    except ValueError:
        return False


def _zone(ip: str) -> str:
    """Address zone: the /24 subnet for private addresses, "internet" for public ones."""
    if not ip:
        return "—"
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return "—"
    if addr.is_multicast:
        return "multicast"
    if addr.version != 4:
        return "IPv6"
    if _reserved(addr) or addr.is_loopback or addr.is_link_local:
        parts = ip.split(".")
        return ".".join(parts[:3]) + ".0/24"
    return "internet"


def _own_networks(firewall_ips, wg_peers, rule_config) -> list:
    """Networks served by OPNsense itself.

    Collected automatically from three sources, so a new subnet joins the group on
    its own: the firewall's own addresses, WireGuard tunnel networks and the
    private networks named in the configured rules.
    """
    nets: set = set()

    def add_ip(value: str) -> None:
        try:
            addr = ipaddress.ip_address(value.strip())
        except ValueError:
            return
        if addr.version == 4 and _reserved(addr) and not addr.is_loopback and not addr.is_link_local:
            nets.add(ipaddress.ip_network(f"{addr}/24", strict=False))

    def add_net(value: str) -> None:
        value = (value or "").strip()
        if not value or "/" not in value:
            return add_ip(value)
        try:
            net = ipaddress.ip_network(value, strict=False)
        except ValueError:
            return
        if net.version == 4 and _reserved(net) and not net.is_loopback and not net.is_link_local:
            nets.add(net)

    for ip in firewall_ips:
        add_ip(str(ip))
    for peer in wg_peers or []:
        for chunk in str(peer.get("allowed_ips") or "").split(","):
            add_net(chunk)
    for kind in ("filter", "snat"):
        for rule in (rule_config or {}).get(kind) or []:
            for key in ("source_net", "destination_net"):
                add_net(str(rule.get(key) or ""))
    return sorted(nets, key=lambda n: (int(n.network_address), n.prefixlen))


def _is_own_zone(zone: str, nets: list) -> bool:
    """A zone (a /24 from the map) belongs to OPNsense when it overlaps its networks."""
    try:
        net = ipaddress.ip_network(zone, strict=False)
    except ValueError:
        return False
    return any(net.overlaps(own) for own in nets)


def _flow_key(row: dict) -> tuple:
    """Connection tuple — the two states of one NAT flow meet on it."""
    return (str(row.get("src_addr") or ""), str(row.get("src_port") or ""),
            str(row.get("dst_addr") or ""), str(row.get("dst_port") or ""))


def _match_snat(ip: str, snat_rules: list[dict] | None) -> dict | None:
    """Finds the configured outbound NAT rule an address falls under."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return None
    for rule in snat_rules or []:
        net = str(rule.get("source_net") or "").strip()
        if not net or net == "any":
            continue
        try:
            if addr in ipaddress.ip_network(net, strict=False):
                return rule
        except ValueError:
            continue
    return None


def _aggregate_paths(rows: list[dict], snat_rules: list[dict] | None = None) -> dict:
    """Turns states into paths "network -> port forward -> rule -> NAT -> network".

    The direction of a state says unambiguously what was translated:
      out + nat_addr — the SOURCE was translated, nat_addr holds the original client;
      in  + nat_addr — the DESTINATION was translated, nat_addr holds the contacted address.
    """
    # the WAN side of a NAT flow duplicates the LAN side: index it and skip it in paths
    snat_by_flow: dict[tuple, dict] = {}
    duplicates: set[int] = set()
    for i, row in enumerate(rows):
        if not row.get("nat_addr") or (row.get("direction") or "") != "out":
            continue
        duplicates.add(i)
        origin = (str(row.get("nat_addr")), str(row.get("nat_port") or ""),
                  str(row.get("dst_addr") or ""), str(row.get("dst_port") or ""))
        snat_by_flow[origin] = {"via": str(row.get("src_addr") or ""), "from": str(row.get("nat_addr"))}

    dnat_nodes: dict[str, dict] = {}
    snat_nodes: dict[str, dict] = {}
    paths: dict[tuple, dict] = {}

    for i, row in enumerate(rows):
        if i in duplicates:
            continue
        src_ip = str(row.get("src_addr") or "")
        dst_ip = str(row.get("dst_addr") or "")
        rule_key = str(row.get("label") or row.get("rule") or row.get("descr") or "—")

        dnat_id = ""
        if row.get("nat_addr") and (row.get("direction") or "") == "in":
            outside = f"{row.get('nat_addr')}:{row.get('nat_port') or ''}".rstrip(":")
            inside = f"{dst_ip}:{row.get('dst_port') or ''}".rstrip(":")
            dnat_id = f"{outside}>{inside}"
            node = dnat_nodes.setdefault(dnat_id, {
                "id": dnat_id, "title": outside, "sub": inside,
                "proto": (row.get("proto") or "").lower(), "conns": 0,
            })
            node["conns"] += 1

        snat_id = ""
        hit = snat_by_flow.get(_flow_key(row))
        if hit:
            rule = _match_snat(hit["from"], snat_rules)
            snat_id = str(rule.get("uuid")) if rule else "auto:" + hit["via"]
            node = snat_nodes.setdefault(snat_id, {
                "id": snat_id,
                "title": (rule.get("description") or "").strip() if rule else "",
                "sub": f"{rule.get('source_net')} → {hit['via']}" if rule else f"→ {hit['via']}",
                "auto": rule is None, "conns": 0,
            })
            node["conns"] += 1

        raw_bytes = row.get("bytes")
        volume = (sum(float(b or 0) for b in raw_bytes)
                  if isinstance(raw_bytes, (list, tuple)) else float(raw_bytes or 0))
        key = (_zone(src_ip), dnat_id, rule_key, snat_id, _zone(dst_ip))
        stat = paths.setdefault(key, {"src": key[0], "dnat": dnat_id, "rule": rule_key,
                                      "snat": snat_id, "dst": key[4], "conns": 0, "bytes": 0.0})
        stat["conns"] += 1
        stat["bytes"] += volume

    return {
        "paths": sorted(paths.values(), key=lambda p: -p["conns"]),
        "dnat": sorted(dnat_nodes.values(), key=lambda n: -n["conns"]),
        "snat": sorted(snat_nodes.values(), key=lambda n: -n["conns"]),
        "duplicates": len(duplicates),
    }


def _aggregate_rules(rows: list[dict], skip: set | None = None) -> list[dict]:
    """Groups pf states by rule: connections, traffic and who is talking."""
    acc: dict[str, dict] = {}
    for i, row in enumerate(rows):
        if skip and i in skip:      # WAN side of a NAT flow — a duplicate of the LAN side
            continue
        key = str(row.get("label") or row.get("rule") or row.get("descr") or "—")
        entry = acc.get(key)
        if entry is None:
            entry = acc[key] = {
                "key": key,
                "descr": (row.get("descr") or "").strip(),
                "rule_id": str(row.get("rule") or ""),
                "conns": 0,
                "bytes": 0.0,
                "packets": 0.0,
                "ifaces": set(),
                "protos": {},
                "sources": {},
                "dests": {},
                "dir_in": 0,
                "dir_out": 0,
                "nat_out": 0,     # masquerade: outwards under the firewall address
                "nat_in": 0,      # port forward: from outside inwards
                "nat_sample": "",
                "ports": {},      # (protocol, destination port) -> connection count
                "routes": {},     # (source zone, destination zone) -> volume
            }
        entry["conns"] += 1
        raw_bytes = row.get("bytes")
        if isinstance(raw_bytes, (list, tuple)):
            entry["bytes"] += sum(float(b or 0) for b in raw_bytes)
        else:
            entry["bytes"] += float(raw_bytes or 0)
        raw_pkts = row.get("pkts")
        if isinstance(raw_pkts, (list, tuple)):
            entry["packets"] += sum(float(p or 0) for p in raw_pkts)
        else:
            entry["packets"] += float(raw_pkts or 0)
        iface = row.get("interface") or row.get("iface") or ""
        if iface and iface != "all":
            entry["ifaces"].add(iface)
        proto = (row.get("proto") or "").lower()
        if proto:
            entry["protos"][proto] = entry["protos"].get(proto, 0) + 1
        dst_port = str(row.get("dst_port") or "").strip()
        if dst_port and dst_port != "0":
            port_key = (proto, dst_port)
            entry["ports"][port_key] = entry["ports"].get(port_key, 0) + 1
        src_ip = row.get("src_addr") or ""
        dst_ip = row.get("dst_addr") or ""
        if src_ip:
            entry["sources"][src_ip] = entry["sources"].get(src_ip, 0) + 1
        if dst_ip:
            entry["dests"][dst_ip] = entry["dests"].get(dst_ip, 0) + 1
        if (row.get("direction") or "") == "in":
            entry["dir_in"] += 1
        else:
            entry["dir_out"] += 1

        route = (_zone(str(src_ip)), _zone(str(dst_ip)))
        stat = entry["routes"].setdefault(route, {"conns": 0, "bytes": 0.0, "nat": 0})
        stat["conns"] += 1
        stat["bytes"] += (sum(float(b or 0) for b in raw_bytes)
                          if isinstance(raw_bytes, (list, tuple)) else float(raw_bytes or 0))

        nat_addr = row.get("nat_addr")
        if nat_addr:
            stat["nat"] += 1
            # the direction of the state says what was translated: outbound is the
            # source (masquerade), inbound is the destination (port forward)
            if (row.get("direction") or "") == "out":
                entry["nat_out"] += 1
            else:
                entry["nat_in"] += 1
            if not entry["nat_sample"]:
                entry["nat_sample"] = f"{nat_addr}:{row.get('nat_port')}" if row.get("nat_port") else str(nat_addr)

    rules = []
    for entry in acc.values():
        top_src = max(entry["sources"].items(), key=lambda kv: kv[1], default=("", 0))
        top_dst = max(entry["dests"].items(), key=lambda kv: kv[1], default=("", 0))
        rules.append({
            "key": entry["key"],
            "descr": entry["descr"],
            "rule_id": entry["rule_id"],
            "conns": entry["conns"],
            "bytes": entry["bytes"],
            "packets": entry["packets"],
            "ifaces": sorted(entry["ifaces"]),
            "protos": sorted(entry["protos"], key=entry["protos"].get, reverse=True)[:3],
            "hosts": len(entry["sources"]),
            "peers": len(entry["dests"]),
            "top_src": top_src[0],
            "top_dst": top_dst[0],
            "dir_in": entry["dir_in"],
            "dir_out": entry["dir_out"],
            "nat_out": entry["nat_out"],
            "nat_in": entry["nat_in"],
            "nat_sample": entry["nat_sample"],
            "ports": [
                {"proto": proto, "port": port, "conns": count,
                 "service": SERVICES.get(int(port), "") if port.isdigit() else ""}
                for (proto, port), count in sorted(
                    entry["ports"].items(), key=lambda kv: -kv[1])[:6]
            ],
            "routes": [
                {"src": src_zone, "dst": dst_zone, **stat}
                for (src_zone, dst_zone), stat in sorted(
                    entry["routes"].items(), key=lambda kv: -kv[1]["conns"])[:6]
            ],
        })
    rules.sort(key=lambda r: r["conns"], reverse=True)
    return rules


@dataclass
class HostState:
    ip: str
    name: str = ""
    mac: str = ""
    vendor: str = ""
    descr: str = ""
    dhcp: bool = False
    rname: str = ""          # name from traffic top (OPNsense's own reverse DNS)
    top_peer_ip: str = ""    # who it exchanges the most traffic with right now
    top_peer_bps: float = 0.0
    bps_down: float = 0.0
    bps_up: float = 0.0
    total_down: float = 0.0  # bytes for the session (cumulative, from OPNsense)
    total_up: float = 0.0
    first_seen: float = 0.0
    last_seen: float = 0.0
    ifaces: set[str] = field(default_factory=set)
    # (ts, down, up) — full history for the host histogram
    history: deque = field(default_factory=lambda: deque(maxlen=settings.get("history_points")))


class Tracker:
    def __init__(self, client):
        self.client = client
        self.hosts: dict[str, HostState] = {}
        self.names: dict[str, dict[str, str]] = {}
        self.conn_counts: dict[str, int] = {}
        self.conn_dests: dict[str, set] = {}  # ip -> who it has connections with
        self.rules: list[dict] = []           # states aggregated by firewall rule
        self.flow: dict = {"paths": [], "dnat": [], "snat": []}   # network -> NAT -> rule -> NAT -> network
        self.rule_config: dict = {"filter": [], "snat": [], "error": ""}   # configured rules
        self.states_raw: list[dict] = []      # latest state snapshot (for drill-down)
        self.firewall_ips: set[str] = set()   # the firewall's own addresses
        self.iface_list: list[dict] = []   # OPNsense interfaces (name, label, device)
        self.wg_peers: list[dict] = []
        self.wg_error: str = ""
        self.wg_ts: float = 0.0
        self.wg_history: dict[str, deque] = {}  # public_key -> (ts, rx_bps, tx_bps)
        self.rdns: dict[str, tuple[str, float]] = {}  # ip -> (name, when it was resolved)
        self.totals: deque = deque(maxlen=settings.get("history_points"))  # (ts, down, up)
        self.last_poll_ok: float = 0.0
        self.last_error: str = ""
        self._task: asyncio.Task | None = None
        self._enrich_task: asyncio.Task | None = None
        self._states_task: asyncio.Task | None = None
        self._wg_task: asyncio.Task | None = None

    def zone_interfaces(self) -> dict[str, list[str]]:
        """Subnet -> the interfaces it lives on.

        ARP knows the interface of every neighbour, WireGuard knows its own tunnel
        networks; a new subnet is picked up as soon as a neighbour appears on it.
        """
        skip = {"—", "internet", "multicast", "IPv6"}
        acc: dict[str, set[str]] = {}

        def add(ip: str, iface: str) -> None:
            iface = (iface or "").strip()
            zone = _zone(str(ip).strip())
            if iface and zone not in skip:
                acc.setdefault(zone, set()).add(iface)

        for ip, info in self.names.items():
            add(ip, (info or {}).get("iface", ""))
        for peer in self.wg_peers:
            for chunk in str(peer.get("allowed_ips") or "").split(","):
                add(chunk.split("/")[0], peer.get("iface", ""))
        return {zone: sorted(ifaces) for zone, ifaces in sorted(acc.items())}

    def wan_zones(self) -> set[str]:
        """Subnets facing outwards: they live on an interface named like WAN."""
        wan_names: set[str] = set()
        for iface in self.iface_list:
            if any(_WAN_RE.search(str(iface.get(key) or "")) for key in ("name", "label")):
                for key in ("name", "label", "device"):
                    value = str(iface.get(key) or "").strip().lower()
                    if value:
                        wan_names.add(value)
        return {zone for zone, ifaces in self.zone_interfaces().items()
                if any(name.lower() in wan_names or _WAN_RE.search(name) for name in ifaces)}

    def start(self) -> None:
        self._task = asyncio.create_task(self._poll_loop())
        self._enrich_task = asyncio.create_task(self._enrich_loop())
        self._states_task = asyncio.create_task(self._states_loop())
        self._wg_task = asyncio.create_task(self._wg_loop())

    async def replace_client(self, client) -> None:
        """Swaps the API client (after the keys change, say) on the fly."""
        old = self.client
        self.client = client
        self.last_error = ""
        try:
            await old.close()
        except Exception:  # closing the old one must not break anything
            pass

    async def stop(self) -> None:
        for task in (self._task, self._enrich_task, self._states_task, self._wg_task):
            if task:
                task.cancel()
        await self.client.close()

    async def _poll_loop(self) -> None:
        while True:
            started = time.time()
            try:
                await self._poll_once()
                self.last_poll_ok = time.time()
                self.last_error = ""
            except Exception as exc:  # network/auth — surface it in the UI, do not crash
                self.last_error = str(exc)
                log.warning("poll failed: %s", exc)
            await asyncio.sleep(max(settings.get("poll_seconds") - (time.time() - started), 0.2))

    async def _poll_once(self) -> None:
        data = await self.client.traffic_top(settings.get("ifaces"))
        now = time.time()
        seen: dict[str, HostState] = {}
        for iface, records in data.items():
            for rec in records:
                ip = rec["address"]
                rate_in = float(rec.get("rate_bits_in") or 0)
                rate_out = float(rec.get("rate_bits_out") or 0)
                cum_in = float(rec.get("cumulative_bytes_in") or 0)
                cum_out = float(rec.get("cumulative_bytes_out") or 0)
                # in = towards the host (download) unless DIRECTION_SWAP is set
                swap = settings.get("direction_swap")
                down, up = (rate_out, rate_in) if swap else (rate_in, rate_out)
                cdown, cup = (cum_out, cum_in) if swap else (cum_in, cum_out)

                host = seen.get(ip) or self.hosts.get(ip) or HostState(ip=ip, first_seen=now)
                if ip in seen:  # same address on a second interface — sum the rates
                    host.bps_down += down
                    host.bps_up += up
                else:
                    host.bps_down = down
                    host.bps_up = up
                    host.total_down = 0.0
                    host.total_up = 0.0
                host.total_down += cdown
                host.total_up += cup
                if rec.get("rname"):
                    host.rname = str(rec["rname"]).strip().rstrip(".")
                details = rec.get("details")
                if isinstance(details, list) and details:
                    top = max(details, key=lambda d: float(d.get("rate_bits") or 0))
                    host.top_peer_ip = str(top.get("address") or "")
                    host.top_peer_bps = float(top.get("rate_bits") or 0)
                host.last_seen = now
                host.ifaces.add(iface)
                seen[ip] = host

        # active WireGuard peers are shown as regular hosts (traffic top cannot count
        # on a wg interface, but the peer data is already here)
        for peer in self.wg_peers:
            ip = peer.get("tunnel_ip")
            handshake = peer.get("handshake") or 0
            if not ip or ip in seen or now - handshake > 180:
                continue
            host = self.hosts.get(ip) or HostState(ip=ip, first_seen=now)
            host.name = peer.get("name") or host.name
            host.vendor = host.vendor or "WireGuard"
            # peer rx = received by the firewall from the client (its upload), tx = towards the client
            host.bps_down = float(peer.get("tx_bps") or 0)
            host.bps_up = float(peer.get("rx_bps") or 0)
            host.total_down = float(peer.get("tx") or 0)
            host.total_up = float(peer.get("rx") or 0)
            host.last_seen = now
            host.ifaces.add("wireguard")
            seen[ip] = host

        # hosts that vanished from the response keep rate 0 (recently active ones stay listed)
        for ip, host in self.hosts.items():
            if ip not in seen:
                host.bps_down = 0.0
                host.bps_up = 0.0
                seen[ip] = host

        for host in seen.values():
            info = self.names.get(host.ip)
            if info:
                host.name = info.get("name", host.name)
                host.mac = info.get("mac", host.mac)
                host.vendor = info.get("vendor", host.vendor)
                host.descr = info.get("descr", host.descr)
                host.dhcp = info.get("dhcp", host.dhcp)
            if not host.name and host.rname:  # fallback name from traffic top
                host.name = host.rname
            host.history.append((round(now), round(host.bps_down), round(host.bps_up)))

        self.hosts = seen
        active = [h for h in seen.values() if now - h.last_seen < settings.get("poll_seconds") * 2]
        self.totals.append((now, sum(h.bps_down for h in active), sum(h.bps_up for h in active)))

    async def _enrich_loop(self) -> None:
        # give the poller time to collect hosts so names resolve on the first pass
        await asyncio.sleep(settings.get("poll_seconds") * 2)
        while True:
            try:
                self.names = await self.client.hostnames(list(self.hosts.keys()))
            except Exception as exc:
                log.warning("hostname enrichment failed: %s", exc)
            try:
                self.iface_list = await self.client.interfaces()
            except Exception as exc:
                log.warning("interface list failed: %s", exc)
            try:
                self.rule_config = {
                    "filter": await self.client.filter_rules(),
                    "snat": await self.client.snat_rules(),
                    "error": "",
                }
            except Exception as exc:   # no privileges — the section just shows a hint
                self.rule_config = {"filter": [], "snat": [], "error": str(exc)}
            await asyncio.sleep(settings.get("enrich_seconds"))

    async def _states_loop(self) -> None:
        await asyncio.sleep(settings.get("poll_seconds"))
        while True:
            try:
                rows = await self.client.states("", limit=20000)
                counts: dict[str, int] = {}
                dests: dict[str, set] = {}
                for row in rows:
                    addrs = [row.get("src_addr"), row.get("dst_addr")]
                    if not any(addrs):  # old/mock format: "ip:port" in a single string
                        addrs = [_endpoint_ip(str(row.get(k) or "")) for k in ("source", "destination")]
                    src_ip, dst_ip = (addrs + ["", ""])[:2]
                    for ip in (src_ip, dst_ip):
                        if ip:
                            counts[ip] = counts.get(ip, 0) + 1
                    if src_ip and dst_ip:  # who exactly each side talks to
                        dests.setdefault(src_ip, set()).add(dst_ip)
                        dests.setdefault(dst_ip, set()).add(src_ip)
                self.conn_counts = counts
                self.conn_dests = dests
                self.states_raw = rows
                # the firewall's own addresses: it passes traffic by its own auto-rule
                own = {str(row.get("src_addr")) for row in rows
                       if "firewall host itself" in (row.get("descr") or "") and row.get("src_addr")}
                host = urlparse(settings.get("opnsense_url")).hostname
                if host:
                    own.add(host)
                if own:
                    self.firewall_ips = own
                self.flow = _aggregate_paths(rows, (self.rule_config or {}).get("snat"))
                dupes = {i for i, r in enumerate(rows)
                         if r.get("nat_addr") and (r.get("direction") or "") == "out"}
                self.rules = _aggregate_rules(rows, dupes)
            except Exception as exc:
                log.warning("state counting failed: %s", exc)
            await asyncio.sleep(settings.get("states_seconds"))

    async def _wg_loop(self) -> None:
        prev: dict[str, tuple[float, float, float]] = {}  # key -> (ts, rx, tx)
        while True:
            try:
                peers = await self.client.wireguard_peers()
                now = time.time()
                for peer in peers:
                    key = peer["public_key"] or peer["name"]
                    last = prev.get(key)
                    if last and now > last[0]:
                        dt = now - last[0]
                        peer["rx_bps"] = max(peer["rx"] - last[1], 0) * 8 / dt
                        peer["tx_bps"] = max(peer["tx"] - last[2], 0) * 8 / dt
                    else:
                        peer["rx_bps"] = 0.0
                        peer["tx_bps"] = 0.0
                    prev[key] = (now, peer["rx"], peer["tx"])
                    peer["tunnel_ip"] = _first_ipv4(peer.get("allowed_ips") or "")
                    history = self.wg_history.setdefault(key, deque(maxlen=settings.get("history_points")))
                    history.append((round(now), round(peer["rx_bps"]), round(peer["tx_bps"])))
                self.wg_peers = peers
                self.wg_error = ""
                self.wg_ts = now
            except Exception as exc:
                self.wg_error = str(exc)
            await asyncio.sleep(settings.get("states_seconds"))

    async def resolve_names(self, ips: set[str]) -> dict[str, str]:
        """Names for a list of IPs: local ones from ARP/DHCP, the rest via rDNS cached for an hour."""
        now = time.time()
        result: dict[str, str] = {}
        missing: list[str] = []
        for ip in ips:
            local = self.names.get(ip, {}).get("name")
            if local:
                result[ip] = local
                continue
            cached = self.rdns.get(ip)
            if cached and now - cached[1] < 3600:
                result[ip] = cached[0]
            else:
                missing.append(ip)
        if missing:
            try:
                resolved = await self.client.reverse_lookup(missing[:150])
            except Exception as exc:
                log.warning("reverse lookup failed: %s", exc)
                resolved = {}
            for ip in missing[:150]:
                name = resolved.get(ip, "")
                self.rdns[ip] = (name, now)  # cache empty results too, to avoid re-asking
                if name:
                    result[ip] = name
        if len(self.rdns) > 5000:
            self.rdns = dict(sorted(self.rdns.items(), key=lambda kv: kv[1][1])[-2500:])
        return result

    def wg_snapshot(self) -> dict:
        return {
            "ts": self.wg_ts,
            "error": self.wg_error,
            "peers": self.wg_peers,
        }

    def snapshot(self) -> dict:
        now = time.time()
        hosts = []
        for host in self.hosts.values():
            # drop hosts that have been silent for more than 10 minutes
            if now - host.last_seen > settings.get("idle_seconds"):
                continue
            hosts.append({
                "ip": host.ip,
                "name": host.name,
                "mac": host.mac,
                "vendor": host.vendor,
                "descr": host.descr,
                "dhcp": host.dhcp,
                "iface": ", ".join(sorted(host.ifaces)),
                "first_seen": host.first_seen,
                "last_seen": host.last_seen,
                "top_peer_ip": host.top_peer_ip,
                "top_peer_name": self.names.get(host.top_peer_ip, {}).get("name", ""),
                "top_peer_bps": host.top_peer_bps,
                "dests": len(self.conn_dests.get(host.ip, ())),
                "conns": self.conn_counts.get(host.ip, 0),
                "down": host.bps_down,
                "up": host.bps_up,
                "total_down": host.total_down,
                "total_up": host.total_up,
                "active": now - host.last_seen < settings.get("poll_seconds") * 3,
                "spark": [[down, up] for _, down, up in list(host.history)[-settings.get("spark_points"):]],
            })
        hosts.sort(key=lambda h: h["down"] + h["up"], reverse=True)
        return {
            "ts": now,
            "poll_seconds": settings.get("poll_seconds"),
            "ifaces": settings.get("ifaces"),
            "mock": config.MOCK,
            "version": config.VERSION,
            "error": self.last_error if now - self.last_poll_ok > settings.get("poll_seconds") * 3 else "",
            "firewall_ips": sorted(self.firewall_ips),
            "totals": [[round(ts), round(down), round(up)] for ts, down, up in self.totals],
            "hosts": hosts,
        }

    def host_detail(self, ip: str) -> dict | None:
        host = self.hosts.get(ip)
        if host is None:
            return None
        return {
            "ip": host.ip,
            "name": host.name,
            "mac": host.mac,
            "vendor": host.vendor,
            "ifaces": sorted(host.ifaces),
            "first_seen": host.first_seen,
            "last_seen": host.last_seen,
            "down": host.bps_down,
            "up": host.bps_up,
            "total_down": host.total_down,
            "total_up": host.total_up,
            "history": [list(point) for point in host.history],
        }
