# Alpine is pinned to a minor release: a surprise jump to the next Alpine can
# change musl and break the prebuilt wheels, while the floating Python patch
# level still brings security fixes on every rebuild.
ARG BASE=python:3.12-alpine3.24

# --- build stage: fetch the geo database and install the dependencies ------
# Nothing from this stage ships except the two paths copied below, so the pip
# cache, the build tooling and the uncompressed CSV never reach the image.
FROM ${BASE} AS build

# IP -> country database (CC0, github.com/sapics/ip-location-db)
ADD https://cdn.jsdelivr.net/npm/@ip-location-db/geo-whois-asn-country/geo-whois-asn-country-ipv4.csv /tmp/geo-ipv4.csv
# -n omits the timestamp: ADD stamps a date gzip cannot encode, and leaving it
# out also keeps the build reproducible
RUN gzip -9n /tmp/geo-ipv4.csv

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
ENV PYTHONPATH=/deps \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY --from=build /deps /deps
COPY --from=build --chmod=644 /tmp/geo-ipv4.csv.gz ./geo-ipv4.csv.gz

COPY app ./app
COPY static ./static

USER statedash

EXPOSE 8080
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
