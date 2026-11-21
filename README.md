# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/DanuMahiru/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/DanuMahiru/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos into GTA-style cover art: a multi-panel movie poster with
a hero close-up that pops out of its panel as a cut-out, role tags, a wide
striped retro-chrome title, a script subtitle, a press quote, a gold seal
and a billing block — exported as a PNG to share.

## Try it

```sh
node serve.ts
```

Then open <http://localhost:8080> in desktop Chrome. Everything runs
offline from the static files under `app/` — your photos never leave your
machine.

## What it does

- **6 poster layouts** — Vice Classic, Golden Mile, Motel Court, Sunset
  Strip, Cast Wall, Solo Star — each a multi-panel grid with a hero close-up
  that bursts out of its panel as a sticker cut-out (toggleable).
- **Any photo** — upload your own, drag and drop, or use the six built-in
  sample photos. Click a panel to select it, drag to move its photo, scroll or
  slide to zoom, set its focus point, and edit its role tag.
- **6 colour grades** — Sunset, Neon Nights, Vice City, Golden Hour, Noir,
  Miami Pop — painted over every panel.
- **Words** — edit the big chrome title, the script subtitle, the tagline,
  the press quote and its source. The title is drawn as striped retro-chrome
  3D lettering; the subtitle in script.
- **Poster furniture** — five gold stars, VOL. 1 badge, gold BEST CAST seal,
  billing block, barcode and COMING SOON, all drawn by the app.
- **Export PNG** in the three common post sizes: 1080 × 1080, 1080 × 1350
  and 1920 × 1080.

## Layout

- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored make.fun
  library (`vendor/makefun-app.ts`, unchanged).
- `serve.ts` — a tiny static server for trying the app locally.
- `app/` — the web app as static files: `index.html`, `style.css`,
  `src/poster.js` (the render engine), `src/editor.js` (the editor),
  `src/main.js`, `src/shots.js`, `fonts/` (Anton and Great Vibes, both
  SIL Open Font License — see the OFL texts beside them) and `samples/`
  (six photos made for make.fun, free to use).
- `screenshots/` — 3–4 screenshots of the app at work; the first by name
  is the cover. `shots.json` lists the scenes that made them.

## v2

v2 (21 Nov 2026) answers the first version's weak spots — v1 scored
821,750 (rank 772) on make.fun: the chrome title is wider (taller title
band, bigger letters, tighter layer crop), the hero photo pops out of its
panel as a white-bordered cut-out, and the built-in samples grew from two
faces to six so the panels stop repeating the same people. Everything v1
did — 6 layouts, 6 grades, 3 export sizes, role tags, seal, billing block,
barcode — is still here.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
bounty on [make.fun](https://make.fun). No Rockstar Games logos, artwork or
fonts are used anywhere: every letter, panel and effect is the app's own.
