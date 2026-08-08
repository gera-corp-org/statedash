# Changelog

Notable changes per release. Versions follow [semantic versioning](https://semver.org):
the major number changes when an existing installation needs manual work to keep
running.

## 1.1.0 — 2026-08-08

### Changed

- **The throughput chart is split per interface.** It used to sum per-host rates
  across every watched interface into one pair of lines, which hid a host
  reachable on two of them being counted in both — a WireGuard client talking to
  a LAN machine counted twice. There is now a line per interface per direction:
  colour marks the direction, dash marks the interface. With a single interface
  nothing changes.
- The rates behind it are accumulated from the raw records before hosts are
  merged, so each interface is counted once.

### Added

- A note by the chart title explaining what the numbers are: the sum of host
  rates on the watched interfaces, not WAN throughput. It also covers the part
  no split can fix — traffic between two local hosts lands in both the download
  and the upload line, being the same bytes counted from each end. The same
  explanation is in both READMEs.

## 1.0.2 — 2026-08-08

### Fixed

- **Unticking every interface no longer leaves the picker showing something
  untrue.** With no boxes ticked the empty value was never sent, so the poller
  carried on with the previous set while the interface claimed nothing was being
  watched — and traffic kept arriving from interfaces it said it was ignoring.
  Watching nothing has no use, so the last box now refuses to be unticked and
  says why.

## 1.0.1 — 2026-08-08

### Fixed

- **The interface picker in the top bar now takes effect.** It saved the setting
  correctly all along, but the result was invisible for three separate reasons:
  a host already listed kept its entry until it went idle ten minutes later;
  WireGuard peers are added from the peer list rather than from traffic top and
  that path ignored the watch list entirely, so unticking WireGuard could never
  remove them; and in demo mode the generator returned the same hosts under
  every interface, which made the picker purely decorative. Unticking an
  interface now drops its hosts on the next poll.

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
