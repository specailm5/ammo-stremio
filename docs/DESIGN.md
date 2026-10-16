# عمو ستريميو: Design Direction

This is the direction the C build works against. `docs/PLAN-C.md` is the plan.

**Status:** settled. The palette, typeface, and accent below were approved on 2026-10-16, when the
owner delegated the remaining choices with a single constraint: stay away from generic colors such as
purple. Untagged items are the owner's own words.

Two rules govern the whole file: any color pair not listed under "Verified pairs" goes through
`,agents/skills/antislop-human/contrast-check.py` before it ships, and any decision here that
cannot be stated in one line does not survive review (R-31).

---

## 1. Owner-given (2026-10-16)

- **Name:** عمو ستريميو
- **Mood:** minimalist
- **Theme:** dark by default
- **Constraint:** no generic colors, no generic design language

## 2. Design Read

> Reading this as: a one-page guided installer for non-technical Arabic-speaking Stremio users
> opening it on a phone, in a minimal dark "viewing room" language, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

## 3. Dials

| Dial | Value | Why, in one line |
|---|---|---|
| **ENERGY** | 2 | The page has to inform and be trusted on first contact, but the task is the point, so it greets without performing. (1 is a government form, 3 competes with the steps.) |
| **RHYTHM** | 2 | The seven step cards share one shape on purpose, because they are seven passes of one action. Two sections break the rhythm deliberately: the opening, and the token step, which is the only one holding an input. |
| **MOTION** | 1 | The page is followed in order, so only state transitions move: a step marked done, the install button enabling, focus and hover. No entrance animations, no loops. |

## 4. The idea

**A dark room where the only light comes from the screen.** That is the viewing room the audience
already knows, so the page feels like part of the app rather than a website about it.

The base is a warm near-black, not the blue-black every generated page uses. Text is warm
off-white, close to paper. One accent carries every moment that matters: the primary button, the
progress marker, the focus ring. Nothing else is colored.

## 5. Identity motif: الخط (the line)

One 2px horizontal line separates the steps, and the same line doubles as the progress track, with
the accent marking how far along the reader is. This is the page's single repeated gesture.

It is not decoration: the page is a linear procedure, so the motif is the procedure's own progress.
No other pattern, grid, or texture is used anywhere (R-07).

## 6. Palette: مصباح

### Dark (default)

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#12130F` | page base, warm near-black |
| `--surface` | `#1B1D16` | step cards, input |
| `--surface-2` | `#24271E` | raised rows, hover |
| `--text` | `#F2F1E6` | headings and body |
| `--muted` | `#A8AA97` | secondary text |
| `--line` | `#33372B` | decorative separators only, carries no 3:1 claim |
| `--line-control` | `#7C8170` | input borders, focus ring, any control boundary |
| `--accent` | `#E3A12B` | the one accent: primary button fill, progress marker |
| `--accent-ink` | `#1A1508` | label sitting on the accent fill |

### Light (the toggle)

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#F7F6F0` | page base, warm off-white |
| `--surface` | `#FFFFFF` | step cards, input |
| `--surface-2` | `#EFEDE3` | the token step, the one card that breaks the rhythm |
| `--text` | `#17190F` | headings and body |
| `--muted` | `#5A5D4C` | secondary text |
| `--line` | `#CCC9B6` | decorative separators only, carries no 3:1 claim |
| `--accent` | `#E3A12B` | unchanged, the fill is identical in both themes |
| `--accent-text` | `#8A5A00` | accent used as text, because amber text on off-white fails |

Two tokens are deliberately identical in both themes: `--accent`, and `--line-control` (`#7C8170`),
which clears 3:1 on every surface in the set, so a control boundary never needs a second value.

The accent splits into two roles for one reason: as a **fill** it works in both themes, as **text**
it only works on the dark base. `#E3A12B` on `#F7F6F0` would be about 1.9:1 and is never allowed.

### Verified pairs

Computed with the skill's checker, not eyeballed (R-25):

| Pair | Ratio |
|---|---|
| `#F2F1E6` on `#12130F` (body, dark) | 16.43:1 |
| `#A8AA97` on `#12130F` (muted on base) | 7.87:1 |
| `#A8AA97` on `#1B1D16` (muted on card) | 7.18:1 |
| `#E3A12B` on `#12130F` (accent text, dark) | 8.35:1 |
| `#E3A12B` on `#1B1D16` (accent text on card) | 7.62:1 |
| `#1A1508` on `#E3A12B` (button label) | 8.14:1 |
| `#7C8170` on `#1B1D16` (control boundary, needs 3:1) | 4.24:1 |
| `#7C8170` on `#12130F` (control boundary, needs 3:1) | 4.65:1 |
| `#17190F` on `#F7F6F0` (body, light) | 16.40:1 |
| `#5A5D4C` on `#F7F6F0` (muted, light) | 6.25:1 |
| `#8A5A00` on `#F7F6F0` (accent text, light) | 5.47:1 |
| `#FFFFFF` on `#8A5A00` (button label, light) | 5.93:1 |
| `#7C8170` on `#FFFFFF` (control boundary, light) | 4.01:1 |
| `#7C8170` on `#EFEDE3` (control boundary on the token card) | 3.42:1 |
| `#F2F1E6` on `#24271E` (body on the token card, dark) | 13.37:1 |
| `#A8AA97` on `#24271E` (muted on the token card, dark) | 6.40:1 |
| `#E3A12B` on `#24271E` (accent text on the token card, dark) | 6.79:1 |
| `#17190F` on `#EFEDE3` (body on the token card, light) | 15.13:1 |
| `#5A5D4C` on `#FFFFFF` (muted on a card, light) | 6.76:1 |
| `#5A5D4C` on `#EFEDE3` (muted on the token card, light) | 5.76:1 |
| `#8A5A00` on `#EFEDE3` (accent text on the token card, light) | 5.05:1 |

The two decorative line values are matched to each other rather than to a threshold, because a
separator carries no 3:1 claim: `#33372B` on `#12130F` measures 1.53:1 and `#CCC9B6` on `#F7F6F0`
measures 1.54:1, so the motif reads at the same weight in both themes.

Two values were rejected by measurement rather than by taste: `#5A5F49` as the dark border measured
2.57:1, and `#8A8B78` as the light control boundary measured 2.96:1, a hair under the 3:1 a control
boundary needs. `#7C8170` replaced both, which is why it is one value in both themes.

Still unmeasured, and therefore not to be used without a run: the error color, and any placeholder
value other than `--muted`.

### The alternative that was considered and dropped

A **pomegranate** accent was the other candidate. It is dropped: amber is the one that matches the
dark-room idea, and carrying a second palette would mean verifying a second set of pairs for no gain.
Recorded here only so it is not re-proposed later.

## 7. Typography

**IBM Plex Sans Arabic**, self-hosted, weights 400 / 500 / 600 / 700.

- Why: every step line mixes Arabic prose with Latin names (`Stremio`, `HdHub`, `PenguPlay`,
  `Netflix`). Plex Sans Arabic ships with a matching Latin sibling, so a mixed line holds one voice
  instead of looking patched together mid-sentence.
- Self-hosted as a subset, not from a font CDN, because the page claims it sends nothing to
  anyone, and a font CDN would make that claim false.
- Deliberately not Cairo, Tajawal, or Inter. They are the Arabic web defaults, and this is the
  one page in the niche that can avoid looking like all of them.
- Numbers stay Latin digits, tabular inside the progress marker.
- Sizes use `clamp()` so a phone gets its own step rather than a desktop scale. Body never drops
  below 16px, which also stops iOS from zooming a focused input.

Recorded fallback, not chosen: **Readex Pro**, if Plex ever reads too engineering-flavored for the
jokes in "عمو".

## 8. Shape and space

- Radius: `8px` on controls, `12px` on cards. No pills anywhere, so a card never looks like a button.
- Spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48`, with section padding roughly halved on phone.
- Shadow: none. The palette separates layers by value, and a floating look would fight the
  dark-room idea (R-12).
- Glass, glow, gradient: none, except the focus ring, which is the accent at 2px.

## 9. Absent by decision

- **No logo and no mascot.** None was supplied, and R-23 forbids inventing one. The name set in
  Plex Sans Arabic is the wordmark. A cartoon uncle holding a remote is the obvious temptation and
  is rejected: invented identity, and exactly the generic "friendly mascot" move.
- **No emoji in interface text.**
- **No stock or generated illustrations.** The only honest visual reference is a real screenshot of
  the Stremio addons list, captured from the app, or no illustration at all (R-22).
- **No statistics and no testimonials.** Nothing real exists to show (R-17, R-18, C-5).
- **No analytics, no third-party requests, no CDN.** The page must be able to say "this page sends
  nothing anywhere" and have it be literally true in devtools. That claim is a feature here.
- **No auto theme switching.** `prefers-color-scheme` is ignored; the default is dark because the
  owner set it, and the toggle is the only thing that changes it, persisted per device.

## 10. Reason for the dark default (R-21)

The owner set it, and the product supports it: this page is opened next to a TV in a dim room, and
it is read on a phone at night. Dark is the default rather than the only mode, so a working light
theme ships alongside it and both are verified at delivery (R-34).

## 11. The one image

The PenguPlay bot QR is the only image on the page, and it is functional rather than decorative: a
QR is a URL in a visual encoding, so `tools/make-qr.py` derives it from `https://t.me/PenguPlayBot`
instead of anyone saving it by hand.

It keeps a pale tile with dark modules in **both** themes, because several phone cameras will not
read an inverted (light-on-dark) code. The pair is `#12130F` on `#F7F6F0` at 16.43:1, so the tile
belongs to the palette rather than fighting it, and the page never renders the code inverted to look
atmospheric at the cost of scanning.
