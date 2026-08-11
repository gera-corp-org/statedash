# Statedash

A network traffic dashboard for OPNsense: active hosts with live rates, every
connection of a host with the rule that passed it, a map of how traffic moves
through rules and NAT, and WireGuard peers.

Nothing is installed on the firewall — the app polls the OPNsense REST API with
read-only privileges.

## Installing

```sh
helm install statedash oci://ghcr.io/gera-corp-org/charts/statedash \
  --set opnsense.url=https://opnsense.example.com:4443 \
  --set opnsense.key=YOUR_KEY \
  --set opnsense.secret=YOUR_SECRET
```

To look around first, without a firewall:

```sh
helm install statedash oci://ghcr.io/gera-corp-org/charts/statedash --set mock=true
```

The API user needs five read-only privileges; the list is in the
[project README](https://github.com/gera-corp-org/statedash#1-user-and-privileges).

## Keeping credentials out of values

Passing the key on the command line puts it in the release history and in your
shell history. Create a Secret instead:

```sh
kubectl create secret generic statedash-opnsense \
  --from-literal=OPNSENSE_KEY=YOUR_KEY \
  --from-literal=OPNSENSE_SECRET=YOUR_SECRET
```

```yaml
opnsense:
  url: https://opnsense.example.com:4443
  existingSecret: statedash-opnsense
```

The keys inside must be named `OPNSENSE_KEY` and `OPNSENSE_SECRET`.

## Values

| Key | Default | Description |
|---|---|---|
| `opnsense.url` | `""` | Address of the OPNsense web interface. Required. |
| `opnsense.interfaces` | `lan` | Which interfaces to watch, comma separated, as the API names them. |
| `opnsense.tlsVerify` | `true` | Set false for a self-signed certificate. |
| `opnsense.key` / `.secret` | `""` | API credentials, put into a generated Secret. |
| `opnsense.existingSecret` | `""` | Use this Secret instead; takes precedence. |
| `polling.speed` | `2` | Seconds between rate polls. |
| `polling.states` | `10` | Seconds between connection and WireGuard polls. |
| `polling.names` | `60` | Seconds between name refreshes (ARP, DHCP, reverse DNS). |
| `directionSwap` | `false` | Set true if download and upload appear swapped. |
| `mock` | `false` | Generated data instead of a firewall. |
| `persistence.enabled` | `true` | Keep settings.json across restarts. |
| `persistence.size` | `64Mi` | Claim size; the file is a few kilobytes. |
| `persistence.existingClaim` | `""` | Use a claim you made yourself. |
| `ingress.enabled` | `false` | Standard ingress block. |
| `networkPolicy.enabled` | `false` | Egress policy allowing DNS and `egressCIDRs`. |
| `resources` | 50m / 128Mi | Requests; the geo database holds about 30 MB of the ~75 MB total. |

## Versions

The chart carries the same number as the application it installs: chart 1.3.0
installs Statedash 1.3.0. Releasing the application publishes the chart in the
same step, so the two cannot drift apart.

A fix touching only the templates is released as `chart-X.Y.Z` and keeps
whatever `appVersion` the chart already names.

## Things worth knowing

**One replica.** Each pod polls the firewall on its own and keeps rate history
in memory, so several would disagree with each other and multiply the load. The
chart does not stop you raising `replicaCount`, but there is nothing to gain.

**Persistence holds the password.** `settings.json` carries the password hash
and anything changed in the web interface. With `persistence.enabled: false`
the interface still works, but a password set through it disappears on the next
restart.

**The listen address is not configurable here.** In Kubernetes the Service
decides where the app is reachable, so `LISTEN` is not set and `.env` is not
mounted. That setting shows as read-only in the web interface, which is
honest — the alternative would be a control that appears to work and does not.

**History is in memory.** Rates are kept for roughly fifteen minutes and are
lost when the pod restarts. That is a property of the application, not of this
chart.
