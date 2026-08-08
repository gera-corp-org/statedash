# Roadmap

Ideas that came up while building Statedash and were deliberately postponed —
kept here so the reasoning is not lost, not as a promise of delivery. Nothing
below is scheduled; each entry is picked up when there is a reason to.

The known gaps of the current version are listed under *Limitations* in the
[README](README.md); this file is about what might be built, not what is
missing.

## System metrics from OPNsense

CPU load, memory, swap, temperature, mbuf usage and the pf state counter,
alongside the traffic chart — so a busy firewall can be told apart from a busy
network without opening a second tab.

All of it hangs off one privilege, **Lobby: Dashboard**
(`page-system-login-logout`), which despite the name is what grants:

| Endpoint | Data |
|---|---|
| `diagnostics/cpu_usage/stream` | CPU load, per core |
| `diagnostics/system/system_resources` | memory in use, free, cached |
| `diagnostics/system/system_swap` | swap |
| `diagnostics/system/system_temperature` | CPU temperature |
| `diagnostics/system/system_mbuf` | network buffers |
| `diagnostics/system/system_disk` | filesystem usage |
| `diagnostics/firewall/pf_states` | states in use against the limit |

The last two earn their place: running out of mbufs or pf states takes the
network down, and neither is visible on an ordinary traffic dashboard.

Notes for whoever builds it:

- **Make the whole section optional.** Without the privilege the endpoints
  answer 403; that must leave the rest of the interface untouched rather than
  raising errors. Statedash asks for a deliberately small set of privileges and
  this one should stay opt-in.
- `cpu_usage/stream` is Server-Sent Events, not plain JSON. Polling it on a
  timer and keeping the last sample fits the existing `Tracker` loops better
  than holding a stream open.
- Endpoint names are snake_case (`system_resources`); the camelCase spellings
  answer 403 whatever the privileges.
- OPNsense shows the same numbers on its own dashboard, so this is a
  convenience, not a missing capability. Worth doing only if reading both in
  one place genuinely helps.

## Updating the geo database without rebuilding

The IPv4-to-country database is baked into the image at build time. Refreshing
it currently means pulling a new image.

The intended answer is a **scheduled rebuild in CI** rather than a download
button: the data changes slowly, the cost of being a few weeks stale is a
slightly wrong flag, and a firewall tool that reaches out to a CDN on its own
is a thing auditors ask about.

If a runtime update is built anyway, keep the baked-in copy: the image must
work standalone, and the volume may only improve it. That way a wiped volume
self-heals instead of leaving the service without data. Three details that will
bite otherwise:

- **Swap atomically.** The database lives in three parallel lists; reloading
  them in place lets a request see a new `_starts` against an old `_codes`.
  Put the three behind one object and replace a single reference.
- **Download to a temporary file, then rename.** A connection dropped halfway
  must not leave a stub the parser accepts.
- **Cap the download size.** The parser is line-by-line and trusting; the real
  file is about 10 MB, so a 50 MB ceiling rejects nonsense without limiting
  growth.

An escape hatch already exists for unusual setups: `GEO_CSV` points the loader
elsewhere, and a plain `.csv` next to the image copy is read instead of the
gzipped one.

## Long-term history

Rates live in memory and die with the container. Keeping them would allow
week-over-week comparison and answering "what happened last night", which is
what a monitoring tool is usually wanted for.

The obstacle is that it turns a service holding a small, replaceable amount of
state into one holding data that matters — backups, retention, disk growth and
migrations all follow. Worth doing deliberately, not by accident.

## Showing blocked traffic

Only permitted traffic is visible, because it comes from the pf state table: a
blocked packet never creates a state. Blocks live in the firewall log, which
needs its own privilege and a different reading approach.

This is the single largest gap between Statedash and what people expect from a
firewall dashboard.
