# Plan C: عمو ستريميو, the static Arabic installer page

**What this is.** The build plan for Option C from `docs/PLAN.md` §16: one static Arabic page that
installs the curated sources into a user's Stremio with settings baked in, running on GitHub Pages
with no server, no database, no credentials, and no recurring cost.

**What it is not.** Not a proxy, not an addon, not a manager. Nothing here talks to Stremio's API,
and nothing here runs at request time. The page builds install URLs in the browser and hands them
to Stremio. `docs/DESIGN.md` holds the visual direction; this file holds everything else.

**Status:** all seven sources captured and each proved by a manifest fetch (§6). The page ships with
no disabled card. It leads with a sign-in path built on Stremio's own account API, whose contract and
limits are recorded in §16, and it keeps the account-free seven steps below it. Still open: the
PenguPlay token field has to be confirmed against a real token, which is M4; the install click is
confirmed on Windows only, so a phone and a television stay in M3; and the sign-in path's happy path
waits for one click by the account's owner, since testing it would write to their real addon list. Costs verified. One open contradiction resolved, one
flagged (§5).

---

## 1. The honest pitch, and where the value actually is

C has two weaknesses: seven separate installs, and no remote fix when an upstream breaks. The page
cannot remove the second. The first it now removes outright, and makes it the default path: the
sign-in section in §16 is the first thing after the headline and it writes the whole collection in one
request, so for a reader who has an account seven installs really do become one. A reader who has none,
or who will not type a password into this page, gets the next best thing and **seven installs made to
feel like one procedure.**

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

In: one page, a sign-in path, seven steps, the token flow, a recovery section, a real FAQ.

Out, deliberately: a search box, a settings page, a "choose your sources" picker, a proxy, analytics,
an addon of our own. Every one of those reintroduces the server or the configuration the whole option
exists to avoid. The one thing that came back in is Stremio's own account, and it came back as the
page's first choice rather than a side door (§16). It adds no server, it stores nothing, it removes
nothing, and the account-free route below it is complete on its own for a reader who never signs in.

## 3. Page structure, in order

1. **Wordmark + theme toggle.** The name as text, dark by default, a working light theme behind the toggle.
2. **Opening.** One headline, one sentence, one primary button, which lands on the sign-in section
   because that is the first choice. No badge above the headline, no stats, no screenshot we have not
   captured.
3. **The sign-in path.** The first choice, directly under the opening: what it does, the one line that
   states what it sends and to whom, an email and a password, a collapsed auth-key door for Facebook
   and Apple accounts, and one button (§16).
4. **The manual path's preamble.** Stremio installed, the TV sync fact stated conditionally, and the
   copy-each-link fallback, so a reader who will not sign in is not stranded.
5. **The seven steps.** Each step is one card: Latin source name, what it gives you in Arabic, the
   install action, the copy-link fallback, and a "added it" mark that persists per device.
6. **The token step (step seven).** The only step with an input, so it is expanded in place instead
   of being left as a bare card (§5).
7. **Recovery.** What to do when a row empties, including Stremio's own reinstall trap (§9).
8. **FAQ.** Questions this product's users actually ask, all of them answered honestly (§7).
9. **Footer.** Only links that exist, and a claim that matches what the page does.

## 4. The steps and the order

Order is a decision, not a listing (R-31). Catalogs come first because the home board is the first
thing a reader sees working. Streams come next, subtitles after, and the token step last, so a
reader who stops early still has a working Stremio.

| # | Source | What the card says it gives | Config baked | Verified |
|---|---|---|---|---|
| 1 | Streaming Catalogs | Netflix, Disney+, Prime, Apple TV+, HBO Max rows, films and series | none needed, the bare URL already serves those five services | yes, 10 boards |
| 2 | Dramayo | Subtitled Asian series: Korean, Chinese, Japanese | curated `enabledCatalogs`, all 16 | yes, 16 boards |
| 3 | HdHub | Watch sources for films and series | curated `catalogs`, `qualities`, `sort` | yes, 4 boards, quality-proved |
| 4 | Flix-Streams | Extra watch sources, including live channel rows | none needed, the bare URL matches its own default config | yes, 2 boards, 40 live events |
| 5 | Anime Kitsu | Anime rows and details | none exists, 6 fixed boards | n/a |
| 6 | OpenSubtitles PRO | Arabic subtitles | `langs: ["arabic"]` | yes, 43 Arabic subtitles |
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

The configs are mechanical to obtain, and the procedure is the same for each, which matters because
drift means it has to be run again:

1. Open the upstream's configure page and read the config schema out of it (that is how the PenguPlay
   keys were found, from the page's own `buildConfig` function).
2. Choose a curated value for each field and write the JSON.
3. Encode it **the way that page's own code encodes it**, then fetch the resulting `manifest.json` and
   **count what comes back**. A curated config is only accepted once the manifest proves it. Do not
   assume base64url: of the four captured in §6, one uses plain `btoa`, one uses url-safe base64 with
   the padding stripped, one uses standard base64, and one ships its config compressed and needs none.
4. Record the verified string in the table in §4, and re-check a new board id against the fetched
   manifest if it holds a character outside letters, digits, and `- _ : , [ ] { } "`.

The captures go in one place, `web/app.js` as a `UPSTREAMS` array, which is the entire maintenance
surface of this project. When an upstream rotates its format, that array is the one-line fix, and the
cost of the fix is that every user must revisit the page (the trade-off in §9).

### Resolved in the capture pass (2026-10-16)

Recorded so a later session does not re-derive them. Every host answered, and the table in `web/app.js`
points each card at its base.

| Source | Base | Card state |
|---|---|---|
| Streaming Catalogs | `https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club` | captured, bare `manifest.json`, 10 boards |
| Dramayo | `https://dramayo.stream` | captured, `btoa` of JSON, 16 boards |
| HdHub | `https://hdhub.thevolecitor.qzz.io` | captured, unpadded url-safe base64, 4 boards |
| Flix-Streams | `https://free.flixnest.app` | captured, the bare URL is the config, 2 boards |
| Anime Kitsu | `https://anime-kitsu.strem.fun` | captured, and no configure page exists |
| OpenSubtitles PRO | `https://opensubtitlesv3-pro.dexter21767.com` | captured, standard base64, 43 Arabic subtitles |
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

### The four remaining configs, each with its own encoder (2026-10-16)

The four cards that rendered disabled were not blocked on a decision. They were blocked on a capture
pass, and the pass is done. The encodings differ per project, because each project wrote its own
configure page, so each config is built the way its own page builds it. All four manifests now answer
`200`, and each field is accepted only on evidence:

| Source | Encoder, read out of its own page | Evidence the config took effect |
|---|---|---|
| Dramayo | `btoa(JSON.stringify(cfg))` in the path | asking for 2 of the 16 boards returned 4, so `enabledCatalogs` is honoured. All 16 returns 16, and an empty list also returns 16, which makes empty mean "everything" rather than "nothing" |
| HdHub | `btoa` then `+`→`-`, `/`→`_`, padding stripped, the same form as PenguPlay | `qualities: "2160p"` returned boards named `4KHDHub 4K`, `qualities: "480p"` returned `HdHub 480p`, and `catalogs: "featured"` halved the board count. The field names come from the page's own `configObj` builder |
| Flix-Streams | none | the bare URL and the publisher's own default blob returned the identical 8 streams and the same 40 live events, so the bare URL is the curated config and no schema is pinned |
| OpenSubtitles PRO | `Buffer.from(...).toString("base64")`, standard base64 | `langs: ["arabic"]` returned 43 subtitles, every one `ara`, while `langs: ["english"]` returned 122 `eng`. The bare URL answers `500`, so this card cannot use one |

Three findings from that pass are worth keeping, because each one would have shipped broken:

- **OpenSubtitles PRO needs a config.** Its bare manifest URL answers `500`. A card pointing at the
  bare URL would have been a dead button on the page, and it would have looked like a Stremio fault.
- **Flix-Streams needs no config.** Its path carries base64 of zlib-compressed JSON, which a page with
  no runtime dependencies should not have to reproduce. It does not have to: the bare URL behaves
  identically to the publisher's default blob, so there is nothing to encode and no `_free_schema`
  version to go stale.
- **Dramayo's install id is per browser.** Its page stores one in `localStorage` and counts installs
  with it, so ours is generated once per browser and kept, which keeps the upstream's count honest
  without a server. The payload also cannot contain `/` or `+`: a `/` needs a byte of `0x3F` or `0x7F`
  and a `+` needs `0x3E` or `0x7E`, and no character in this JSON produces one. Measured as well as
  reasoned: 0 of 2000 random ids produced either. A future board id holding `~` or `?` would end that,
  so a new id has to be re-checked against the fetched manifest.

What the pass cannot prove, stated so nobody reads more into it than is there. A few fields only affect
which streams come back, not the manifest, so they are accepted and not measured: Dramayo's `hideAnime`
and `hideNsfw`, HdHub's `sort`, and OpenSubtitles' `source` and `aiTranslated`. Each sits in the same
object as fields that are proved, and each is the upstream's own default, so nothing is guessed. Two
curation choices ride on that: NSFW stays visible because hiding it is a content decision and not the
page's to make, and HdHub's `qualities` is `"all"` so a slow Firestick still gets a low-bitrate file to
fall back to.

## 7. Copy deck (Arabic)

Written in the **Saudi dialect**, on the owner's instruction of 2026-10-16, and that is the register
every string a reader sees now ships in. This is a deliberate departure from the Arabic skill rather
than an application of it: that skill is built to defend فصحى and names loose colloquial prose as one
of the things it argues against. What still carries over from it is the rest of its substance, verbal
sentences, actors named, no calqued connectives, no trailing `فقط` for restriction, no `تحديات` or
`محوري`.

The cost of the choice is worth writing down, because it is real: dialect lands hardest with a Gulf
audience and softer with a Levantine or North African one. فصحى would travel wider. The owner picked
dialect knowing that, so the trade is his call and not an oversight.

The exact shipped strings are in `web/index.html` and `web/app.js`. What follows is the deck they were
written from, so the two can be compared after any future edit.

One rule governs what is here at all, and the owner set it on 2026-10-16 after reading the first draft: a
sentence earns its place only if it changes what the reader does or knows. Anything that described how
the page works rather than what the reader gets was cut in that pass, including the note that a pasted
key is cleaned of stray quotes, the field clearing, the sync mechanism behind the promise, and three FAQ
answers that explained the site's own architecture. The page says less and the reader loses nothing.

**Wordmark:** عمو ستريميو

**Headline:** إضافات ستريميو جاهزة، بضغطة وحدة

**Opening sentence:** سبع إضافات تفتح لك الأفلام والمسلسلات والأنمي والترجمة العربية في ستريميو. جهّزنا
الإعدادات عنك، فما تحتاج تظبط شي بيدك.

**Primary button:** يلا نبدأ

**Sign-in section, the first choice (§16):**

- Heading: أضفها كلها بضغطة وحدة
- Intro: سجّل دخولك بحساب ستريميو، وتنضاف الإضافات كلها مرة وحدة. وإذا كنت مسجّل بنفس الحساب على
  تلفازك، توصل له على طول.
- The line that carries the whole promise: اللي تكتبه هنا يروح لستريميو مباشرة، ولا نحفظه.
- Button: أضفها لحسابي
- Labels: إيميلك في ستريميو · كلمة المرور · مفتاح الدخول
- Hint: اكتب إيميلك وكلمة المرور.
- The password-free door, kept for Facebook and Apple accounts, which have no other way in, so it is a
  full procedure and not a hint. The summary names the reader's own situation rather than the mechanism,
  because مفتاح and كلمة مرور are the page's words and not the reader's: مسوّي حسابك بفيسبوك ولا آبل؟ It
  carries a plain اضغط هنا afterwards, because a reader who has never met a disclosure does not know the
  line opens. Its opening line answers the question the summary asks: يعني ما لك كلمة مرور في ستريميو،
  فدخولك يصير بمفتاح. سوّها على كمبيوتر، لأن الجوال ما يفتح كونسول. The five steps in order: افتح
  web.stremio.com وسجّل دخولك · اضغط F12 عشان يفتح لك الكونسول · أول مرة تبغى تلصق في الكونسول، يطلع لك
  تحذير ويمنعك، فاكتب allow pasting واضغط Enter · الصق هذا السطر:
  `JSON.parse(localStorage.getItem("profile")).auth.key` (control: انسخ السطر) · انسخ المفتاح اللي طلع
  والصقه في الحقل. It closes with the rule a page that teaches console pasting owes its reader: ولا تلصق
  في الكونسول أي سطر يجيك من موقع ثاني, plus the failure mode of the snippet itself, which throws when
  there is no signed-in profile to read: ولو طلع لك خطأ، تأكد إنك مسجّل دخول في web.stremio.com.

  The value is pulled apart before it is used, because a console prints a returned string inside quote
  marks and a paste can carry spaces or a newline with it. Surrounding quotes of the straight, curly
  and backtick kinds come off along with the whitespace, twice over, so a value that arrives double
  wrapped still lands clean. The literal word `undefined`, which the snippet prints when the profile
  holds no auth key yet, is answered with that reason instead of being sent as a key.

  None of that reaches the copy, on the owner's instruction of 2026-10-16. The rule is that the page
  carries no detail the reader cannot act on: the reader pastes the key and it either works or the hint
  explains why it did not. The cleanup and the field clearing are real, they are just silent.
- The way out, kept beside the way in: إذا ما ارتحت تكتب كلمة مرورك هنا، خلّ القسم هذا واشتغل بالأزرار
  اللي تحت.

**Manual path preamble:** تأكد إن ستريميو مثبّت عندك. وإذا ما كنت مسجّل دخول بنفس الحساب في الجوال
والتلفاز، انسخ روابط الإضافات اللي تحت والصقها على التلفاز وحدة وحدة.
> NOTE: the sync claim stays conditional on purpose (§1), so an edge case in syncing cannot make the sentence false.

**Steps heading:** الإضافات السبع

**Per-step controls:** أضفها لستريميو · انسخ الرابط · أضفتها · خلصت

**Progress:** ما أضفت شي للحين. · أضفت ٣ من ٧.

**Step descriptions:**
1. صفوف Netflix و Disney+ و Prime و Apple TV+ و HBO Max، أفلام ومسلسلات.
2. مسلسلات آسيوية مترجمة: كوري وصيني وياباني وتايلندي.
3. مصادر تشاهد منها الأفلام والمسلسلات.
4. مصادر زيادة، وفيها صفوف قنوات مباشرة. ويمكن يجيك نفس الملف مرتين.
5. صفوف الأنمي وتفاصيله.
6. ترجمة عربية للأفلام والمسلسلات.
7. مصادر سريعة، وتبي لها رمز خاص لك.

**Token step intro:** هذي الإضافة لحالها تبي لها رمز، وتعطيك إياه قناة PenguPlay على تيليجرام، وببلاش.

**Token steps:**
1. افتح محادثة البوت في تيليجرام. (control: افتح البوت)
2. أرسل له الأمر /token.
3. بيجيك رمز. انسخه.
4. الصقه في الحقل اللي تحت.

**QR caption:** أو امسح هالرمز بكاميرا جوالك.

**Bot fallback:** إذا البوت ما رد، ادخل سيرفر PenguPlay على ديسكورد، واكتب نفس الأمر هناك.

**Token field:** label الرمز · placeholder الصق الرمز هنا · hint الرمز يطول عادة، تأكد إنك نسخته كامل.

**Privacy line:** ما نرسل رمزك لأي جهة.

**Empty state:** ما لصقت رمز للحين.

**Copy feedback:** نسخناه

**Recovery heading:** إذا اختفى صف أو فرغت إضافة

**Recovery body:** يصير هذا لما يغيّر المصدر عنوانه أو إعداداته. افتح هذي الصفحة، وأعد إضافة الصف اللي
اختلّ لحاله. وفي ستريميو، لا تشيل الإضافة وتحطها من جديد؛ الصق الرابط في خانة «رابط مستودع الإضافات»
عشان يحمّلها من جديد.

**FAQ (questions worth asking about this product, not a template):**

| Question | Answer |
|---|---|
| يبي لها حساب ستريميو وكلمة مرور؟ | تسجيلك بحسابك أسرع طريقة، وتنضاف بها كلها مرة وحدة. وإذا ما تبغى تكتب حسابك، الأزرار اللي تحت تضيفها بدون حساب. |
| تشتغل على التلفاز؟ | إيه. ولو سجّلت دخولك بنفس الحساب في الجوال والتلفاز، تنضاف من الجوال وتوصل للتلفاز. |

**Footer:** عمو ستريميو. ما نحفظ شي عنك.

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

Settled on the owner's word, 2026-10-16, after the first build:

- **The register is the Saudi dialect**, for every string a reader sees (§7). This knowingly departs
  from the Arabic skill, which is built around فصحى and treats loose colloquial prose as a fault. The
  rest of the skill still holds. The cost, recorded rather than hidden, is that dialect reads warmer in
  the Gulf and cooler in the Levant and North Africa, so a future owner can revisit this as a decision
  instead of rediscovering it as a drift.
- **The sign-in path is the first choice**, above the per-addon steps (§16), and the page's single
  button lands on it. The account-free route stays complete, so the page still works for a reader who
  will not sign in, but it is no longer the default.

## 13. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Recon | Done. 2 of 7 configs verified, token field identified, palette contrast computed, skills read. |
| M1 | Verify assumptions, capture configs | Done. Every upstream captured and each proved by a manifest fetch that returns the expected boards: 16, 4, and 2 boards, plus 43 Arabic subtitles (§6). The token field is still checked against a real token in M4. |
| M2 | Shell | Done. `web/` renders in both themes, no horizontal overflow from 305px to desktop, every control at least 44px, design tokens ported from `docs/DESIGN.md`, `git init` and first commit. The layout has exactly two states, phone at 480px and below, and a single column capped at 44rem above it, so phone and desktop cover tablet. |
| M3 | Steps | Seven cards, deep links open Stremio on a real device, copy fallback works where the clipboard API is absent, progress persists across reloads. |
| M4 | Token step | A real token produces a working PenguPlay install with visible streams; bot-unreachable path shows the fallback. |
| M5 | Recovery and FAQ | Both written, both reachable from the top, and the recovery sequence verified against the real Stremio UI. |
| M6 | Deploy and gate | Live on Pages; checked on a real phone and a real TV; the full antislop Delivery Gate run on the built page with recorded click-through. |
| M7 | Later | Test whether a bakeable AIOStreams config can collapse steps 3, 4, and 7 into one, which would cut the page to five installs. Not before M6. |

M1 is closed on the config front: every upstream is captured and proved, so steps 1 through 6 are real
installs rather than placeholder strings. The token field is the one item still open, and it is one
string if the guess is wrong. The device-sync question no longer gates anything, because the copy
states it conditionally (§1).

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
- **No telemetry** means breakage is learned from user complaints. That is the price of having no
  server and keeping nothing, and keeping nothing is worth more here than the telemetry.
- **A credential on a community page.** The sign-in path is the one place a reader types a Stremio
  password into a page that is not Stremio, and it is now the first thing the page asks for, which
  raises this risk rather than lowering it. What holds it down: the password goes only to
  `api.strem.io`, the same endpoint Stremio's own client posts to; nothing is stored, so there is no
  session to leak between visits; the line that says exactly that sits above the fields; and the
  account-free route is complete and immediately below. The residual risk is what the placement
  teaches: a reader who learns to type a Stremio password into this page may type it into another one.
  This is the strongest argument for demoting the form to an auth key only, and it stays on the record
  for whoever holds the decision next.

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
- **R-36, the part the sign-in path changed:** adding that section made three shipped claims false,
  and all three were rewritten in the same commit instead of being left standing: the footer's "we
  send nothing", the FAQ answer that the page never asks for a password, and the FAQ that explained
  the missing single link with "it would need a server". The page now names the one part that sends
  something and where it goes, and `pages.yml` fails the build on a hidden request channel so the
  narrower claim stays checkable. The 2026-10-16 trim (§7) then deleted two of those rewritten answers
  outright: once the line above the fields says where a credential goes, a FAQ row repeating it is
  words the reader pays for and gains nothing from. The third survives in shortened form.
- **The 2026-10-16 trim, as a gate item:** the copy pass that removed every sentence describing how the
  page works rather than what the reader gets (§7 records the rule and the strings). It is listed here
  because it cuts against the honesty concern above: what came out was plumbing, the sync mechanism,
  the field clearing, the quote stripping, and three FAQ answers about the site's own architecture.
  What stayed is every claim that tells a reader something they need, including the one line that says
  where a typed credential goes.
- **R-36, the register change:** every string a reader sees moved to the Saudi dialect on the owner's
  instruction (§7, §12). The Arabic skill the copy was originally written to defends فصحى and names
  loose colloquial prose as a fault, so this is recorded as a deliberate departure with its cost named
  rather than as an application of the skill.

## 16. The sign-in path, and why it sits first

The owner asked for a second way to install, one that adds every addon at once, and then asked for it
to be the first choice rather than a side door. It is possible from a static page, and the reason it
is possible is worth recording: Stremio's API answers cross-origin requests, measured rather than
assumed, so the browser posts to it directly and no proxy appears.

Sitting first is a decision with a price, and the price is worth naming rather than leaving implicit.
The page now leads with the one control that asks for a credential, which is the shape phishing takes.
What earns the placement: it is genuinely the shortest path for the audience that has an account, the
account-free route is one scroll below and complete on its own, and the line above the fields states
what is sent and where. What does not: had the form been an auth key only, the page would ask for no
password at all and this argument would disappear. That trade is the owner's, and it is written here
so a later reader can see it was weighed rather than missed.

The auth-key door is the other half of the sign-in path, and it is the only door a Facebook or Apple
account has, those being the two social providers Stremio offers. That was read off the client rather
than assumed: its Intro view builds a Facebook button and an Apple button, and no Google one, so the
page names no provider a reader could not have used. Its instruction is verified rather than copied
from somewhere. The page tells a reader to
run `JSON.parse(localStorage.getItem("profile")).auth.key` against their own signed-in
`web.stremio.com` session. The key name was checked against the client's own stored data, where the
`profile` record sits beside `installation_id` and `schema_version`, each carrying the same Chromium
suffix inside the LevelDB key, which proves the suffix is not part of the JavaScript key, so the
snippet reads `profile` and not some versioned variant of it. The value it reaches holds `auth.key`, a
44-character session token, and that token is the same one `api.strem.io` accepts, measured earlier in
this project. The field it fills is the same one the password path fills, and either value is passed
straight into `addonCollectionSet`.

Teaching a reader to paste into a browser console is a real cost, so the page pays it openly: it says
to do this step on a computer because phones have no console, it explains the first-paste block that
Chrome and Edge put up rather than leaving a reader stuck at `allow pasting`, and it ends with the one
rule that matters, never paste a line that did not come from this page.

The value that comes back needs handling a bare text field does not give it, and the first reader to
try this path proved it. A console prints a returned string inside quotes, so copying the key hands
over `'...key...'`, and a paste can bring a space, a newline or a quote from a phone keyboard's
punctuation substitution with it. The key is therefore normalised before use: surrounding quotes of
the straight, curly and backtick kinds are stripped along with whitespace, twice over, so a value that
arrives double wrapped still lands clean. The literal word `undefined`, which the snippet prints when
the profile holds no auth key yet, is answered with the reason it appears instead of being sent as a
key, because a reader reaching that state has done the step but not the sign-in.

The contract is taken from Stremio's own client, `stremio-api-client`, not from a wiki:

| call | body | returns |
|---|---|---|
| `POST api.strem.io/api/login` | `{email, password}` | `{authKey, user}` |
| `POST api.strem.io/api/addonCollectionGet` | `{authKey, update, addFromURL}` | `{addons, lastModified}` |
| `POST api.strem.io/api/addonCollectionSet` | `{authKey, addons}` | `{success}` |

An entry is `{transportUrl, manifest, flags}`, which was read out of a real signed-in profile on
disk rather than guessed, and the flow mirrors what Stremio does itself: fetch each manifest, then
write the whole collection back.

Two rules make it safe to offer, and both are enforced in code rather than promised in copy:

- **Nothing is stored.** The password and the auth key live in one argument object for the length of
  one request. They are never written to storage, never put in a URL, and the fields are cleared on
  every path out of the handler, success or failure.
- **The collection is merged, never replaced.** An addon already present, matched by manifest id or
  by transport url, is left exactly as its owner set it up. The shortcut therefore cannot remove or
  overwrite anything, which is the failure that would matter most.

What was verified, and how:

- **The endpoint is reachable from a page.** A `POST` to `login` from the served page came back `200`
  with a real JSON body. A blocked CORS policy would have thrown instead.
- **Every manifest is readable from the browser.** All six account-free addons served their manifests
  cross-origin, which the addon protocol requires of them anyway.
- **The write is accepted, and nothing moves.** `addonCollectionSet` was called with the exact
  collection the server already held, a deliberate no-op: it returned `{success: true}` and a
  re-read showed the same five addons. That proves the request shape without changing the account.
- **The page's own flow, with only Stremio's three calls stubbed.** The account was seeded with two
  foreign addons, one of them Kitsu. The run produced one write containing both originals in their
  original order plus the five that were missing, skipped Kitsu as already present, left PenguPlay
  out because no token had been pasted, and cleared the password field. Nothing credential-shaped
  reached storage.

Two things it deliberately does not do. It does not log in on a reader's behalf at any other time,
so there is no session to leak between visits. And it does not overwrite an addon the reader already
configured: if they have their own HdHub, the shortcuts reports it as kept and moves on, rather than
replacing their settings with the curated ones.

The honest limit: the shortcut's happy path has not been fired at a real account from the page,
because that would write to the owner's real addon list. The write contract and the merge are each
proven, and the remaining step is one click by whoever owns the account.

One loose end: the existing `docs/PLAN.md` uses em dashes throughout, written before this rule was
in play. Say the word and I sweep it in the same pass.
