# Contributing to Statedash

Bug reports, ideas and pull requests are all welcome.

## Before a large change

Open an issue first and describe what you have in mind. It saves you from
building something that turns out to conflict with the direction of the
project.

## Branch names

Prefixed the git-flow way, so the intent is readable in the branch list:

| Prefix | For |
|---|---|
| `feature/` | anything new, and refactoring |
| `bugfix/` | a fix that can wait for the normal review |
| `hotfix/` | a fix that cannot |
| `release/` | preparing a version — changelog, version bumps |

After the prefix, a short dash-separated description of the change rather than
an issue number alone: `feature/non-root-container` says what it is,
`feature/42` needs a lookup.

`master` is the released state and is protected: it takes no direct pushes, so
every change arrives through a pull request.

## Contributor Licence Agreement

Statedash is dual-licensed: AGPL-3.0 for everyone, plus a commercial licence
for vendors who cannot comply with the AGPL. See [LICENSING.md](LICENSING.md).

That second licence can only be granted by someone who holds the rights to
*all* of the code. So by submitting a contribution you agree that:

1. **You keep the copyright on your work.** Nothing is assigned away.
2. You grant the project maintainer a perpetual, worldwide, irrevocable,
   royalty-free licence to use, reproduce, modify and distribute your
   contribution, **including the right to sublicense it under other terms** —
   which is what makes the commercial licence possible.
3. Your contribution is your own work, and you have the right to submit it.
   If your employer holds rights to what you write, you have their permission.
4. The contribution is provided without warranty of any kind.

Confirm this by adding a `Signed-off-by` line to each commit — `git commit -s`
does it for you:

```
Signed-off-by: Your Name <your.email@example.com>
```

That line means you agree to the four points above.

## Style

The codebase has no build step and no linter config — match the surrounding
code rather than a style guide.

- **Comments and identifiers in English.** User-facing strings go through the
  localisation keys instead of being written inline.
- **Backend** is Python 3.12, FastAPI, standard library where it suffices.
  Keep new dependencies out of `requirements.txt` unless there is no
  reasonable alternative.
- **Frontend** is vanilla JavaScript — no framework, no bundler. Translatable
  text carries a `data-i18n` attribute.
- Both languages are kept in step: a new string needs its entry in every
  locale, and a change to `README.md` usually needs the same in
  `README.ru.md`.

## Testing a change

Run against the built-in mock data, no firewall required:

```bash
cp .env.example .env
sed -i 's/^MOCK=0/MOCK=1/' .env
docker compose up -d --build
```

The UI comes up on <http://127.0.0.1:8080>. Check the sections your change
touches in both languages and both themes — the switches are on the login page
and in the sidebar.
