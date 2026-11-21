// Vice Cover Studio v2 — the entrypoint (Node 22, standard library only).
//
// Hands the app in: it copies app/ and screenshots/ from beside this file
// to the output directory and writes output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. The library is the kit's
// own copy under vendor/ and is never changed.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, from the kit's gate: at most 4 screenshots, each
// at most 256 KiB; app/ at most 993 files and 48 MiB in all; no path under
// app/ over 1,000 bytes. Refuse early, here, rather than handing in an
// entry the scorer would refuse.
function checkShots(dir) {
  if (!existsSync(dir)) throw new Error(`screenshots/ is missing beside ${here}`);
  const names = readdirSync(dir).filter((n) => !n.startsWith('.'));
  if (names.length < 3 || names.length > 4) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${names.length}`);
  }
  for (const name of names) {
    const size = statSync(join(dir, name)).size;
    if (size > 262144) throw new Error(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
  }
  return names;
}

function checkApp(dir) {
  let files = 0;
  let bytes = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else {
        files += 1;
        bytes += st.size;
        if (Buffer.byteLength(p, 'utf8') > 1000) throw new Error(`app path over 1,000 bytes: ${p}`);
      }
    }
  };
  walk(dir);
  if (files > 993) throw new Error(`app/ holds ${files} files, over the 993 cap`);
  if (bytes > 50331648) throw new Error(`app/ is ${bytes} bytes, over the 48 MiB cap`);
  return { files, bytes };
}

const shots = checkShots(join(here, 'screenshots'));
const app = checkApp(join(here, 'app'));

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The dossier is byte for byte what buildDossier writes from app/ and
// screenshots/; the gate rebuilds it with the same library and compares.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(
  `handed in v2: app/ (${app.files} files, ${app.bytes} bytes) + ${shots.length} screenshots -> ${out}`,
);
