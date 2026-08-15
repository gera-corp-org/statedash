"""Test data generator — same interface as OPNsenseClient."""
from __future__ import annotations

import random
import time

from . import config

_HOSTS = [
    ("192.168.1.10", "nas", "aa:bb:cc:00:00:10"),
    ("192.168.1.21", "desktop-pc", "aa:bb:cc:00:00:21"),
    ("192.168.1.22", "macbook", "aa:bb:cc:00:00:22"),
    ("192.168.1.30", "tv-samsung", "aa:bb:cc:00:00:30"),
    ("192.168.1.31", "iphone", "aa:bb:cc:00:00:31"),
    ("192.168.1.32", "android-tab", "aa:bb:cc:00:00:32"),
    ("192.168.1.40", "camera-yard", "aa:bb:cc:00:00:40"),
    ("192.168.1.41", "printer", "aa:bb:cc:00:00:41"),
    ("192.168.1.50", "home-assistant", "aa:bb:cc:00:00:50"),
    ("192.168.1.60", "", "aa:bb:cc:00:00:60"),
    ("10.0.0.11", "laptop-vpn", ""),
    ("10.0.0.12", "phone-vpn", ""),
]

# A demonstration wants a crowd: paging and the spread on the chart only show
# up once there are more than a dozen devices. The fixed set above stays the
# default, so the ordinary mock is unchanged.
_KINDS = ["laptop", "phone", "tablet", "camera", "tv", "printer", "sensor",
          "nas", "workstation", "access-point", "voip", "thermostat"]
for _i in range(max(config.MOCK_HOSTS - len(_HOSTS), 0)):
    _HOSTS.append((
        f"192.168.{2 + _i // 250}.{10 + _i % 250}",
        "" if _i % 9 == 0 else f"{_KINDS[_i % len(_KINDS)]}-{_i:03d}",
        f"aa:bb:cc:{(_i >> 8) & 255:02x}:{_i & 255:02x}:{(_i * 7) & 255:02x}",
    ))

_REMOTES = [
    ("142.250.74.78", 443, "tcp"),
    ("104.16.132.229", 443, "tcp"),
    ("87.240.190.72", 443, "tcp"),
    ("13.107.42.14", 443, "tcp"),
    ("192.168.1.1", 53, "udp"),
    ("172.217.16.14", 80, "tcp"),
    ("140.82.121.4", 22, "tcp"),
]


class MockClient:
    def __init__(self) -> None:
        # random walk around a base rate that is each host's own
        self._base = {ip: [random.uniform(1e4, 5e6), random.uniform(1e4, 8e5)] for ip, _, _ in _HOSTS}
        self._levels = {ip: list(rates) for ip, rates in self._base.items()}
        self._cum = {ip: [0.0, 0.0] for ip, _, _ in _HOSTS}
        self._last = time.time()

    async def close(self) -> None:
        pass

    async def ping(self) -> None:
        pass

    async def filter_rules(self) -> list[dict]:
        return [
            {"uuid": "mock-1", "action": "pass", "%interface": "LAN", "source_net": "any",
             "destination_net": "any", "destination_port": "", "description": "Allow LAN to any",
             "enabled": "1", "is_automatic": 0, "%protocol": "any", "sort_order": "1"},
            {"uuid": "mock-2", "action": "pass", "%interface": "WAN", "source_net": "any",
             "destination_net": "192.168.1.100", "destination_port": "443", "description": "web-ingress",
             "enabled": "1", "is_automatic": 0, "%protocol": "TCP", "sort_order": "2"},
            {"uuid": "mock-5", "action": "pass", "%interface": "WAN", "source_net": "any",
             "destination_net": "192.168.1.53", "destination_port": "9103", "description": "backup-agent",
             "enabled": "1", "is_automatic": 0, "%protocol": "TCP", "sort_order": "3"},
            {"uuid": "mock-3", "action": "block", "%interface": "WAN", "source_net": "any",
             "destination_net": "any", "destination_port": "", "description": "Default deny",
             "enabled": "1", "is_automatic": 1, "%protocol": "any", "sort_order": "3"},
        ]

    async def snat_rules(self) -> list[dict]:
        return [
            {"uuid": "mock-n1", "%interface": "WAN", "source_net": "192.168.1.0/24",
             "destination_net": "any", "target": "wanip", "description": "NAT local network",
             "enabled": "1"},
            {"uuid": "mock-n2", "%interface": "WAN", "source_net": "10.10.10.0/24",
             "destination_net": "any", "target": "wanip", "description": "NAT WireGuard clients",
             "enabled": "1"},
        ]

    async def kill_state(self, state_id: str) -> dict:
        return {"result": "killed 1 states"}

    async def kill_states(self, address: str) -> dict:
        return {"result": "ok", "dropped_states": 3}

    # Scanners knocking on ports nobody opened, the ordinary shape of what a
    # WAN-facing firewall drops all day.
    _SCANNERS = [
        ("45.155.205.233", 22, "tcp"), ("185.220.101.34", 3389, "tcp"),
        ("193.32.162.10", 445, "tcp"), ("89.248.165.74", 23, "tcp"),
        ("141.98.11.29", 1433, "tcp"), ("80.94.95.115", 8080, "tcp"),
    ]

    async def firewall_log(self, limit: int = 1000) -> list[dict]:
        """Blocked packets, in the three shapes the log really produces.

        Attempts arrive from outside as a lone SYN, late packets carry other
        flags because the state they belonged to has already expired, and the
        rest is the broadcast and multicast chatter of neighbouring segments.
        The classifier reads those apart from the record itself, so the mock has
        to differ in the same fields rather than in a label.
        """
        rows = []
        for _ in range(min(limit, random.randint(40, 90))):
            kind = random.choices(["attempt", "late", "broadcast"], weights=[3, 2, 5])[0]
            if kind == "attempt":
                src, port, proto = random.choice(self._SCANNERS)
                row = {"src": src, "dst": "203.0.113.7", "dstport": str(port),
                       "protoname": proto, "tcpflags": "S", "interface": "wan"}
            elif kind == "late":
                src, port, proto = random.choice(_REMOTES)
                row = {"src": src, "dst": "203.0.113.7", "dstport": str(port),
                       "protoname": proto, "tcpflags": random.choice(["FA", "RA", "A"]),
                       "interface": "wan"}
            else:
                dst, port = random.choice([("192.168.1.255", 137), ("239.255.255.250", 1900),
                                           ("224.0.0.251", 5353), ("192.168.1.255", 5678)])
                row = {"src": random.choice(_HOSTS)[0], "dst": dst, "dstport": str(port),
                       "protoname": "udp", "tcpflags": "", "interface": "lan"}
            row["action"] = "block"
            # an explicit rule reports its own label; the implicit default deny
            # has none, which is what most of the log is
            row["label"] = ("Block port scanners" if kind == "attempt" and random.random() < 0.5
                            else "")
            # the real log gives every line one; the poller uses it to skip the
            # tail it has already counted
            row["__digest__"] = f"{random.getrandbits(64):016x}"
            rows.append(row)
        return rows

    async def interfaces(self) -> list[dict]:
        return [{"name": "lan", "label": "LAN", "device": "vtnet0"},
                {"name": "wan", "label": "WAN", "device": "em0"},
                {"name": "wireguard", "label": "WireGuard", "device": ""}]

    @staticmethod
    def _iface_of(ip: str) -> str:
        """Tunnel addresses sit on the WireGuard interface, everything else on lan."""
        return "wireguard" if ip.startswith("10.0.0.") else "lan"

    async def traffic_top(self, ifaces: str) -> dict[str, list[dict]]:
        now = time.time()
        dt = max(now - self._last, 0.1)
        self._last = now
        wanted = {name.strip() for name in ifaces.split(",") if name.strip()}
        result: dict[str, list[dict]] = {name: [] for name in wanted}
        for ip, _, _ in _HOSTS:
            iface = self._iface_of(ip)
            if iface not in wanted:
                continue
            level = self._levels[ip]
            base = self._base[ip]
            for i in (0, 1):
                # A plain multiplicative walk drifts upward without bound: the
                # bursts below multiply and nothing ever brings them back, so
                # after a few minutes every host sits pinned at the ceiling and
                # the totals read in gigabits. Pulling towards the host's own
                # base rate keeps the numbers looking like a network.
                pull = (base[i] / level[i]) ** 0.25
                level[i] = max(1e3, min(level[i] * random.uniform(0.7, 1.35) * pull, 9e7))
            if random.random() < 0.05:  # occasional "download" bursts
                level[0] *= 10
            self._cum[ip][0] += level[0] / 8 * dt
            self._cum[ip][1] += level[1] / 8 * dt
            result[iface].append({
                "address": ip,
                "rate_bits_in": level[0],
                "rate_bits_out": level[1],
                "cumulative_bytes_in": self._cum[ip][0],
                "cumulative_bytes_out": self._cum[ip][1],
                "tags": ["local"],
            })
        # each host belongs to exactly one interface, so unticking one in the
        # picker actually removes its hosts — the same as against a real firewall
        return result

    # (label, rule id, description) — as pf reports them: label matches the rule uuid
    _RULES = [
        ("mock-1", "36", "Allow LAN to any"),
        ("mock-2", "41", "web-ingress"),
        ("mock-n2", "44", "NAT WireGuard clients"),
        ("mock-5", "52", "backup-agent"),
        ("", "", ""),
    ]

    async def states(self, search: str = "", limit: int = 1000) -> list[dict]:
        rows = []

        def sid() -> str:
            return f"{random.getrandbits(32):08x}00000000/{random.getrandbits(32):08x}"

        for ip, _, _ in _HOSTS:
            if search and search not in ip:
                continue
            for remote, port, proto in random.sample(_REMOTES, k=random.randint(2, len(_REMOTES))):
                label, rule_id, descr = random.choice(self._RULES)
                sport = str(random.randint(32768, 60999))
                rows.append({
                    "interface": "all", "proto": proto,
                    "label": label, "rule": rule_id, "descr": descr,
                    "src_addr": ip, "src_port": sport,
                    "dst_addr": remote, "dst_port": str(port),
                    "nat_addr": None, "nat_port": None, "gateway": None,
                    "state": "ESTABLISHED:ESTABLISHED" if proto == "tcp" else "MULTIPLE:MULTIPLE",
                    "direction": "out",
                    "age": "%02d:%02d:%02d" % (random.randint(0, 3), random.randint(0, 59), random.randint(0, 59)),
                    "id": sid(),
                    "pkts": [random.randint(10, 50000), random.randint(10, 50000)],
                    "bytes": [random.randint(1000, 5_000_000), random.randint(1000, 900_000_000)],
                })
                # outbound NAT: the WAN side of the same flow. src is the address AFTER
                # translation, nat_addr is the original client — exactly how pf reports it
                if random.random() < 0.7:
                    rows.append({
                        "interface": "all", "proto": proto,
                        "label": "", "rule": "",
                        "descr": "let out anything from firewall host itself",
                        "src_addr": "100.64.0.15", "src_port": str(random.randint(20000, 30000)),
                        "dst_addr": remote, "dst_port": str(port),
                        "nat_addr": ip, "nat_port": sport, "gateway": None,
                        "state": "ESTABLISHED:ESTABLISHED", "direction": "out",
                        "age": "00:%02d:%02d" % (random.randint(0, 59), random.randint(0, 59)),
                        "id": sid(),
                        "pkts": [random.randint(10, 5000), random.randint(10, 5000)],
                        "bytes": [random.randint(1000, 100_000), random.randint(1000, 3_000_000)],
                    })
            # a couple of local connections to the host
            if not search or search in ip:
                rows.append({
                    "interface": "all", "proto": "tcp",
                    "label": "mock-2", "rule": "41", "descr": "web-ingress",
                    "src_addr": "192.168.1.21", "src_port": str(random.randint(32768, 60999)),
                    "dst_addr": ip, "dst_port": "22",
                    "nat_addr": None, "nat_port": None, "gateway": None,
                    "state": "ESTABLISHED:ESTABLISHED", "direction": "in",
                    "age": "00:%02d:%02d" % (random.randint(0, 59), random.randint(0, 59)),
                    "id": sid(),
                    "pkts": [random.randint(10, 5000), random.randint(10, 5000)],
                    "bytes": [random.randint(1000, 100_000), random.randint(1000, 3_000_000)],
                })

        # port forward: from outside to an internal server. dst is the address AFTER
        # translation, nat_addr is the address that was contacted from outside
        for outside, inside, port in (("91.108.56.130", "192.168.1.100", "443"),
                                      ("45.87.246.10", "192.168.1.100", "443"),
                                      ("77.88.55.242", "192.168.1.53", "9103")):
            rows.append({
                "interface": "all", "proto": "tcp",
                "label": "mock-2" if inside == "192.168.1.100" else "mock-5",
                "rule": "41" if inside == "192.168.1.100" else "52",
                "descr": "web-ingress" if inside == "192.168.1.100" else "backup-agent",
                "src_addr": outside, "src_port": str(random.randint(40000, 60000)),
                "dst_addr": inside, "dst_port": port,
                "nat_addr": "100.64.0.15", "nat_port": port, "gateway": None,
                "state": "ESTABLISHED:ESTABLISHED", "direction": "in",
                "age": "00:%02d:%02d" % (random.randint(0, 59), random.randint(0, 59)),
                "id": sid(),
                "pkts": [random.randint(10, 5000), random.randint(10, 5000)],
                "bytes": [random.randint(1000, 900_000), random.randint(1000, 9_000_000)],
            })

        # the firewall's own traffic — this is how its addresses are detected
        for own in ("192.168.1.1", "10.0.0.1", "100.64.0.15"):
            rows.append({
                "interface": "all", "proto": "udp",
                "label": "", "rule": "",
                "descr": "let out anything from firewall host itself",
                "src_addr": own, "src_port": "123",
                "dst_addr": "162.159.200.1", "dst_port": "123",
                "nat_addr": None, "nat_port": None, "gateway": None,
                "state": "MULTIPLE:MULTIPLE", "direction": "out",
                "age": "00:01:00", "id": sid(),
                "pkts": [12, 12], "bytes": [960, 960],
            })
        return rows[:limit]

    async def reverse_lookup(self, ips: list[str]) -> dict[str, str]:
        fake = {"142.250.74.78": "lhr25s34.1e100.net", "104.16.132.229": "cloudflare.com",
                "87.240.190.72": "srv72-190.vk.com", "140.82.121.4": "lb-140-82-121-4.github.com"}
        return {ip: fake[ip] for ip in ips if ip in fake}

    async def wireguard_peers(self) -> list[dict]:
        now = time.time()
        peers = []
        for i, (name, online) in enumerate([("iphone", True), ("laptop-work", True), ("relative-nas", False)]):
            self._cum.setdefault(f"wg{i}", [0.0, 0.0])
            if online:
                self._cum[f"wg{i}"][0] += random.uniform(1e3, 2e5)
                self._cum[f"wg{i}"][1] += random.uniform(1e3, 5e4)
            peers.append({
                "iface": "wg0",
                "name": name,
                "public_key": f"mockpubkey{i}=",
                "endpoint": f"198.51.100.{i}0:5182{i}" if online else "",
                "allowed_ips": f"10.10.10.{i + 2}/32",
                "handshake": int(now - (random.uniform(5, 90) if online else 86400 * 3)),
                "rx": self._cum[f"wg{i}"][0],
                "tx": self._cum[f"wg{i}"][1],
            })
        return peers

    async def hostnames(self, ips: list[str] | None = None) -> dict[str, dict[str, str]]:
        info = {ip: {"name": name, "mac": mac,
                     "iface": "WireGuard" if ip.startswith("10.") else "LAN"}
                for ip, name, mac in _HOSTS if name or mac}
        info["100.64.0.1"] = {"name": "isp-gw", "iface": "WAN"}
        info.get("192.168.1.60", {}).setdefault("vendor", "Espressif Inc.")
        return info
