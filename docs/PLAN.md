# All-in-One Arabic Stremio Addon — Build Plan

**Goal:** one addon, one install button, zero configuration for the user. It bundles the
catalogs, streams and subtitles of the 8 sources below behind a single manifest.

**Status of this document:** reconnaissance is done against the live endpoints. Everything
marked *(measured)* was actually tested on 2026-10-16, not assumed.

---

## 1. What the sources actually are

| # | Source | Resources it gives us | Auth | Measured latency | CORS |
|---|--------|----------------------|------|------------------|------|
| 1 | Streaming Catalogs (`baby-beamup.club`, id `pw.ers.netflix-catalog`) | `catalog` only — 40 boards (20 services × movie/series) | none | catalog 1011 ms (98 items, 256 KB) | `*` |
| 2 | HdHub (`hdhub.thevolecitor.qzz.io`) | `catalog` (4 boards, custom type `HdHub`), `stream` | none | stream 410 ms (19 streams), catalog 353 ms | `*` |
| 3 | PenguPlay (`pengu.uk`) | `stream`, `subtitles`, `meta`+`catalog` for `tv` | **token from Telegram bot `/token`** | stream 200 ms → returns `"You must sign in"` without token | `*` |
| 4 | OpenSubtitles PRO (`opensubtitlesv3-pro.dexter21767.com`) | `subtitles` | none — it 302-redirects to `opensubtitles.stremio.homes` | 2289 ms (43 subtitles) | `*` |
| 5 | Dramayo (`dramayo.stream`) | `catalog` (16 boards), `meta`, `stream`, `subtitles` | none (`installId` is just a random UUID) | stream 644 ms, meta 1279 ms, catalog 829 ms | `*` |
| 6 | Anime Kitsu (`anime-kitsu.strem.fun`) | `catalog` (6 boards), `meta`, `subtitles` — **no streams** | none | catalog 416 ms (50 items), meta 307 ms | `*` |
| 7 | Flix-Streams Free (`free.flixnest.app`) | `stream`, `catalog` (3 `tv` boards), `meta` | none | stream 644 ms (8), catalog 855 ms | `*` |

### Findings that shape the design

1. **All sources are CORS-enabled and public** (except PenguPlay's token). Good news: the
   aggregator can be a thin server-side proxy with no fancy handling.
2. **Every config is baked into the URL** as a base64 path segment, e.g.
   `hdhub.thevolecitor.qzz.io/<base64>/manifest.json`. Verified: PenguPlay accepts
   `/e30/manifest.json` (`e30` = base64 of `{}`). So a "config" is just a JSON blob in the URL.
   We can snapshot these blobs in one file and never show a settings page.
3. **HdHub returns presigned S3 links that expire in ~8h** (`X-Amz-Expires=28800`). We must
   therefore *not* cache stream responses for long, or users get dead links.
4. **PenguPlay's token is used at stream time, not at manifest time.** `pengu.uk/manifest.json`
   and `pengu.uk/e30/manifest.json` both return the full manifest without a token; only
   `/stream/...` returns the "You must sign in" placeholder. This is what makes per-install
   token storage possible without asking the user to re-add the addon.
5. **Flix-Streams `tv` catalogs use `dlstreams:` ids**, and HdHub/Kitsu catalogs come back with
   `type: "movie"` / `"series"` items even though the *board* type is `HdHub` / `anime`.
   So stream routing must be by item type + id prefix, not by board type.
6. **Kitsu has no streams and Flix-Streams' `meta` returns an HTML error page for `tt` ids.**
   Blindly fanning out to every source would add latency and break things. Routing must respect
   each source's declared capability map.
7. **Donation/Discord noise exists in HdHub streams** (`name: "🌟 Donation needed."`,
   `externalUrl` instead of `url`). The "opinionated" pass should strip anything not playable.

---

## 2. Feasibility verdict

**Yes, this is buildable, and it is not hard.** It is a request-routing + response-merging
service, roughly 600–900 lines of TypeScript. No scraping, no accounts, no database required.

Three caveats to accept up front:

- **You cannot host the running addon on GitHub Pages.** Pages is static files only; Stremio
  needs a live endpoint that fans out requests. GitHub hosts the *code* and the *deploy
  pipeline* for free; the running service goes on a free edge/serverless host (§8).
- **PenguPlay is the one thing that cannot be truly one-click**, because its token comes from a
  Telegram bot. Plan: optional field on the install page, skipped by default (§7).
- **Streams are the volatile part.** Presigned URLs expire, upstream scrapers break. Design for
  "return partial results, never error" (§11).

---

## 3. Architecture

```
Stremio client
     │  https://<host>/<installConfig>/manifest.json
     │  https://<host>/<installConfig>/stream/movie/tt0111161.json
     ▼
┌──────────────────────────────────────────────────────────┐
│  Aggregator Worker (single entry, ~7 upstreams)          │
│                                                          │
│  1. decode <installConfig>  (base64url JSON)             │
│  2. pick owners for (resource, type, id) from table       │
│  3. fan out in parallel, 5s budget, Promise.allSettled    │
│  4. merge + dedupe + rank (streams/subtitles only)        │
│  5. filter noise, add source badges, cache               │
└──────────────────────────────────────────────────────────┘
     │            │           │            │
   HdHub      PenguPlay   OpenSubs     Kitsu / Dramayo
   (+ Dramayo, Flix-Streams, Streaming Catalogs)
```

Two request classes:

- **Passthrough** (`catalog`, `meta`): one upstream owns the request → stream the upstream body
  straight through, no JSON parse. Keeps CPU near zero (the Netflix catalog board is 256 KB;
  parsing it is wasted work).
- **Merge** (`stream`, `subtitles`): parse each upstream's small JSON, combine, rank, return.

---

## 4. Manifest merging — exact rules

Built once at module load from a static table:

- `id`: `community.arabic-all-in-one` (must be stable forever — Stremio keys installs on it)
- `types`: `movie`, `series`, `tv`, `anime`, `HdHub` (union of everything used)
- `resources`: mixed form, using each upstream's own capability declaration:

```jsonc
"resources": [
  "catalog",
  { "name": "stream",    "types": ["movie","series","tv"], "idPrefixes": ["tt","tmdb:","kitsu:","dlstreams","pp-live:"] },
  { "name": "subtitles", "types": ["movie","series"],      "idPrefixes": ["tt","kitsu:"] },
  { "name": "meta",      "types": ["anime","tv"],          "idPrefixes": ["kitsu:","dlstreams","essential","pp-live:"] }
]
```

Deliberately **not** declaring `meta` for `tt` movie/series: Cinemeta (built into Stremio)
already does that better than any of these sources, and Dramayo's/Flix-Streams' meta is thin.
This avoids ugly detail pages and removes a whole class of routing bugs.

- `idPrefixes` at top level: omit it. We need `tt`, `tmdb:`, `tvdb:`, `mal:`, `kitsu:`, `anidb:`,
  `anilist:`, `imdb:`, `d1:`, `essential`, `dlstreams`, `pp-live:`. Declaring the union is
  error-prone and gains little; omitting just means we get called for ids we then drop.
- `catalogs`: curated default set (§6), full set available via install flag.
- `behaviorHints.configurable: false` and no `config` array → **this is what makes it
  "one button"**. Stremio shows no Configure button.

---

## 5. Per-resource routing table

| Resource | Rule |
|---|---|
| `catalog` | Route by exact `(type, id)` → the one owner. Unknown id → `{"metas":[]}`. Pass `extra`/`skip`/`genre`/`search` through untouched. |
| `meta` | Only for `anime` (Kitsu), `tv` (Flix-Streams → Pengu). First non-empty wins. |
| `stream` | Fan out to every source whose capability map covers `(type, id)`: HdHub, PenguPlay, Flix-Streams, Dramayo. Kitsu excluded (no stream resource). |
| `subtitles` | Fan out to OpenSubtitles PRO, Dramayo, PenguPlay. Kitsu only for anime ids. |

Stream merge algorithm:

1. Fire all owners in parallel with a per-source `AbortController` timeout (5s) and
   `Promise.allSettled`.
2. Drop non-playable entries: no `url` **and** no `infoHash` → drop (this removes the donation
   and Discord rows automatically).
3. Dedupe, key priority: normalized `url` → `infoHash + fileIdx` → `behaviorHints.filename +
   videoSize`. HdHub and Flix-Streams both scrape HDHub, so expect real duplicates.
4. Rank: resolution (2160 → 1080 → 720 → 480 → unknown), then `videoSize` desc, then source
   priority (`hdhub > pengu > dramayo > flix`). Stremio renders in returned order, so this is the
   ordering the user sees.
5. Optional badge: prefix `name` with a short source tag when the upstream doesn't already brand
   itself (most do — keep their labels, they're informative).

Subtitle merge:

1. Fan out, 6s budget (OpenSubtitles PRO alone measured 2.3 s).
2. Drop `url`-less entries; dedupe on `lang + url`.
3. Sort: **Arabic first**, then English, then everything else; inside a language, upstream
   priority then `score`/`downloads`.
4. Cap the list (~25) so the picker stays usable.

---

## 6. Catalog curation (the "opinionated" part)

Raw union = ~69 boards. That is the opposite of opinionated — a wall of 69 rows on first open.

Proposed default (~18 boards):

- **Streaming Catalogs**: Netflix, Disney+, Prime Video, Apple TV+, HBO Max, Shahid-like gaps
  filled by Dramayo, Paramount+ — movie + series. Drop the niche services for most users
  (MagellanTV, Curiosity Stream, Criterion, BritBox, Acorn, Shudder, Mubi, Starz, Viki, iQIYI,
  Peacock, Hulu, Netflix Kids, Crunchyroll, Discovery+).
- **Dramayo**: Discover, Korean, Chinese, Japanese — series only.
- **Kitsu**: Trending, Top Airing, Most Popular.
- **HdHub**: Featured Movies, Featured Series.
- **Flix-Streams**: Events, DLStreams Top Channels.

Escape hatch: install URL flag `f=full` gives all 69 boards; `f=min` gives ~10. The curated
set lives in one array in `src/catalogs.ts` so it is a one-line edit.

---

## 7. Per-install config and the PenguPlay token

**Encoding:** the install config *is* the credential, in the URL, exactly like every upstream
source does it. No database.

```
https://<host>/<base64url(JSON config)>/manifest.json
```

```jsonc
{
  "v": 1,                       // schema version, so old links keep working after changes
  "p": "<penguplay token>",     // optional; absent → PenguPlay skipped silently
  "w": "<random uuid>",         // per-install id (Dramayo's installId equivalent)
  "c": "curated"                // catalog set: curated | full | min
}
```

- **Saving the token per install** is solved by putting it in the install URL. Nothing to store,
  nothing to lose, survives restarts, and it is what Stremio itself persists.
- `/manifest.json` with no config also works and serves the default config → plain URL is a valid
  install.
- Token is never logged. `wrangler tail` debugging must redact it.
- Optional upgrade later: a KV-backed short id (`/s/<shortid>/manifest.json`) so settings can be
  changed after install without re-adding the addon. Not needed for v1.
- Do **not** ship a shared maintainer token as the default. It would work until the first rate
  limit or revoke, and it makes one account responsible for every install's traffic.

---

## 8. Hosting — options and recommendation

### Capacity math — the number that matters

Free tiers meter **requests, not installs.** Installing costs nothing; an unused install costs
nothing forever. What costs is daily use:

| User action | Requests to us |
|---|---|
| Opening Stremio (Home board) | ~10–20 — one per catalog row |
| Scrolling a row for another page | +1 each |
| Opening a title | 0 — we deliberately do not declare `meta` for `tt` (Cinemeta handles it) |
| Opening the stream list | 1 — fans out to 5 upstreams, still 1 request to us |
| Playback starts (subtitles) | 1 |

≈ 20–50 requests per **daily active user**, 100+ for heavy users.

> **100,000/day ÷ ~30 ≈ 3,000 daily active users.**

Correction to an earlier assumption: **caching does not extend our own quota.** On Workers, a
cache hit inside the script is still an invocation (static assets are the only exception).
Caching exists to protect the upstreams (§10), not to buy us headroom.

### Options

| Option | Real free limit | ≈ Daily actives | Catch |
|---|---|---|---|
| GitHub Pages | static only | — | Cannot run the addon; landing page only |
| **Cloudflare Workers Free** | 100k req/day, 10 ms CPU, 50 subrequests/req | **~1,500–3,000** | Hard cap (Error 1027) at midnight UTC |
| **Cloudflare Workers Paid** | 10M req/month incl. | **~10,000+** | **$5/month** — cheapest fix by far |
| Vercel Hobby | 1M invocations/month | ~1,000 | Non-commercial clause; cold starts |
| Netlify Free | 125k invocations/month | ~400 | Too low |
| Deno Deploy | ~1M req/month | ~1,000 | Lower than Workers |
| Oracle Always Free | 2 OCPU / 12 GB ARM, **no request cap** | unlimited | Sysadmin work; Oracle halved this tier in Jun 2026 unannounced; "out of capacity" for new signups |
| Render / Fly / Glitch free | sleeps | 0 | Disqualified — Stremio times out on cold starts |

**Recommendation:** start on **Workers Free**, code against plain `fetch` so the host is a
one-line change, and budget the **$5/month** upgrade as the fix when it outgrows free. For a
$0-forever path, shard installs across 3 free Workers (`a1.`, `a2.`, `a3.`) → 300k/day, with the
install page picking one at random: same codebase, three deploys.

### Upstream load, stated accurately

One user opening one title = **5 requests to 5 volunteer-hosted addons** — and a direct install of
those same 5 addons would have produced the same 5 requests. So proxying does **not** multiply
upstream load; it is the fan-out Stremio would have done itself, issued from a different IP. Two
consequences remain:

1. **IP concentration.** Direct installs arrive from thousands of residential IPs; ours all arrive
   from a handful of Cloudflare egress IPs. Scrapers that rate-limit or blocklist datacenter/VPN
   ranges can block us wholesale in a way they would never block one user. Evidence the ecosystem
   cares: PenguPlay ships an `emulate_vpn` ("spoof client IP") switch. Mitigations: Cloudflare
   egress is usually tolerated; monitor per-source success rates on `/status`; if a source
   hard-blocks datacenter IPs, document installing that one addon directly as a fallback.
2. **Users who would have installed only one addon** now trigger all five. The shared edge cache
   (§10) is what keeps this within what the upstreams can absorb: 1,000 users opening the same
   trending title must collapse into **one** upstream fan-out per TTL window, not 1,000.

### What we never pay for: bandwidth

We return JSON containing a URL. A 4 GB movie costs us ~0 bytes — the media flows from the CDN or
torrent swarm straight to the user and never touches our server. Workers does not charge egress.
**Request count is the only meter that runs.**

**Pipeline:** code on GitHub → GitHub Actions runs `wrangler deploy` on push to `main` using a
`CLOUDFLARE_API_TOKEN` repo secret. Free, and it satisfies "hosted on GitHub for free" in the
sense that matters: GitHub is the source of truth and the CI.

**One gotcha:** `*.workers.dev` is blocked by some ISPs/regions. Attach a custom domain
(any cheap domain, or a free subdomain provider) before sharing the install link publicly.

Landing page is served by the Worker itself at `/` (it must generate absolute install URLs for
its own origin anyway), plus `/status` for a per-upstream health view — genuinely useful when a
scraper dies and users start complaining.

---

## 9. Repo layout

```
src/
  index.ts        router: /, /status, /manifest.json, /:cfg/manifest.json,
                  /:cfg/{catalog,meta,stream,subtitles}/:type/:id.json
  upstreams.ts    THE table: id, base URL, baked config, capabilities, timeout, priority
  config.ts       base64url encode/decode + schema versioning + defaults
  merge.ts        stream/subtitle merge, dedupe, ranking
  catalogs.ts     curated / full / min catalog sets
  cache.ts        caches.default wrapper + per-resource TTLs
public/index.html one-button install page (+ optional Pengu token field, QR/copy fallback)
.github/workflows/deploy.yml
docs/PLAN.md
wrangler.toml
```

`upstreams.ts` is the whole maintenance surface. If an upstream rotates its config or dies, that
is a one-line change and a push — and **existing users get the fix with no reinstall**, which is
the single biggest product win of the proxy design over handing people 8 separate addons.

---

## 10. Caching plan

| Route | TTL | Why |
|---|---|---|
| `manifest` | deploy-time constant | Never changes without a deploy. |
| `catalog` | 10 min | Changes slowly; upstream payloads are large. |
| `meta` | 1 h | Stable. |
| `subtitles` | 10 min | OpenSubtitles is the slowest source (2.3 s) — biggest cache win. |
| `stream` | **2 min or `no-store`** | Presigned URLs expire in ~8 h (measured); stale links are worse than a slow request. |

Also honor upstream `Cache-Control` where present and add a 15 s in-flight de-dupe so two Stremio
screens opening at once don't double the fan-out.

**Purpose:** this protects the *upstream volunteer hosts* (§8). It does not extend our own
request quota — cache hits on Workers still count as invocations. The goal is that 1,000 users
opening the same title collapse into one upstream fan-out per TTL window.

---

## 11. Failure modes

| Failure | Mitigation |
|---|---|
| Upstream down / slow | Per-source timeout, `allSettled`, return partial results. |
| All sources fail | Return `{"streams":[]}` with HTTP 200 — Stremio shows "no streams", not an addon error. |
| Upstream changes config format | Baked configs are snapshots; regenerate + push. Versioned schema keeps old links alive. |
| Upstream adds auth / rate limits | Per-source `enabled` flag in `upstreams.ts`. |
| Presigned URL expiry | Short stream TTL (§10). |
| Worker CPU budget | Passthrough for catalog/meta, parse only small stream/subtitle payloads. |
| Addon not "verified" | Upstreams signed by `stremio-addons.net` show a verified badge; ours will not. Unsigned addons still install by URL — **must be confirmed on a real client in M1**, since newer Stremio builds warn. |

---

## 12. Risks, stated plainly

- **Legal:** the addon proxies links to streams that are, in most jurisdictions, unlicensed. The
  aggregator hosts no content and caches no media, but the repo and the worker are still the
  visible target. Expect takedown attempts if it gets popular; keep the project a neutral proxy
  with no bundled titles, no search index, no promotion.
- **Upstream churn:** these are community scrapers. HdHub/Flix-Streams already share sources, so
  one upstream breaking breaks two rows.
- **Not a security issue but worth knowing:** the install URL contains the Pengu token, so
  anyone with the link has the token. Same trade-off every Stremio addon in this list makes.

---

## 13. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Recon | ✅ done — manifests, endpoints, auth, latency, CORS measured |
| M1 | Skeleton worker | `/:cfg/manifest.json` returns the merged manifest; installs in Stremio on desktop **and** web; no Configure button; unsigned-install behavior confirmed |
| M2 | Catalogs | Curated boards render; `skip`/`genre`/`search` passthrough works; latency within ~1 s |
| M3 | Streams | 4-source fan-out, dedupe, noise removed, ranked; partial results on upstream failure; measured p50 < 1.5 s |
| M4 | Subtitles | Merged, Arabic-first, capped, deduped |
| M5 | Install page | One big button → `stremio://` deep link; copy-URL fallback for Android TV / iOS; optional Pengu token field with Telegram instructions |
| M6 | Ship | GitHub Action deploy, custom domain, `/status`, README with screenshots |
| M7 | Later | KV short links (settings change without reinstall), unified cross-source search board, per-user source toggles behind a "power" URL flag |

**M1 is the gate.** If the merged manifest installs and its catalog boards render in a real
client, the rest is mechanical.

---

## 14. Open decisions (need your call)

1. **Host:** Cloudflare Workers (recommended) or Vercel?
2. **PenguPlay:** optional token field (recommended) / ship without it / share one token?
3. **Catalog set:** curated ~18 (recommended), minimal ~10, or all ~69?
4. **Subtitles:** Arabic-first then English (recommended), Arabic only, or all languages?

---

## 15. Rejected alternative: account-based addon manager

**Proposal:** skip the addon entirely; build a site where the user logs in with their Stremio
account, and we push all sources into their addon collection via `api.strem.io`. Then Stremio
talks to each source directly and we serve **zero** runtime requests.

**Technically real.** Verified 2026-10-16 with a dummy key:

```
POST https://api.strem.io/api/addonCollectionGet  {"authKey":"000…"}
→ 200 {"error":{"code":1,"message":"Session does not exist"}}
```

A session validation, not a 404 — so `/login` → `authKey` → `addonCollectionGet` →
`addonCollectionSet` works. This is how bulk-import tools operate.

**What it genuinely gets right**

- Runtime request count: zero. The quota problem is deleted rather than reduced.
- Fan-out would come from the user's residential IP, not Cloudflare egress — this fixes the
  datacenter-IP risk in §8.
- Account addons sync across devices, so the write is persistent.

**Why it is rejected**

1. **Requires handling full-account credentials.** `authKey` is an all-access bearer credential,
   not a scoped token. Asking a non-technical community to enter their Stremio password is
   indistinguishable from phishing, invites accurate abuse reports, and puts real accounts at risk
   if the site or repo is ever copied or compromised. It also violates Stremio's ToS on automated
   account access.
2. **The update paradox.** Shipping a silent fix (e.g. HdHub rotating its config) would require
   writing to every user's account again, which requires **storing their authKey at rest** —
   encryption, a database, breach response, for a free community addon. Without storage, users
   must re-run the manager, which recreates the exact problem this project exists to solve.
3. **It discards the *presentation*, not the curation.** (Corrected 2026-10-16 — the original
   claim here was wrong.) Most opinionation lives in each upstream's own **config URL**, not in
   the proxy. Proof: the Streaming Catalogs config decodes to a comma-separated service list
   (`nfx,dnp,amp,atp,hbm,pmp,…,iqi::US:…`); rebuilding it as `nfx,dnp,amp,atp,hbm` and fetching
   that manifest returns exactly 5 services / 10 boards instead of 20 / 40. The same lever exists
   for Dramayo (`enabledCatalogs`), HdHub (`catalogs`, `content`, `qualities`, `sort`), PenguPlay
   (sources, resolutions, audio languages) and OpenSubtitles PRO (`langs:["arabic"]`).

   **Survives a direct-install bundle:** which catalog boards exist, which stream sources are
   enabled, quality/audio filters, Arabic-only subtitles, and users never seeing a configure page.

   **Does not survive:** merging 5 stream lists into one ranked list (Stremio shows one collapsible
   group per addon), cross-source dedupe (HdHub and Flix-Streams both scrape HDHub), stripping
   HdHub's donation/Discord rows, cross-addon subtitle ordering, a single entry in the addons
   list, and silent updates when an upstream rotates its config.
4. **Unofficial API.** `api.strem.io` is undocumented and can change without notice, breaking
   users' accounts mid-flight — a worse failure mode than an addon returning an empty list.

**Trade summary:** it swaps a **$5/month** problem for a **credentials** problem. Monthly cost can
be bought away; credential exposure cannot.

**Correct context for it:** a private tool for yourself and a few consenting friends. Not a public
community addon.

**If quota ever actually bites**, the levers are, in order: (1) fewer curated catalog boards —
catalog traffic is the majority of requests and is pure passthrough; (2) shard installs across
several free Workers (§8). Neither involves credentials.

---

## 16. Option C: static bundle page (zero infrastructure)

If zero recurring cost and zero maintenance outrank "one addon", the same curated configs can be
baked into a **static GitHub Pages site** with one install button per source:

- Cost: **$0 forever — no server, no quota, no credentials.** Nothing to run, nothing to monitor.
- UX: ~6 installs (one per source), each a single click from one page. Not one button.
- Keeps: every config-level curation (§15), including the optional PenguPlay token field.
- Loses: stream merging/dedupe/ranking, donation-spam stripping, a single addon entry, silent fixes.

**A and C share most of their code**: the upstream config table, curated catalog sets, PenguPlay
token encoding and the landing page. Sensible sequencing is to build that shared core, ship **C
immediately at zero risk**, then add the proxy (A) later behind the same page as a second button —
*"One addon (recommended)"* vs *"Install individually (no server, works forever free)"*.

### The catches

1. **It fails the original brief.** Six installs is "learning how to add stuff", six times. On
   Android TV / Firestick — a large share of the regional audience — `stremio://` deep links often
   have no handler, so each install becomes a manual copy-paste into *Add-on Repository URL*.
2. **Maintenance does not disappear; it moves somewhere unreachable.** In A, a broken upstream is a
   one-line push that fixes everyone. In C the config URL is frozen into the user's account at
   install time, so a broken upstream is unfixable by us — and Stremio's documented behaviour is
   that Uninstall → Install does **not** reload the manifest; the user must paste the URL again.
   Effectively: "everyone please reinstall", which non-technical users will not do.
3. **PenguPlay is effectively lost.** Its per-user Telegram token cannot be injected by a static
   page. Either drop the source, or push users into a Telegram bot flow harder than everything else
   in the setup combined.
4. **Six Configure buttons come back.** Every upstream declares `behaviorHints.configurable: true`,
   so each installed addon shows a Configure button opening the upstream's settings page — a
   one-click way for a non-technical user to destroy a curated config. A declares
   `configurable: false` and has no such button.
5. **The polish is gone.** No merged/ranked stream list (each addon contributes its own labelled
   block); HdHub and Flix-Streams both scrape HDHub so the same file appears twice; and HdHub's
   `🌟 Donation needed.` / `💬 Join the Discord` rows appear in every stream list because nothing is
   filtering them. *My Addons* shows 7 entries instead of 1.

**What is not a catch:** catalogs are fully curable (§15); configs do not expire (verified — a
year-2001 timestamp still works); Stremio's own search already fans out across installed addons;
subtitles are additive, so Arabic-only OpenSubtitles loses only cross-addon ordering; the
legal/privacy posture is strictly better (no server, no IPs seen, no tokens held); and it keeps
working even if this project disappears.

### The escape hatch worth testing before committing

AIOStreams already performs stream fan-out, dedupe, sorting and filtering, is hosted free on public
instances, and installs from a generated manifest URL. If that config can be baked into a
self-contained URL, C becomes: curated catalog addons + Arabic-only OpenSubtitles + **one
pre-configured AIOStreams** ≈ 3–4 installs, *with merging*, at $0 and no server of ours.

**Verify first:** ElfHosted's AIOStreams config is described as "password-protected" with a saved
user, which may mean the manifest URL is a short server-side id rather than an embedded config — in
which case every user shares one config on someone else's instance, subject to their rate limits.
Test before designing around it.

### Cost is already hard-capped on Workers Free

Worth stating plainly, because it removes the main objection to A: **Workers Free cannot bill you.**
It is not metered-with-overage — it is 100,000 requests/day, then Error 1027 until midnight UTC. No
card on file, no billing relationship, no surprise invoice. The entire downside of exceeding the
quota is that the addon returns errors for a few hours. Budgeting for unknown user counts is
therefore unnecessary; nothing needs to be budgeted.


