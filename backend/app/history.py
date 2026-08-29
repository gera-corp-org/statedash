"""Long-term history in SQLite.

The live view keeps a quarter of an hour in memory and always has; this is what
outlives the container. Samples are folded into fixed buckets as they arrive and
written when a bucket closes, so nothing is stored at the rate it was polled and
there is no second aggregation pass to keep honest.

Two shelves:

    minute — one point a minute, kept a week
    hour   — one point an hour, kept five weeks

A month is as far back as anything here looks, and the extra week is so that a
month-long view is full at both ends rather than running out at the left edge.

Per-device series — hosts and WireGuard peers — sit on both shelves, but their
minute rows are kept only two days. On the hour shelf alone a chart of the last
fifteen minutes was empty for every device, since an hourly point lands in such
a window only by luck. Two days of minutes costs a few megabytes on a household
network and answers every period the interface offers; a week of them for a
hundred devices would be two million rows, which is why the shelf is short
rather than absent.

Every point carries the average over its bucket and the peak within it. An hour
of averages hides the burst that made the hour interesting, so the chart draws
both.

Written by one process — the chart is the only reader and it lives here too —
which is what makes a single file adequate. WAL is deliberately not used: the
volume may well be NFS, where SQLite documents that WAL does not work.
"""
from __future__ import annotations

import logging
import math
import os
import sqlite3
import threading
import time

log = logging.getLogger("history")

SCHEMA_VERSION = 2

MINUTE, HOUR = 0, 1
BUCKET = {MINUTE: 60, HOUR: 3600}

# days to keep, by shelf and by what the series is about
KEEP_DAYS = {
    (MINUTE, "agg"): 7,
    (MINUTE, "host"): 2,
    (HOUR, "agg"): 35,
    (HOUR, "host"): 35,
}

TIERS_FOR = {"agg": (MINUTE, HOUR), "host": (MINUTE, HOUR)}


def _fold(series: dict[str, list], bucket: int, max_points: int) -> dict[str, list]:
    """Group points onto a coarser grid, at most `max_points` of them.

    The grid is a whole number of buckets and the same for every series, so the
    timestamps still line up when the charts merge them into one row per moment.
    Buckets are all the same length, so averaging the averages is the average;
    the peak of a group is the highest peak in it, which is what keeps a burst
    from being smoothed away by the very step meant to make the answer smaller.
    """
    # Counted from the points actually in hand, not from the length of the
    # window: a day-long view of a store that has been running an hour holds
    # sixty points, and working from the span would have folded them in pairs to
    # fit a limit they were nowhere near.
    longest = max((len(points) for points in series.values()), default=0)
    every = max(1, math.ceil(longest / max_points))
    if every <= 1:
        return series
    grid = bucket * every
    out: dict[str, list] = {}
    for name, points in series.items():
        groups: dict[int, list] = {}
        for ts, avg, peak in points:
            slot = int(ts // grid * grid)
            g = groups.get(slot)
            if g is None:
                groups[slot] = [avg, 1, peak]
            else:
                g[0] += avg
                g[1] += 1
                if peak > g[2]:
                    g[2] = peak
        out[name] = [[slot, g[0] / g[1], g[2]] for slot, g in sorted(groups.items())]
    return out


class _Bucket:
    __slots__ = ("start", "total", "count", "peak")

    def __init__(self, start: float) -> None:
        self.start = start
        self.total = 0.0
        self.count = 0
        self.peak = 0.0

    def add(self, value: float) -> None:
        self.total += value
        self.count += 1
        if value > self.peak:
            self.peak = value


class History:
    """The store, or a stand-in for it when there is nowhere to write.

    `available` is false when no path was given or the file could not be opened.
    Everything else still works in that case: the calls become no-ops and the
    interface offers only the live range. History is a convenience, and a
    read-only filesystem is not an error.
    """

    # A write that fails once may be a lock held for a moment; three in a row is
    # a volume mounted read-only or a disk with nothing left on it, and neither
    # of those recovers.
    MAX_FAILURES = 3

    def __init__(self, path: str = "") -> None:
        self.path = path
        self.available = False
        self.error = ""
        self._failures = 0
        # Counted apart from writes on purpose: see _read_failed.
        self._read_failures = 0
        self._lock = threading.Lock()
        self._db: sqlite3.Connection | None = None
        self._series: dict[tuple[str, str], int] = {}   # (kind, key) -> series id
        self._names: dict[tuple[int, str], str] = {}   # (series id, kind) -> key
        self._open: dict[tuple[int, int], _Bucket] = {}  # (series id, tier) -> bucket
        # Counted from now, not from the epoch: leaving it at zero made the very
        # first commit run a prune, which is not what "once an hour" means.
        self._pruned = time.time()
        if path:
            self._connect()

    # ---- opening and schema ------------------------------------------------

    def _connect(self) -> None:
        try:
            os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
            self._db = sqlite3.connect(self.path, check_same_thread=False, timeout=5)
            # TRUNCATE rather than WAL: see the note at the top about NFS.
            self._db.execute("PRAGMA journal_mode=TRUNCATE")
            self._db.execute("PRAGMA synchronous=NORMAL")
            self._migrate()
            self._load_series()
            self.available = True
            log.info("history at %s", self.path)
        except Exception as exc:  # a broken file must not stop the app starting
            self.error = str(exc)
            log.warning("history unavailable (%s): %s", self.path, exc)
            self._retire_broken()

    def _retire_broken(self) -> None:
        """Move a file we cannot use aside and try once more.

        A corrupt database is worth keeping for a look, but not worth failing to
        start over. If the second attempt fails too, history simply stays off.
        """
        if self._db is not None:
            try:
                self._db.close()
            except Exception:
                pass
            self._db = None
        try:
            if os.path.exists(self.path):
                os.replace(self.path, self.path + ".broken")
                log.warning("moved unreadable history to %s.broken", self.path)
                self._db = sqlite3.connect(self.path, check_same_thread=False, timeout=5)
                self._db.execute("PRAGMA journal_mode=TRUNCATE")
                self._db.execute("PRAGMA synchronous=NORMAL")
                self._migrate()
                self._load_series()
                self.available = True
                self.error = ""
        except Exception as exc:
            self.error = str(exc)
            self._db = None
            self.available = False

    def _migrate(self) -> None:
        db = self._db
        assert db is not None
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS meta (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            -- Rows here are never deleted, and that is deliberate. A host's
            -- series is created the moment the device is first seen but earns
            -- its first point only when its hour closes, so anything that tidied
            -- away "series without points" would delete every new device — and
            -- the id, being a rowid, would then be handed to the next device
            -- along with the points still stored under it. One device's traffic
            -- would appear as another's. A row is a name and a number; a
            -- thousand of them cost less than the bug.
            CREATE TABLE IF NOT EXISTS series (
                id   INTEGER PRIMARY KEY,
                kind TEXT NOT NULL,
                name TEXT NOT NULL,
                UNIQUE (kind, name)
            );
            CREATE TABLE IF NOT EXISTS points (
                series INTEGER NOT NULL,
                tier   INTEGER NOT NULL,
                ts     INTEGER NOT NULL,
                avg    REAL    NOT NULL,
                peak   REAL    NOT NULL,
                PRIMARY KEY (series, tier, ts)
            ) WITHOUT ROWID;
            """
        )
        row = db.execute("SELECT value FROM meta WHERE key='schema'").fetchone()
        version = int(row[0]) if row else 0

        if version < 2:
            # Points left behind by the deletion described above: their series is
            # gone, so nothing can read them and nothing would ever delete them,
            # since retention works through the series table. Whose they were
            # cannot be recovered — the name went with the row — so they go.
            orphans = db.execute(
                "DELETE FROM points WHERE series NOT IN (SELECT id FROM series)"
            ).rowcount
            if orphans:
                log.warning("dropped %d points whose series had been deleted", orphans)

        if row is None:
            db.execute("INSERT INTO meta (key, value) VALUES ('schema', ?)", (str(SCHEMA_VERSION),))
        else:
            db.execute("UPDATE meta SET value=? WHERE key='schema'", (str(SCHEMA_VERSION),))
        db.commit()

    def _load_series(self) -> None:
        db = self._db
        assert db is not None
        for sid, kind, name in db.execute("SELECT id, kind, name FROM series"):
            self._series[(kind, name)] = sid
            self._names[(sid, kind)] = name

    def _series_id(self, kind: str, name: str) -> int:
        sid = self._series.get((kind, name))
        if sid is not None:
            return sid
        db = self._db
        assert db is not None
        db.execute("INSERT OR IGNORE INTO series (kind, name) VALUES (?, ?)", (kind, name))
        sid = db.execute("SELECT id FROM series WHERE kind=? AND name=?", (kind, name)).fetchone()[0]
        self._series[(kind, name)] = sid
        self._names[(sid, kind)] = name
        return sid

    # ---- writing -----------------------------------------------------------

    def _failed(self, exc: Exception) -> None:
        """A write that did not land.

        Nothing here may reach the caller. The poller writes history at the end
        of its round, and letting a database error out of this module put "no
        connection to the OPNsense API: attempt to write a readonly database" in
        front of somebody whose firewall was answering perfectly well — every two
        seconds, in the log and on the screen.

        History is a convenience. When it stops being possible the store shuts
        itself down, says so once, and the dashboard goes on without it: the
        section leaves the menu because `available` is what the interface asks.
        """
        self._failures += 1
        if self._failures < self.MAX_FAILURES:
            return
        log.warning("history switched off after %d failed writes: %s", self._failures, exc)
        self.error = str(exc)
        self.available = False
        try:
            if self._db is not None:
                self._db.close()
        except Exception:
            pass
        self._db = None
        self._open.clear()

    def _read_failed(self, exc: Exception, what: str) -> None:
        """A read that did not land.

        Kept on its own counter rather than the writers'. That one is cleared by
        every successful commit, and commits happen every couple of seconds, so
        a file whose pages have gone bad for reading while writes still land
        would never reach the threshold: the section would stay in the menu and
        answer five-hundreds for as long as anyone kept asking.

        Nothing reaches the caller here either. A chart that cannot be drawn is
        an empty chart, not an error page.
        """
        self._read_failures += 1
        log.warning("history read failed (%s): %s", what, exc)
        if self._read_failures < self.MAX_FAILURES:
            return
        log.warning("history switched off after %d failed reads", self._read_failures)
        self.error = str(exc)
        self.available = False
        try:
            if self._db is not None:
                self._db.close()
        except Exception:
            pass
        self._db = None
        self._open.clear()

    def add(self, kind: str, name: str, value: float, now: float | None = None) -> None:
        """Fold one sample into the buckets its series belongs to."""
        if not self.available or value is None:
            return
        now = now or time.time()
        try:
            with self._lock:
                sid = self._series_id(kind, name)
                for tier in TIERS_FOR[kind]:
                    start = int(now // BUCKET[tier] * BUCKET[tier])
                    bucket = self._open.get((sid, tier))
                    if bucket is None or bucket.start != start:
                        if bucket is not None:
                            self._write(sid, tier, bucket)
                        bucket = self._open[(sid, tier)] = _Bucket(start)
                    bucket.add(float(value))
        except Exception as exc:
            self._failed(exc)

    def _write(self, sid: int, tier: int, bucket: _Bucket) -> None:
        if not bucket.count or self._db is None:
            return
        self._db.execute(
            "INSERT OR REPLACE INTO points (series, tier, ts, avg, peak) VALUES (?, ?, ?, ?, ?)",
            (sid, tier, int(bucket.start), bucket.total / bucket.count, bucket.peak),
        )

    def commit(self, now: float | None = None) -> None:
        """Close finished buckets and write them out. Called once per poll."""
        if not self.available or self._db is None:
            return
        now = now or time.time()
        try:
            with self._lock:
                for (sid, tier), bucket in list(self._open.items()):
                    if now >= bucket.start + BUCKET[tier]:
                        self._write(sid, tier, bucket)
                        del self._open[(sid, tier)]
                self._db.commit()
            self._failures = 0      # a round that landed clears the count
        except Exception as exc:
            self._failed(exc)
            return
        if now - self._pruned > 3600:
            self._pruned = now
            self.prune(now)

    def prune(self, now: float | None = None) -> None:
        """Drop what has aged out. Cheap enough to run hourly."""
        if not self.available or self._db is None:
            return
        now = now or time.time()
        try:
            with self._lock:
                for (tier, kind), days in KEEP_DAYS.items():
                    self._db.execute(
                        "DELETE FROM points WHERE tier=? AND ts<? AND series IN "
                        "(SELECT id FROM series WHERE kind=?)",
                        (tier, int(now - days * 86400), kind),
                    )
                self._db.commit()
        except Exception as exc:
            self._failed(exc)

    # ---- reading -----------------------------------------------------------

    def tier_for(self, span: float, kind: str = "agg") -> int:
        """The finest shelf that still covers the span asked for.

        Per-device minutes are kept for two days rather than seven, so a chart
        reaching further back than that has to come off the hour shelf even
        though the aggregates could still answer from minutes.
        """
        return MINUTE if span <= KEEP_DAYS[(MINUTE, kind)] * 86400 else HOUR

    def read(self, kind: str, names: list[str], start: float, end: float,
             max_points: int = 0) -> dict[str, list]:
        """Points per series name, oldest first: [ts, avg, peak].

        `max_points` caps how many come back per series. A week off the minute
        shelf is 10 080 points and the chart is a thousand pixels wide, so nine
        in ten were being sent across the network, parsed, and then dropped by
        the fold to canvas width — 4.4 MB for one refresh of a seven-day view,
        fourteen times what a month cost. Folding here sends what can be drawn.
        """
        if not self.available or self._db is None or not names:
            return {}
        tier = self.tier_for(end - start, kind)
        out: dict[str, list] = {name: [] for name in names}
        try:
            rows, tier = self._read_rows(kind, names, tier, start, end)
        except Exception as exc:
            self._read_failed(exc, "read")
            return out
        for name, ts, avg, peak in rows:
            out[name].append([ts, avg, peak])
        self._open_into(out, kind, tier, start, end)
        self._read_failures = 0
        if max_points:
            out = _fold(out, BUCKET[tier], max_points)
        return out

    def _open_into(self, out: dict[str, list], kind: str, tier: int,
                   start: float, end: float) -> None:
        """Add the bucket still being filled, where it belongs to the window.

        A bucket is written when it closes and is stamped with its start, so the
        newest thing on disk is between one and two minutes behind the present:
        a strip that wide sat empty at the right of every chart, and on a
        fifteen-minute view it is a tenth of the width, which reads as the line
        being cut off rather than as a minute not yet over. The open bucket is
        made of samples already taken — the same ones the live chart is drawing —
        so it is an average over a shorter interval, not a guess.
        """
        # under the lock: the poller folds samples into these every couple of
        # seconds, and walking a dict while it is being changed raises
        with self._lock:
            open_now = [(sid, shelf, b.start, b.total, b.count, b.peak)
                        for (sid, shelf), b in self._open.items()]
        for sid, shelf, bstart, total, count, peak in open_now:
            if shelf != tier or not count:
                continue
            if not (start - BUCKET[tier] <= bstart <= end):
                continue
            name = self._names.get((sid, kind))
            if name is not None and name in out:
                # Stamped at the moment asked about rather than at the bucket's
                # start. A closed bucket says "the minute beginning here averaged
                # this"; the open one says "as of now, so far, this" — and now is
                # the right-hand edge, which is where the eye looks for the
                # latest reading and where it kept finding a gap instead.
                out[name].append([int(end), total / count, peak])

    def _read_rows(self, kind: str, names: list[str], tier: int,
                   start: float, end: float) -> tuple[list, int]:
        assert self._db is not None
        with self._lock:
            placeholders = ",".join("?" * len(names))
            # Which shelf answers is decided by what each actually holds for
            # this window, not by the length of it — and the check runs for
            # either starting choice, which it did not before. Asking a
            # ten-minute-old store for a month picked the hour shelf, found it
            # empty because no hour had closed yet, and drew nothing, while
            # "seven days" on the same store drew fine. The comment already
            # claimed the shelf was chosen by content; now it is.
            counts = {}
            for shelf in (MINUTE, HOUR):
                counts[shelf] = self._db.execute(
                    f"SELECT COUNT(*) FROM points p JOIN series s ON s.id = p.series "
                    f"WHERE s.kind=? AND s.name IN ({placeholders}) AND p.tier=? "
                    f"AND p.ts>=? AND p.ts<=?",
                    (kind, *names, shelf, int(start), int(end)),
                ).fetchone()[0]
            other = HOUR if tier == MINUTE else MINUTE
            if not counts[tier] and counts[other]:
                # nothing on the shelf meant for this span: anything beats a
                # blank chart, and a young store only has the finer one
                tier = other
            elif tier == MINUTE and counts[HOUR] > counts[MINUTE]:
                # a store running an hour has an hour of minutes and, after an
                # upgrade, weeks of hours: "the last day" must not draw ten
                # minutes and call the rest empty. But "the last fifteen
                # minutes" must not fall back to a shelf whose points land in
                # such a window only by luck, which is why this compares what is
                # in the window rather than what exists.
                tier = HOUR
            # One bucket further back than asked for. Points sit on bucket
            # boundaries and the window does not: a five-minute view starting
            # mid-minute left a wedge of up to a bucket empty at the left edge,
            # and the bucket that covers that wedge is the one starting just
            # before it. The extra point is drawn off the edge and clipped.
            rows = self._db.execute(
                f"SELECT s.name, p.ts, p.avg, p.peak FROM points p JOIN series s ON s.id = p.series "
                f"WHERE s.kind=? AND s.name IN ({placeholders}) AND p.tier=? AND p.ts>=? AND p.ts<=? "
                f"ORDER BY p.ts",
                (kind, *names, tier, int(start) - BUCKET[tier], int(end)),
            ).fetchall()
            return rows, tier

    def devices(self) -> list[str]:
        """Series names of things the store actually holds figures for.

        The picker offers these rather than everything on the network: a device
        first seen a minute ago has nothing to show, and an empty chart looks
        like a fault rather than an answer.
        """
        if not self.available or self._db is None:
            return []
        try:
            with self._lock:
                rows = self._db.execute(
                    "SELECT DISTINCT s.name FROM series s JOIN points p ON p.series = s.id "
                    "WHERE s.kind = 'host' AND s.name LIKE '%|down'"
                ).fetchall()
        except Exception as exc:
            self._read_failed(exc, "devices")
            return []
        self._read_failures = 0
        return [row[0][: -len("|down")] for row in rows]

    def span(self) -> dict:
        """What the store actually holds, for the range picker to lean on."""
        if not self.available or self._db is None:
            return {"available": False}
        try:
            with self._lock:
                row = self._db.execute("SELECT MIN(ts), MAX(ts) FROM points").fetchone()
                size = os.path.getsize(self.path) if os.path.exists(self.path) else 0
                points = self._db.execute("SELECT COUNT(*) FROM points").fetchone()[0]
        except Exception as exc:
            self._read_failed(exc, "span")
            return {"available": False}
        self._read_failures = 0
        return {
            "available": True,
            "oldest": row[0] or 0,
            "newest": row[1] or 0,
            "points": points,
            "bytes": size,
        }

    def close(self) -> None:
        if self._db is None:
            return
        try:
            with self._lock:
                for (sid, tier), bucket in list(self._open.items()):
                    self._write(sid, tier, bucket)
                self._open.clear()
                self._db.commit()
                self._db.close()
        except Exception as exc:   # shutting down is no time to raise
            log.warning("history did not close cleanly: %s", exc)
        self._db = None
        self.available = False
