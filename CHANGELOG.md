# Changelog

Notable changes per release. Versions follow [semantic versioning](https://semver.org):
the major number changes when an existing installation needs manual work to keep
running.

## 1.6.2 — 2026-08-16

### Fixed

- **The marker on a chart sat away from the pointer.** The sample under the
  cursor was picked by counting along the array, which assumes the samples are
  evenly spaced in time, while the marker is drawn at the sample's actual
  timestamp. They are not always evenly spaced: a poll that fails or an
  interface missing from the API answer leaves a gap, and a host's own history
  stops while it is idle. Where samples bunch up the two disagreed by a third of
  the chart's width. The sample is now found on the time axis, the same scale
  the line is drawn with.

## 1.6.1 — 2026-08-16

### Fixed

- **Rows jumped to their new places instead of travelling.** The reordering
  animation added in 1.5.0 set up every step correctly and then never ran: the
  rows were moved back to where they had been and released within the same
  frame, so the browser recomputed style once, saw the value it had started
  with, and had nothing to interpolate. It appeared to work only when unrelated
  code happened to force a layout in between, which is why it fired every half
  minute or so rather than on every reorder. The old positions are now committed
  before being released.

## 1.6.0 — 2026-08-15

### Added

- **A demonstration mode**, `DEMO=1` (`demo: true` in the chart). Everything is
  visible and nothing on the server can be changed. It exists because an
  instance with no password set accepts one from anybody — that is how an owner
  sets the first one, and on a public instance it means the first visitor can
  lock out everyone else. Settings kept in the browser — theme, language, units,
  column layout — stay usable, since trying them is half the point.
- **`MOCK_HOSTS`** sizes the invented network in mock mode. The fixed set of a
  dozen devices stays the default; a demonstration wants a crowd, because paging
  and the spread on the chart only show up once there is one.
- **The mock serves a firewall log**, so the Blocked section works without a
  firewall. Attempts arrive from outside as a lone SYN, late packets carry other
  flags, and the rest is broadcast chatter — the same fields the classifier
  reads, rather than a label saying which is which.

### Fixed

- **The mock's traffic no longer climbs to the ceiling.** The random walk was
  multiplicative with occasional bursts and nothing to bring it back, so after a
  few minutes every host sat pinned at the maximum and the totals read in
  gigabits. Rates are now pulled towards each host's own base.

### Documentation

- Screenshots reshot for hosts and connections, and added for Blocked, which had
  been described since 1.3.0 without a picture. Both languages, both themes.

## 1.5.0 — 2026-08-15

### Added

- **Long lists are paged.** The hosts, connections and blocked tables keep fifty
  rows in the page at a time (a hundred for connections) instead of everything
  at once. Filtering and sorting still run across the whole list, so the pages
  hold what you asked for and not merely what happened to arrive.
- **Rows slide to their new places instead of jumping.** A table that resorts
  itself every couple of seconds used to flicker; now a row that changes
  position travels there, and one that has just appeared fades in. Honours
  `prefers-reduced-motion`.

### Changed

- **The sparkline is sent only for the rows on screen.** It is four fifths of
  what a host weighs, and only a visible row can show one. On a network of five
  hundred hosts a poll drops from about 1.1 MB to 310 kB, every two seconds.
  `GET /api/hosts` without the new `spark` parameter still returns every line,
  so anything reading the API directly is unaffected.
- **Peak rates are computed by the backend** and sent as two numbers. They used
  to be derived on the client from the sparkline, which would have limited
  sorting by them to the hosts whose line had been sent.

### Fixed

- The sparkline column is measured once per table rather than once per row.
  Measuring forces the browser to recompute layout, and doing it between writes
  was by a wide margin the most expensive thing on the page: drawing five
  hundred rows fell from 1.6 s to 0.1 s, and the fifty of a page from 28 ms
  to 17 ms.

## 1.4.0 — 2026-08-13

### Changed

- **The rate columns on Hosts name their unit.** Receive, Transmit and both peak
  columns now read "Receive kbit/s" rather than "Receive", so a figure is no
  longer a bare number whose meaning lives in a dropdown elsewhere on the page.
  The unit sits in the header rather than beside every figure: repeated in the
  cells it breaks the right alignment those columns exist for, since the numbers
  then end at different places depending on the label. It follows both the
  Speed selector and the interface language.

## 1.3.0 — 2026-08-10

### Added

- **A Blocked section**, showing what the firewall turned away. It reads the
  firewall log rather than the state table, since a blocked packet never creates
  a state, and folds identical events into groups — a default deny rule writes a
  line for every stray packet, and a raw list scrolls faster than it reads.
- Blocks are split into three kinds, derived from the record itself rather than
  from the name of the rule that caught them: **connection attempts** that were
  refused, **late packets** whose connection state had already expired, and
  **broadcast noise** from neighbouring segments, which is folded away by
  default.
- The section needs the **Diagnostics: Logs: Firewall: Live View** privilege and
  appears only when it is granted. Without it there is no error and no empty
  page — the entry simply is not in the menu.
- Columns in the new table can be resized and the widths are remembered, using
  the same mechanism the other tables share.

## 1.2.0 — 2026-08-08

### Added

- **Each line on the throughput chart has its own colour.** Colour used to mark
  the direction and the dash the interface, so two lines shared a hue. Every
  series now takes its own slot from the categorical palette, assigned in fixed
  order so a line keeps its colour as others are filtered out. The dash stays as
  a second cue and to group the pair belonging to one interface.
- **The legend filters the chart.** Clicking an entry shows only that line,
  clicking another adds it, and clearing the last selection brings them all
  back — so one, two, three or all of them can be shown. Picks are keyed by
  interface and direction, so they survive a redraw.
- Tooltip rows are ordered by the value under the cursor, busiest first, which
  matches how the lines sit on screen at that point.

### Fixed

- **The WireGuard line read a flat zero.** Traffic top reports nothing on a wg
  interface, so the per-interface series has to be fed from the peer data the
  poller already collects — which the 1.1.0 split did not do.

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
