# Plan C: عمو ستريميو, the static Arabic installer page

**What this is.** The build plan for Option C from `docs/PLAN.md` §16: one static Arabic page that
installs the curated sources into a user's Stremio with settings baked in, running on GitHub Pages
with no server, no database, no credentials, and no recurring cost.

**What it is not.** Not a proxy, not an addon, not a manager. Nothing here talks to Stremio's API,
and nothing here runs at request time. The page builds install URLs in the browser and hands them
to Stremio. `docs/DESIGN.md` holds the visual direction; this file holds everything else.

**Status:** reconnaissance done for two of seven sources; the other five need a config capture pass
(M1). Costs verified. One open contradiction resolved, one flagged (§5).

---

## 1. The honest pitch, and where the value actually is

C's weakness from §16 is texture: seven separate installs, and no remote fix when an upstream
breaks. The page cannot remove either. It can do one thing that changes the experience: **make seven
installs feel like one procedure.**

So the page is not a landing page with seven buttons. It is a numbered walkthrough with progress
that persists, where each step carries exactly one action, and the one step that needs real work
(the token) is expanded with the instructions inline.

The second lever is honest and happens to be large: **Stremio stores addons in the account**, which is
why the account API exposes `addonCollectionGet` and `addonCollectionSet`. A device signed into that
account reads the same collection, so a reader who installs on the phone should find everything
already on the TV. That is the difference between "seven pastes on a TV remote" and "do this once on
your phone".

The evidence is strong but indirect, so the copy is written **conditionally** rather than as a
promise: if you are signed into the same account on the TV, the addons arrive there, with the
copy-and-paste path given in the same breath for anyone watching without an account. Written that
way, an edge case in syncing cannot make the page wrong. M1 confirms it on a real device, and
nothing is blocked on it.

## 2. Scope guard

In: one page, seven steps, the token flow, a recovery section, a real FAQ.

Out, deliberately: a search box, an account, a settings page, a "choose your sources" picker, a
proxy, analytics, an addon of our own. Every one of those reintroduces the server or the
configuration the whole option exists to avoid.

## 3. Page structure, in order

1. **Wordmark + theme toggle.** The name as text, dark by default, a working light theme behind the toggle.
2. **Opening.** One headline, one sentence, one primary button that scrolls to step one. No badge
   above the headline, no stats, no screenshot we have not captured.
3. **Before you start.** Two facts the reader needs before the steps: they need Stremio installed,
   and they should be signed into the same account they use on the TV. This is where the sync
   assumption is stated, so it is also where it is verified or dropped.
4. **The seven steps.** Each step is one card: Latin source name, what it gives you in Arabic, the
   install action, the copy-link fallback, and a "added it" mark that persists per device.
5. **The token step (step seven).** The only step with an input, so it is expanded in place instead
   of being left as a bare card (§5).
6. **Recovery.** What to do when a row empties, including Stremio's own reinstall trap (§9).
7. **FAQ.** Four questions this product's users actually ask, all of them answered honestly (§8).
8. **Footer.** Only links that exist.

## 4. The steps and the order

Order is a decision, not a listing (R-31). Catalogs come first because the home board is the first
thing a reader sees working. Streams come next, subtitles after, and the token step last, so a
reader who stops early still has a working Stremio.

| # | Source | What the card says it gives | Config baked | Verified |
|---|---|---|---|---|
| 1 | Streaming Catalogs | Netflix, Disney+, Prime, Apple TV+, HBO Max rows, films and series | none needed, the bare URL already serves those five services | yes, 10 boards |
| 2 | Dramayo | Subtitled Asian series: Korean, Chinese, Japanese | curated `enabledCatalogs` | no, capture in M1 |
| 3 | HdHub | Watch sources for films and series | curated `catalogs`, `content`, `qualities` | no, capture in M1 |
| 4 | Flix-Streams | Extra watch sources, including live channel rows | curated config | no, capture in M1 |
| 5 | Anime Kitsu | Anime rows and details | none exists, 6 fixed boards | n/a |
| 6 | OpenSubtitles PRO | Arabic subtitles | `langs: ["arabic"]` | no, capture in M1 |
| 7 | PenguPlay | Fast watch sources, needs a personal token | `auth_token`, sources, qualities | partly, see §5 |

Two consequences worth writing down now:

- **Steps 3 and 4 overlap.** HdHub and Flix-Streams both scrape HDHub, so the same file can appear
  twice. With no proxy we cannot dedupe it. The card for step 4 says so plainly rather than letting
  the reader think something is broken.
- **Kitsu has no configure page at all**, so its card is the only one with no copy-link variant of a
  config choice. It still gets a copy-link button, because the URL still has to reach a TV.

A correction from the capture pass, worth keeping because it is exactly the sort of thing that would
otherwise have shipped broken: the config string this plan first recorded for Streaming Catalogs,
`nfx,dnp,amp,atp,hbm::US:1792122105697:0:0:SA`, returns **two** boards, not ten. The bare manifest URL
returns precisely the ten the card promises, one movie and one series board per service. Every config
path tried collapses the response to a single `netflix-top10-global` pair, so the bare URL is the
correct install and nothing is baked at all.

## 5. The token step, in full

### 5.1 What I verified

| Question | Finding |
|---|---|
| Which key does the bot's token belong in? | PenguPlay's own sign-in panel says: "Don't have a token? Request one from the PenguPlay Telegram bot or join the PenguPlay Discord server and type `/token` to receive your token." That panel writes `auth_token`. So the bot issues an **auth token**. |
| What is `donor_token` then? | A separate perk. The upstream tooltip: "Paste your donor token here to hide announcements. Get one from an admin." Not our field, not our business. |
| Is the config format stable? | Yes. Flat JSON, url-safe base64 in the path, no padding needed. Verified: `{"donor_token":"TESTTOKEN123","subtitles_disabled":"on"}` fetched back a valid manifest. |
| Can we prove which field works without a real token? | No. Both `auth_token` and `donor_token` with a bogus value return the identical placeholder, `"Your PenguPlay authentication is missing, invalid, or revoked"`. So the field choice is a testable assumption, not a proven fact. |
| Where does the auth check happen? | Before source fan-out. A config with a source enabled and no valid token returns the same single placeholder stream. |
| Sources available to curate | `source_4khdhub`, `source_2peckle`, `source_vegamovies`, `source_moviebox`, `source_moviesdrives`, `source_miruro`, plus anime and live sites. Upstream's own default: `4khdhub, 2peckle, vegamovies, moviebox, moviesdrives, miruro`. |
| Other useful keys | `provider_order`, `sort_by`, `group_by`, `max_size_gb`, `min_size_gb`, `max_timeout`, `timezone`, `live_sport_football`, `live_site_daddylive` and friends. |

### 5.2 The flow the page implements

1. Open the bot. Primary control is a normal tappable link to `https://t.me/PenguPlayBot`, because
   a phone cannot scan a QR code displayed on itself.
2. Send `/token`.
3. Copy the reply.
4. Paste into the field. The page then builds
   `https://pengu.uk/<urlsafe-base64({"auth_token": "...", ...curated sources...})>/manifest.json`
   in the browser and enables the install button.

The QR code is the **secondary** path and the page says why: it is for the reader whose TV or laptop
is showing this page and whose phone is free to scan it. That is a real reason for the image to
exist, rather than a decoration. The image itself is generated from the bot URL by
`tools/make-qr.py` and decoded back with an independent decoder to confirm what it carries, so it is
derived data rather than a file somebody has to save by hand.

Fallback line, because a dead end here loses the reader: if the bot does not answer, the Discord
server takes the same `/token` command (invite from the upstream configure page).

### 5.3 Field details that matter

- `autocapitalize="off" autocorrect="off" spellcheck="false"`, or a phone keyboard mangles the token.
- Paste is handled explicitly, plus typing. A short value shows a soft warning ("the token is usually
  longer, check the copy") rather than blocking, because a length heuristic can be wrong.
- The token is never logged and never leaves the page. The page has no network calls at all, which
  is what makes the sentence "your browser builds the link, nothing is sent anywhere" true rather
  than aspirational, and it is checkable in devtools.

### 5.4 The token is free, and the donation bar is a different thing

Owner-confirmed (2026-10-16): `@PenguPlayBot` hands out `/token` to anyone, at no cost. So step seven
states that plainly instead of hedging around it.

Worth separating, because the upstream is confusing to read from the outside: PenguPlay's configure
page also runs a donation progress bar, and HdHub injects donation rows into its streams. That money
keeps the upstream projects alive. It is not a paywall in front of the token, so the step can say the
token is free without contradicting anything the reader may have seen elsewhere.

This is an owner-supplied fact rather than something measured here, and it cannot be tested without a
Telegram account, so it is recorded as such rather than dressed up as a verification. What stays
testable in M1 is the one thing that matters technically: that a real token in `auth_token` produces
visible streams.

## 6. What still needs capturing (M1)

The five unverified configs are mechanical to obtain, and the procedure is the same for each:

1. Open the upstream's configure page and read the config schema out of it (that is how the
   PenguPlay keys above were found, from the page's own `buildConfig` function).
2. Choose a curated value for each field and write the JSON.
3. Base64url-encode it, fetch the resulting `manifest.json`, and **count what comes back**. A curated
   config is only accepted once the manifest proves it, the way the Streaming Catalogs config proved
   5 services and 10 boards.
4. Record the verified string in the table in §4.

The captures go in one place, `web/app.js` as a `UPSTREAMS` array, which is the entire maintenance
surface of this project. When an upstream rotates its format, that array is the one-line fix, and the
cost of the fix is that every user must revisit the page (the trade-off from §16, restated in §9).

### Resolved in the capture pass (2026-10-16)

Recorded so a later session does not re-derive them. Every host answered, and the table in `web/app.js`
points each card at its base.

| Source | Base | Card state |
|---|---|---|
| Streaming Catalogs | `https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club` | captured, bare `manifest.json`, 10 boards |
| Dramayo | `https://dramayo.stream` | pending, `enabledCatalogs` |
| HdHub | `https://hdhub.thevolecitor.qzz.io` | pending, `catalogs`, `content`, `qualities` |
| Flix-Streams | `https://free.flixnest.app` | pending, config unknown until captured |
| Anime Kitsu | `https://anime-kitsu.strem.fun` | captured, and no configure page exists |
| OpenSubtitles PRO | `https://opensubtitlesv3-pro.dexter21767.com` | pending, `langs: ["arabic"]` |
| PenguPlay | `https://pengu.uk/<base64url>` | captured, encoder proved end to end |

The PenguPlay encoder is proved rather than assumed: the page's own output, fetched back, returns `200`
with `id: com.penguplay`. That `id` is the check that matters, because the addon answers `200` even for
a config it dislikes.

One format question was settled at the same time, since a wrong answer would have baked a dead button
into all seven cards. The install link is the manifest URL with its scheme swapped, nothing more:
`https://host/path/manifest.json` becomes `stremio://host/path/manifest.json`
(`stremio-addon-sdk/docs/deep-links.md`). The `stremio://install?url=<encoded URL>` form that some SDK
examples print is **not** a deep link the desktop shell understands: it reads `install` as the host,
builds `https://install/`, and fails with "Failed to fetch".

The corrected form was confirmed on a device on 2026-10-16: firing
`stremio://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club/manifest.json` at the Windows
protocol handler installed the addon, and the next read of Stremio's own store showed
`pw.ers.netflix-catalog` in the collection. What the same fix does not cover yet is a manifest URL
carrying a query string, which no captured config produces today, and the same click on a phone and
on a television, which stays in M3.

## 7. Copy deck (Arabic)

Written to the Arabic skill: verbal sentences, actors named, no calqued connectives, no trailing
`فقط` for restriction, no `تحديات` or `محوري`. Every string below is ready to ship. Where a claim
rests on the owner's word rather than on a measurement taken here, the note under it says so, so a
later reader can tell the two apart.

**Wordmark:** عمو ستريميو

**Headline:** إضافات ستريميو، جاهزة بضغطة واحدة

**Opening sentence:** سبع إضافات تفتح لك الأفلام والمسلسلات والأنمي والترجمة العربية في ستريميو. اخترنا
الإعدادات نيابةً عنك، فلا تضبط شيئاً بيدك.

**Primary button:** ابدأ الإضافة

**Before you start:** افتح هذه الصفحة على جوالك. وإن سجّلت الدخول في ستريميو بالحساب نفسه على التلفاز،
وصلت الإضافات إليه بلا عمل إضافي. وإن كنت تشاهد من غير حساب، فانسخ روابط الإضافات أدناه وألصقها على
التلفاز واحدة واحدة.
> NOTE: written conditionally on purpose (§1), so an edge case in syncing cannot make the sentence false.

**Steps heading:** الإضافات السبع

**Per-step controls:** أضِف إلى ستريميو · انسخ الرابط · أضفتها

**Progress:** الثالثة من السبع

**Step descriptions:**
1. صفوف Netflix و Disney+ و Prime و Apple TV+ و HBO Max، أفلاماً ومسلسلات.
2. مسلسلات آسيوية مترجمة: كورية وصينية ويابانية.
3. مصادر مشاهدة للأفلام والمسلسلات.
4. مصادر مشاهدة إضافية، وفيها صفوف قنوات مباشرة. بعض ملفاتها تتكرر مع الخطوة الثالثة، فالملف نفسه قد
   يظهر مرتين.
5. صفوف الأنمي وتفاصيله.
6. ترجمة عربية للأفلام والمسلسلات.
7. مصادر مشاهدة سريعة، وتحتاج رمزاً خاصاً بك.

**Token step heading:** الخطوة السابعة: PenguPlay

**Token step intro:** هذه الإضافة وحدها تطلب رمزاً. تصدره لك قناة PenguPlay على تيليجرام، ولا يكلّفك
شيئاً.

**Token steps:**
1. افتح محادثة البوت في تيليجرام. (control: افتح البوت)
2. أرسل إليه الأمر /token.
3. سيردّ عليك برمز. انسخه.
4. الصقه في الحقل أدناه، ثم اضغط زرّ الإضافة.

**QR caption:** أو امسح هذا الرمز بكاميرا جوالك. المسح ينفع حين تكون هذه الصفحة أمامك على التلفاز أو
الحاسوب.

**Bot fallback:** إن لم يستجب البوت، فانضم إلى سيرفر PenguPlay على ديسكورد، واكتب الأمر نفسه فيه.

**Token field:** label الرمز · placeholder الصق الرمز هنا · hint يطول الرمز عادةً، فتأكد أنك نسخته كاملاً.

**Privacy line:** يبني متصفحك الرابط هنا، ولا يرسل الرمز إلى أي جهة.

**Empty state:** لم تلصق رمزاً بعد.

**Recovery heading:** إن اختفى صف أو فرغت إضافة

**Recovery body:** يحصل هذا حين يغيّر المصدر عنوانه أو إعداداته. افتح هذه الصفحة، وأعد إضافة الصف الذي
اختلّ وحده. وفي ستريميو لا تكفي إزالة الإضافة ثم إضافتها، لأنه لا يقرأ الإعدادات من جديد؛ الصق الرابط في
خانة «رابط مستودع الإضافات» ليُعاد تحميله.

**Recovery honesty line:** هذه صفحة ثابتة، لا تصل إلى إضافاتك من بعيد. الإصلاح بيدك، وخطواته أعلاه.

**FAQ (questions worth asking about this product, not a template):**

| Question | Answer |
|---|---|
| هل تحتاج إلى حساب ستريميو وكلمة مروره؟ | لا. لا نطلب كلمة مرورك ولا نحتاجها. تُضاف الإضافات من جهازك مباشرة. |
| لماذا سبع إضافات ولا إضافة واحدة تجمعهنّ؟ | لأن الجمع يحتاج خادماً يعمل على مدار الساعة. اخترنا ألا نقف بينك وبين المصادر، فبقيت سبعاً، ولا نحتاج خادماً ولا مالاً. |
| هل يعمل على التلفاز؟ | نعم. وإن سجّلت الدخول بالحساب نفسه في الجوال والتلفاز، أضفت الإضافات مرة واحدة على الجوال فوصلت إليه. وإن لم تسجّل، نسختَ كل رابط وألصقته على التلفاز. |
| ما مصير الرمز الذي ألصقه؟ | يدخل في الرابط الذي تضيفه إلى ستريميو، ويبقى في جهازك. |

## 8. States

Every interactive element needs its three states, and the empty states say what to do rather than
that something is empty (R-27):

- **Token field:** empty (instruction to paste), filled (install enabled), invalid-looking (soft
  warning, keys still accepted), bot unreachable (fallback line promoted).
- **Copy-link button:** copied (label swaps to "نُسخ", reverts), and a fallback for browsers without
  `navigator.clipboard`, where the URL is shown in a selectable field instead. A copy button that
  silently fails on an older Android browser is worse than no button (R-26).
- **Step marks:** unmarked, marked, and the page's own summary of how many remain.
- **No network loading states exist, because the page makes no requests.** If an upstream is down,
  that shows up in Stremio, not here, and the recovery section is where we say so.

## 9. Recovery, and why it is a first-class section

This is C's core weakness made visible, and hiding it would be dishonest. The page cannot fix a
broken install. Stremio's own documented behaviour makes the user's recovery harder than it looks:
reinstalling by pressing Uninstall and then Install **does not reload the manifest**; the URL has to
be pasted again.

So the recovery section gives the exact sequence, names the trap, and states the limit. A reader who
understands this will actually recover; a reader who was promised silent fixes and got none will
leave.

## 10. Files, hosting, deploy

```
web/index.html            the page
web/app.css              design tokens + layout, mobile-first, RTL with logical properties
web/app.js               UPSTREAMS table, base64url encoder, progress, token flow, copy handling
web/assets/penguplay-qr.png   generated, never hand-saved
web/assets/fonts/*.woff2  subset Plex Sans Arabic, self-hosted
tools/make-qr.py          regenerates the QR from the bot URL
.github/workflows/pages.yml
docs/PLAN.md  docs/PLAN-C.md  docs/DESIGN.md
```

- **Hosting:** GitHub Pages. Repo is not a git repo yet, so M2 starts with `git init`.
- **Deploy:** the Pages Actions workflow with `path: web`, not branch publishing, because branch
  publishing only serves `/` or `/docs` and `docs/` holds the plans, which must not be published.
- **Why the upstream table is inlined in `app.js` rather than a JSON file:** a static page opened
  from disk cannot fetch a sibling JSON under `file://`, and inlining keeps the site a four-file
  drop-in with no build step (R-31).
- **No custom domain needed** for correctness. Worth knowing: `github.io` is reachable in the
  region far more reliably than the `workers.dev` problem noted in `PLAN.md` §8, but a custom domain
  is the fix if it ever is not.
- **RTL:** `dir="rtl"` with CSS logical properties (`margin-inline-start`, `padding-inline`) so the
  layout is not mirrored by hand.

## 11. Accessibility and mobile, specific to this page

Beyond the standard checks: every control is at least 44px with spacing between adjacent ones; the
phone layout is a designed state, not crammed desktop; the token input scrolls above the keyboard
when focused; no horizontal overflow, with the long upstream URLs contained rather than allowed to
widen the page; focus visible on every control in both themes; status is never color-only, so a
marked step also changes its text.

## 12. Decisions and open questions

Settled 2026-10-16. The owner delegated the remaining choices with one constraint, stay away from
generic colors such as purple. So: the amber accent (`docs/DESIGN.md` §6), IBM Plex Sans Arabic as the
typeface, and the Discord `/token` route included as the bot fallback.

Nothing is open before M1. The gate is the config capture in §6, and it depends on no decision.

Resolved after the first draft: **the QR code.** It is generated from `https://t.me/PenguPlayBot` by
`tools/make-qr.py`, decoded back with an independent decoder to confirm it carries that exact URL,
and it uses the site palette. The gradient QR saved out of Telegram is retired, so nothing has to be
hand-saved and no blue-to-pink tile sits inside a minimal warm page.

Resolved on the owner's word: **the token is free** (§5.4). Step seven now says so, and nothing has to
be verified before that copy is written.

## 13. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Recon | Done. 2 of 7 configs verified, token field identified, palette contrast computed, skills read. |
| M1 | Verify assumptions, capture configs | Hosts and two configs resolved (see §6); the 4 remaining configs captured and each proved by a manifest fetch that returns the expected boards; the token field confirmed against a real token. |
| M2 | Shell | Done. `web/` renders in both themes, no horizontal overflow from 305px to desktop, every control at least 44px, design tokens ported from `docs/DESIGN.md`, `git init` and first commit. The layout has exactly two states, phone at 480px and below, and a single column capped at 44rem above it, so phone and desktop cover tablet. |
| M3 | Steps | Seven cards, deep links open Stremio on a real device, copy fallback works where the clipboard API is absent, progress persists across reloads. |
| M4 | Token step | A real token produces a working PenguPlay install with visible streams; bot-unreachable path shows the fallback. |
| M5 | Recovery and FAQ | Both written, both reachable from the top, and the recovery sequence verified against the real Stremio UI. |
| M6 | Deploy and gate | Live on Pages; checked on a real phone and a real TV; the full antislop Delivery Gate run on the built page with recorded click-through. |
| M7 | Later | Test whether a bakeable AIOStreams config can collapse steps 3, 4, and 7 into one, which would cut the page to five installs. Not before M6. |

M1's real gate is the config capture: until the five remaining upstream configs are captured, and each
is proved by a manifest fetch that returns the expected boards, steps 1 through 6 are placeholder
strings rather than installs. The token field is the other testable item, and it is one string if the
guess is wrong. The device-sync question no longer gates anything, because the copy states it
conditionally (§1).

## 14. Risks, stated plainly

- **Silent breakage with no remote fix.** The central cost of C, unavoidable here. Mitigated only by
  the recovery section being good.
- **Config drift.** Upstreams can rotate their format; the capture pass has to be repeatable, which
  is why M1 records the procedure and not just the strings.
- **The token field could be wrong.** §5.1 says it cannot be proven without a real token. If streams
  stay empty after a valid token, the field is `donor_token` and the fix is one string.
- **Legal posture of the sources themselves.** This page links to addons that point at unlicensed
  streams. It hosts nothing and caches nothing, and it should stay a neutral installer: no bundled
  titles, no index, no promotion.
- **No telemetry** means breakage is learned from user complaints. That is the price of the
  "sends nothing anywhere" claim, and the claim is worth more here than the telemetry.

## 15. antislop gate status for this document

This document is a plan, not a UI, so the Delivery Gate in the core does not apply to it yet. The
gate runs at M6 against the built page, with a recorded click-through. What is already satisfied at
plan level, and what is not:

- **R-37 direction:** recorded in `docs/DESIGN.md`, with the owner's own instructions quoted. The
  open choices were settled on 2026-10-16 rather than left to the build, and the one constraint given
  at that point (avoid generic colors such as purple) is recorded alongside them.
- **R-23 assets:** nothing invented. No logo, no mascot, no avatars, no statistics, no testimonials.
  The one image is the QR, which is derived from the bot URL and verified by decoding it, not
  accepted as mystery artwork.
- **R-31 reasons:** every palette, type, radius, and ordering decision above carries a one-line reason.
- **R-36 / R-38:** no fabricated claims in the copy deck. The one string that rests on the owner's word
  rather than a measurement, the cost of the token, says so in §5.4.
- **R-02:** no em dashes in this file or in `docs/DESIGN.md`.
- **R-25:** every color pair in `docs/DESIGN.md` was computed with the skill's contrast checker. Three
  candidates failed and were replaced: `#5A5F49` at 2.57:1, `#8A8B78` at 2.96:1, and `#DEDCD0` as a
  separator at 1.27:1 against 1.53:1 for its dark counterpart.
- **Partially satisfied now that the shell exists:** R-26 and R-27 in the clipboard fallback and the
  empty states, both exercised in the M2 pass.
- **Pending:** the rest of the UI-side gate (R-03, R-32, R-34, R-35, and the liveliness block) because
  it runs at M6 against the finished page with a recorded click-through, not against a scaffold.

One loose end: the existing `docs/PLAN.md` uses em dashes throughout, written before this rule was
in play. Say the word and I sweep it in the same pass.
