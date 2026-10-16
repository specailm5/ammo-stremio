# عمو ستريميو

A one-page Arabic installer for seven Stremio addons, with the settings already chosen, so a
non-technical reader configures nothing. Static files on GitHub Pages: no server, no database, no
recurring cost. The page leads with a sign-in path that writes every addon in one request, and falls
back to one button per addon for a reader who will not sign in. The only thing either path talks to is
Stremio's own API.

The copy ships in the **Saudi dialect**, on the owner's instruction. `docs/PLAN-C.md` section 7 holds
the deck it was written from, and section 12 the reason and what the choice costs.

Plans live in `docs/` and are **not** published. Only `web/` is deployed.

## What gets deployed

```
web/index.html                 the page
web/app.css                    tokens and layout, mobile first, RTL with logical properties
web/app.js                     UPSTREAMS table, config encoders, sign-in path, progress, token flow
web/assets/penguplay-qr.png    generated, never hand-saved
web/assets/fonts/plex.css      generated @font-face sheet
web/assets/fonts/*.woff2       generated IBM Plex Sans Arabic subsets
```

## The maintenance surface

`web/app.js` holds a single `UPSTREAMS` array. When an upstream rotates its config format, that
array is the fix, and the cost of the fix is that every reader has to revisit the page. Entries with
`ready: false` have no captured config yet and render with their actions disabled on purpose, so an
unfinished table cannot be mistaken for a working install. Nothing ships with `ready: false` now, and
the flag stays as the mechanism for the next time an upstream moves.

The procedure for capturing one is in `docs/PLAN-C.md` section 6: read the encoder out of the
upstream's own configure page, then fetch the resulting `manifest.json` and count what comes back. A
config is accepted only once a manifest fetch proves it. The encoders differ per project, so there is
no single recipe: of the four captured in the last pass, one is plain `btoa`, one is url-safe base64
with the padding stripped, one is standard base64, and one needs no config at all.

## The sign-in path

This is the path the page leads with. A reader signs in to Stremio and all the addons are written to
the account in one request, instead of seven clicks. It is built on Stremio's own API and on nothing
else:

| call | body | returns |
|---|---|---|
| `POST api.strem.io/api/login` | `{email, password}` | `{authKey}` |
| `POST api.strem.io/api/addonCollectionGet` | `{authKey, update, addFromURL}` | `{addons, lastModified}` |
| `POST api.strem.io/api/addonCollectionSet` | `{authKey, addons}` | `{success}` |

Those shapes come from Stremio's own client (`stremio-api-client`), and one entry is
`{transportUrl, manifest, flags}`, which is what a real signed-in profile holds on disk.

Two rules hold, and they are the reason the form can be offered at all:

- **Nothing is stored.** The password and the auth key live in one argument object for the length of
  one request. They are never written to storage, never put in a URL, and the fields are cleared
  whether the attempt works or not.
- **The collection is merged, never replaced.** An addon already present, by id or by url, is left
  exactly as its owner configured it, so the form cannot remove or overwrite anything.

An account created through Facebook or Apple has no password, so the form also takes an auth key, and
the page spells out how to get one: sign in at `web.stremio.com`, open the browser console with `F12`,
get past Chrome and Edge's first-paste block by typing `allow pasting`, then run
`JSON.parse(localStorage.getItem("profile")).auth.key` and copy what it prints. The key name and the
path through the stored profile were checked against the client's own data, and the page warns against
pasting a snippet that did not come from it. The console returns the key wrapped in quotes, so the
field strips surrounding quotes and whitespace before the value is used, and it answers the literal
`undefined` with the reason it appears rather than sending it as a key. The shipped wording is in
`docs/PLAN-C.md` section 7, and the verification is in section 16.

Copy rule for every string a reader sees: a sentence earns its place only if it changes what the reader
does or knows. Nothing that describes the plumbing ships, so phrases such as how a pasted value is
cleaned, that the fields are cleared afterwards, or why the site has no single combined link are kept in
this README and in `docs/PLAN-C.md` rather than on the page. Section 7 records the pass that applied it.

## Regenerating assets

Both scripts are idempotent and fetch from upstream at build time. The published page never touches
a CDN, so the only outbound calls it can make are the addon manifest reads and the three Stremio
calls above, which is what makes that checkable in devtools.

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
workflow refuses off-origin subresources, CDN references, and hidden request channels before it
deploys anything, and it pins the one API endpoint to Stremio's.

Set the repository's Pages source to **GitHub Actions** once, then push to `main`.
