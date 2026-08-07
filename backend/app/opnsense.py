"""OPNsense REST API client.

Endpoints used:
  GET  /api/diagnostics/traffic/top/<ifaces>      — per-host rates (as in Reporting -> Traffic)
  POST /api/diagnostics/firewall/query_states     — the pf connection table
  POST /api/diagnostics/interface/search_arp      — ARP (ip -> mac, hostname)
  POST /api/dhcpv4/leases/searchLease             — DHCP leases (ip -> hostname)
"""
from __future__ import annotations

from typing import Any

import httpx


class OPNsenseClient:
    def __init__(self, url: str, key: str, secret: str, verify: bool = True):
        self._client = httpx.AsyncClient(
            base_url=url,
            auth=(key, secret),
            verify=verify,
            timeout=httpx.Timeout(10.0),
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def ping(self) -> None:
        """Connection and credentials check: raises if OPNsense does not answer."""
        r = await self._client.get("/api/diagnostics/traffic/interface")
        r.raise_for_status()

    async def interfaces(self) -> list[dict]:
        """Interfaces OPNsense can report per-host traffic for.

        Regular ones come from diagnostics/traffic/interface, plus we probe
        virtual groups (wireguard) that are missing from that list.
        """
        result: list[dict] = []
        r = await self._client.get("/api/diagnostics/traffic/interface")
        r.raise_for_status()
        data = r.json().get("interfaces") or {}
        for name, info in data.items():
            if not isinstance(info, dict):
                continue
            result.append({
                "name": name,
                "label": info.get("name") or name.upper(),
                "device": info.get("device") or "",
            })
        for extra in ("wireguard",):
            if any(iface["name"] == extra for iface in result):
                continue
            try:
                probe = await self._client.get(f"/api/diagnostics/traffic/top/{extra}")
                if probe.status_code == 200 and extra in (probe.json() or {}):
                    result.append({"name": extra, "label": "WireGuard", "device": ""})
            except httpx.HTTPError:
                pass
        return result

    async def traffic_top(self, ifaces: str) -> dict[str, list[dict]]:
        """Returns {iface: [records]}; a record holds address, rate_bits_in/out and so on."""
        r = await self._client.get(f"/api/diagnostics/traffic/top/{ifaces}")
        r.raise_for_status()
        data = r.json()
        result: dict[str, list[dict]] = {}
        if isinstance(data, dict):
            for iface, payload in data.items():
                records = payload.get("records") if isinstance(payload, dict) else payload
                if isinstance(records, list):
                    result[iface] = [rec for rec in records if isinstance(rec, dict) and rec.get("address")]
        return result

    async def states(self, search: str = "", limit: int = 1000) -> list[dict]:
        r = await self._client.post(
            "/api/diagnostics/firewall/query_states",
            json={"current": 1, "rowCount": limit, "searchPhrase": search},
        )
        r.raise_for_status()
        data = r.json()
        rows = data.get("rows", []) if isinstance(data, dict) else []
        return [row for row in rows if isinstance(row, dict)]

    async def filter_rules(self) -> list[dict]:
        """Configured filter rules (needs the Firewall: Rules [new] privilege)."""
        r = await self._client.post("/api/firewall/filter/search_rule",
                                    json={"current": 1, "rowCount": 1000})
        r.raise_for_status()
        return r.json().get("rows", [])

    async def snat_rules(self) -> list[dict]:
        """Outbound NAT rules (needs the Firewall: NAT: Source NAT privilege)."""
        r = await self._client.post("/api/firewall/source_nat/search_rule",
                                    json={"current": 1, "rowCount": 1000})
        r.raise_for_status()
        return r.json().get("rows", [])

    async def kill_state(self, state_id: str) -> dict:
        """Drops a single pf state; id comes from query_states as '<state>/<creator>'."""
        state, _, creator = state_id.partition("/")
        r = await self._client.post(f"/api/diagnostics/firewall/del_state/{state}/{creator}", json={})
        r.raise_for_status()
        return r.json() if r.content else {}

    async def kill_states(self, address: str) -> dict:
        """Drops every state associated with the address."""
        r = await self._client.post("/api/diagnostics/firewall/kill_states", json={"filter": address})
        r.raise_for_status()
        return r.json() if r.content else {}

    async def arp_table(self) -> list[dict]:
        r = await self._client.post(
            "/api/diagnostics/interface/search_arp",
            json={"current": 1, "rowCount": -1, "searchPhrase": ""},
        )
        r.raise_for_status()
        data = r.json()
        return data.get("rows", []) if isinstance(data, dict) else []

    async def dhcp_leases(self) -> list[dict]:
        try:
            r = await self._client.post(
                "/api/dhcpv4/leases/searchLease",
                json={"current": 1, "rowCount": -1, "searchPhrase": ""},
            )
            r.raise_for_status()
        except httpx.HTTPError:
            return []
        data = r.json()
        return data.get("rows", []) if isinstance(data, dict) else []

    async def wireguard_peers(self) -> list[dict]:
        """WireGuard peer status (needs the VPN: WireGuard: Status privilege)."""
        r = await self._client.get("/api/wireguard/service/show")
        r.raise_for_status()
        data = r.json()
        rows = data.get("rows", []) if isinstance(data, dict) else []
        peers = []
        for row in rows:
            if row.get("type") != "peer":
                continue
            peers.append({
                "iface": row.get("ifname") or row.get("if") or "",
                "name": row.get("name") or "",
                "public_key": row.get("public-key") or "",
                "endpoint": row.get("endpoint") or "",
                "allowed_ips": row.get("allowed-ips") or "",
                "handshake": int(row.get("latest-handshake") or 0),
                "rx": float(row.get("transfer-rx") or 0),
                "tx": float(row.get("transfer-tx") or 0),
            })
        return peers

    async def reverse_lookup(self, ips: list[str]) -> dict[str, str]:
        """Reverse DNS through OPNsense (needs the Diagnostics: Network Insight privilege)."""
        if not ips:
            return {}
        result: dict[str, str] = {}
        for params in ({"address[]": ips}, {"address": ips}):
            try:
                r = await self._client.get("/api/diagnostics/dns/reverse_lookup", params=params)
                r.raise_for_status()
            except httpx.HTTPError:
                continue
            data = r.json()
            if not isinstance(data, dict):
                continue
            for ip, value in data.items():
                if isinstance(value, str) and value and value != ip:
                    result[ip] = value.rstrip(".")
            if result:
                break
        return result

    async def hostnames(self, ips: list[str] | None = None) -> dict[str, dict[str, str]]:
        """Merges ARP, DHCP and reverse DNS into {ip: {"name": ..., "mac": ..., "vendor": ...}}.

        Name priority: ARP hostname > DHCP hostname > reverse DNS.
        """
        info: dict[str, dict[str, str]] = {}
        try:
            for row in await self.arp_table():
                ip = row.get("ip")
                if not ip:
                    continue
                entry = info.setdefault(ip, {})
                if row.get("mac"):
                    entry["mac"] = row["mac"]
                if row.get("manufacturer"):
                    entry["vendor"] = row["manufacturer"]
                hostname = (row.get("hostname") or "").strip().strip(".")
                if hostname and hostname != "?":
                    entry["name"] = hostname
                iface = (row.get("intf_description") or row.get("intf") or "").strip()
                if iface:
                    entry["iface"] = iface
        except httpx.HTTPError:
            pass
        for row in await self.dhcp_leases():
            ip = row.get("address") or row.get("ip")
            if not ip:
                continue
            entry = info.setdefault(ip, {})
            entry["dhcp"] = True
            if row.get("descr"):
                entry["descr"] = row["descr"]
            hostname = (row.get("hostname") or "").strip()
            if hostname and not entry.get("name"):
                entry["name"] = hostname
            if row.get("mac") and not entry.get("mac"):
                entry["mac"] = row["mac"]
        unnamed = [ip for ip in (ips or []) if not info.get(ip, {}).get("name")]
        for ip, name in (await self.reverse_lookup(unnamed)).items():
            info.setdefault(ip, {})["name"] = name
        return info
