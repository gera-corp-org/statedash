# Alpine is pinned to a minor release: a surprise jump to the next Alpine can
# change musl and break the prebuilt wheels, while the floating Python patch
# level still brings security fixes on every rebuild.
ARG BASE=python:3.12-alpine3.24

# --- build stage: fetch the geo database and install the dependencies ------
# Nothing from this stage ships except the two paths copied below, so the pip
# cache, the build tooling and the uncompressed CSV never reach the image.
FROM ${BASE} AS build

# IP -> country database (CC0, github.com/sapics/ip-location-db).
#
# curl rather than ADD because ADD cannot retry: a reset connection from the CDN
# failed a release build once, and the whole release then waits on somebody
# else's network. curl lives in the build stage only, so the runtime image is
# unaffected.
#
# The size check guards against the other failure mode — a CDN answering 200
# with an error page, which would silently produce an image whose geo lookups
# all miss. The real file holds around 334k rows.
#
# -n omits the timestamp, which keeps the layer reproducible.
RUN apk add --no-cache curl \
 && curl -fsSL --retry 5 --retry-all-errors --retry-delay 3 --max-time 300 \
      -o /tmp/geo-ipv4.csv \
      https://cdn.jsdelivr.net/npm/@ip-location-db/geo-whois-asn-country/geo-whois-asn-country-ipv4.csv \
 && rows=$(wc -l < /tmp/geo-ipv4.csv) \
 && if [ "$rows" -lt 100000 ]; then echo "geo database looks wrong: $rows rows" >&2; exit 1; fi \
 && gzip -9n /tmp/geo-ipv4.csv

COPY requirements.txt .
# --target keeps the dependencies in one directory we can copy wholesale
RUN pip install --no-cache-dir --target=/deps -r requirements.txt \
 && find /deps -name '__pycache__' -type d -prune -exec rm -rf {} + \
 && find /deps -name '*.dist-info' -type d -exec rm -rf {}/RECORD \;

# --- runtime ---------------------------------------------------------------
FROM ${BASE}

# Nothing here needs root: the port is above 1024 and the only writes go to
# /srv/data and /srv/.env. uid 1000 is the usual first human account on Linux,
# so a bind-mounted ./data normally already belongs to it; a deployment where
# it does not can override the pair through PUID/PGID in docker-compose.yml.
RUN addgroup -g 1000 statedash \
 && adduser -u 1000 -G statedash -D -H statedash \
 && mkdir -p /srv/data \
 && chown 1000:1000 /srv/data

WORKDIR /srv

# Stamped by the release workflow from the git tag. Without it the interface
# reports "dev", which is what a local build honestly is.
ARG VERSION=dev

ENV PYTHONPATH=/deps \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STATEDASH_VERSION=${VERSION}

COPY --from=build /deps /deps
COPY --from=build --chmod=644 /tmp/geo-ipv4.csv.gz ./geo-ipv4.csv.gz

COPY app ./app
COPY static ./static

USER statedash

EXPOSE 8080
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
