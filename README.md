# عمو ستريميو

A one-page Arabic installer for seven Stremio addons, with the settings already chosen, so a
non-technical reader clicks one button per addon and configures nothing. Static files on GitHub
Pages: no server, no database, no credentials, no recurring cost, and no request leaving the
browser.

Plans live in `docs/` and are **not** published. Only `web/` is deployed.

## What gets deployed

```
web/index.html                 the page
web/app.css                    tokens and layout, mobile first, RTL with logical properties
web/app.js                     UPSTREAMS table, config encoder, progress, token flow
web/assets/penguplay-qr.png    generated, never hand-saved
web/assets/fonts/plex.css      generated @font-face sheet
web/assets/fonts/*.woff2       generated IBM Plex Sans Arabic subsets
```

## The maintenance surface

`web/app.js` holds a single `UPSTREAMS` array. When an upstream rotates its config format, that
array is the fix, and the cost of the fix is that every reader has to revisit the page. Entries with
`ready: false` have no captured config yet and render with their actions disabled on purpose, so an
unfinished table cannot be mistaken for a working install.

The procedure for capturing one is in `docs/PLAN-C.md` section 6: read the schema out of the
upstream's own configure page, encode the curated JSON as unpadded url-safe base64, then fetch the
resulting `manifest.json` and count what comes back. A config is accepted only once a manifest fetch
proves it.

## Regenerating assets

Both scripts are idempotent and fetch from upstream at build time. The published page never touches
a CDN, which is what makes "this page sends nothing anywhere" checkable in devtools.

```
python tools/make-qr.py       # rebuilds the bot QR from its URL
python tools/make-fonts.py    # re-downloads and re-subsets the Arabic face
```

`tools/make-fonts.py` needs `fonttools` and `brotli`. It subsets by character range, so the full
Arabic repertoire stays renderable even as the copy changes.

## Checking the layout without a phone

`tools/viewports.html` renders the page in 320px and 360px frames and measures overflow, target
sizes, and both themes. Serve the repository root and open it:

```
python tools/serve.py
# site:      http://localhost:8766/web/
# viewports: http://localhost:8766/tools/viewports.html
```

`tools/serve.py` sends `Cache-Control: no-store`. Plain `python -m http.server` does not, and the
browser then caches `app.js` on a heuristic, which is how an already-fixed bug looks unfixed for
several minutes after an edit. If a fix seems not to apply, the answer is the cache, not the code.

## Deploying

`.github/workflows/pages.yml` publishes `web/` through the Pages Actions workflow, not branch
publishing, because branch publishing only serves `/` or `/docs` and `docs/` holds the plans. The
workflow refuses off-origin subresources and CDN references before it deploys anything.

Set the repository's Pages source to **GitHub Actions** once, then push to `main`.
