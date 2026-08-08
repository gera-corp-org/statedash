# Changelog

Notable changes per release. Versions follow [semantic versioning](https://semver.org):
the major number changes when an existing installation needs manual work to keep
running.

## 1.0.0 — 2026-08-08

First public release.

### Sections

- **Active hosts** — per-host download and upload rates on the watched
  interfaces, with a throughput chart, connection counts, MAC, vendor, address
  type, uptime and idle time. Columns can be reordered, resized and hidden.
- **Host details** — every connection of one host with the firewall rule that
  passed it, protocol, service, both countries, gateway, state and age.
  Connections can be dropped from the interface.
- **Rules** — a map of how traffic actually flows: source network → port
  forward → rule → outbound NAT → destination. Subnets belonging to OPNsense
  are grouped automatically, WAN networks separately, and new subnets join on
  their own.
- **VPN · WireGuard** — peers with handshake age, endpoint, allowed IPs, live
  rates and per-peer history.
- **Settings** — polling intervals, interfaces, units, theme, language, time
  format and the listen address, all applied without a restart.

### Details worth knowing

- Nothing is installed on the firewall: the app polls the OPNsense REST API and
  runs in Docker on any machine that can reach it.
- Both a Russian and an English interface, switchable at runtime and on the
  login page.
- Optional password protection; the hash and the API keys never leave the
  server.
- IPv4-to-country lookups work offline — the database is built into the image.
- The container runs as an unprivileged user (uid 1000). Where the host account
  has a different id, set `PUID`/`PGID` in `.env`.
- Published for `linux/amd64` and `linux/arm64` as
  `ghcr.io/gera-corp-org/statedash`.

### Known limitations

Only permitted traffic is visible, since it comes from the pf state table — a
blocked packet never creates a state. Rate history lives in memory and is lost
when the container restarts. Both, and what may be done about them, are in
[ROADMAP.md](ROADMAP.md).
