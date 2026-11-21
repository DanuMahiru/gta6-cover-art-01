// Vice Cover Studio — the poster renderer.
//
// Draws a GTA-style multi-panel cover on any canvas 2D context: photo panels
// with a colour grade, a huge striped chrome title, a script subtitle, role
// tags, a press quote, a gold seal, a billing block and a barcode. Pure
// Canvas 2D, no network: the only outside files are the two vendored OFL
// fonts under app/fonts/ (Anton for display, Great Vibes for script).

// ---------------------------------------------------------------- layouts
// Every layout is a function of the poster size (W, H) returning the panel
// rectangles (fractions of the poster) and the title zone. Panels are drawn
// in order; the panel flagged hero is drawn a touch larger in spirit — it is
// simply the biggest rect. A title zone with overlay:true is painted over
// the panels on a dark gradient; otherwise the panels are placed around it.

function grid(W, H, cols, rows, x0, y0, x1, y1, gap) {
  const out = [];
  const cw = (x1 - x0 - gap * (cols - 1)) / cols;
  const ch = (y1 - y0 - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        x: x0 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch, hero: false,
      });
    }
  }
  return out;
}

function merge(rects, a, b) {
  // Merge rects[a] and rects[b] into one rect spanning both (same row).
  const r1 = rects[a];
  const r2 = rects[b];
  const merged = {
    x: Math.min(r1.x, r2.x), y: Math.min(r1.y, r2.y),
    w: Math.max(r1.x + r1.w, r2.x + r2.w) - Math.min(r1.x, r2.x),
    h: Math.max(r1.y + r1.h, r2.y + r2.h) - Math.min(r1.y, r2.y),
    hero: true,
  };
  return rects.filter((_, i) => i !== a && i !== b).concat([merged]);
}

export const LAYOUTS = [
  {
    id: 'classic', name: 'Vice Classic',
    describe: (W, H) => {
      const g = 0.008 * W;
      const top = 0.058 * H, mid = 0.415 * H, bot = 0.715 * H, end = 0.948 * H;
      const topRow = grid(W, H, 4, 1, 0.014 * W, top, 0.986 * W, mid - 0.012 * H, g);
      const botRow = grid(W, H, 3, 1, 0.014 * W, bot, 0.986 * W, end, g);
      // The hero is the second panel of the top row, widened into its neighbour.
      const hero = { ...topRow[1], w: topRow[1].w + topRow[2].w + g, hero: true };
      const panels = [topRow[0], hero, topRow[3], ...botRow];
      return { panels, title: { x: 0.014 * W, y: mid, w: 0.972 * W, h: bot - mid - 0.012 * H, overlay: false } };
    },
  },
  {
    id: 'goldmile', name: 'Golden Mile',
    describe: (W, H) => {
      const g = 0.008 * W;
      const top = 0.058 * H, end = 0.948 * H;
      const left = { x: 0.014 * W, y: top, w: 0.42 * W, h: end - top, hero: true };
      const right = grid(W, H, 2, 2, 0.442 * W, top, 0.986 * W, end, g);
      // The title rides across the lower middle, over the panels.
      return {
        panels: [left, ...right],
        title: { x: 0.014 * W, y: 0.56 * H, w: 0.972 * W, h: 0.26 * H, overlay: true },
      };
    },
  },
  {
    id: 'motel', name: 'Motel Court',
    describe: (W, H) => {
      const g = 0.008 * W;
      const top = 0.058 * H, mid = 0.40 * H, bot = 0.70 * H, end = 0.948 * H;
      const topRow = grid(W, H, 3, 1, 0.014 * W, top, 0.986 * W, mid - 0.012 * H, g);
      const hero = { ...topRow[0], w: topRow[0].w + topRow[1].w + g, hero: true };
      const botRow = grid(W, H, 3, 1, 0.014 * W, bot, 0.986 * W, end, g);
      return {
        panels: [hero, topRow[2], ...botRow],
        title: { x: 0.014 * W, y: mid, w: 0.60 * W, h: bot - mid - 0.012 * H, overlay: false },
        sign: { x: 0.628 * W, y: mid, w: 0.358 * W, h: bot - mid - 0.012 * H },
      };
    },
  },
  {
    id: 'strip', name: 'Sunset Strip',
    describe: (W, H) => {
      const g = 0.008 * W;
      const top = 0.058 * H, end = 0.948 * H;
      const titleH = 0.26 * H;
      const rows = grid(W, H, 3, 2, 0.014 * W, top + titleH + 0.012 * H, 0.986 * W, end, g);
      rows[0].hero = true;
      return {
        panels: rows,
        title: { x: 0.014 * W, y: top, w: 0.972 * W, h: titleH, overlay: false },
      };
    },
  },
  {
    id: 'castwall', name: 'Cast Wall',
    describe: (W, H) => {
      const g = 0.008 * W;
      const top = 0.058 * H, mid = 0.40 * H, bot = 0.70 * H, end = 0.948 * H;
      const topRow = grid(W, H, 3, 1, 0.014 * W, top, 0.986 * W, mid - 0.012 * H, g);
      const hero = { ...topRow[1], hero: true };
      const botRow = grid(W, H, 4, 1, 0.014 * W, bot, 0.986 * W, end, g);
      return {
        panels: [topRow[0], hero, topRow[2], ...botRow],
        title: { x: 0.014 * W, y: mid, w: 0.972 * W, h: bot - mid - 0.012 * H, overlay: false },
      };
    },
  },
  {
    id: 'solo', name: 'Solo Star',
    describe: (W, H) => {
      const g = 0.008 * W;
      const top = 0.058 * H, end = 0.948 * H;
      const hero = { x: 0.014 * W, y: top, w: 0.972 * W, h: 0.56 * H, hero: true };
      const botRow = grid(W, H, 2, 1, 0.014 * W, 0.875 * H, 0.986 * W, end, g);
      return {
        panels: [hero, ...botRow],
        title: { x: 0.014 * W, y: 0.635 * H, w: 0.972 * W, h: 0.225 * H, overlay: false },
      };
    },
  },
];

export const DEFAULT_ROLES = [
  'THE DRIVER', 'THE FIXER', 'THE BOSS', 'THE RIDER', 'THE LOOKOUT',
  'THE MECHANIC', 'THE CAPTAIN', 'THE BRAINS', 'THE GETAWAY', 'THE ESCAPE',
  'THE HIDEOUT', 'THE INSIDER',
];

// ------------------------------------------------------------------ grades
// A grade is a canvas filter for the photo plus one or two coloured
// overlays painted over the panel. All of them push warm sunset or neon.

export const GRADES = [
  {
    id: 'sunset', name: 'Sunset',
    filter: 'saturate(1.25) contrast(1.08) sepia(0.22)',
    overlays: [
      { mode: 'multiply', top: 'rgba(255,140,60,0.12)', bottom: 'rgba(200,40,120,0.30)' },
    ],
  },
  {
    id: 'neon', name: 'Neon Nights',
    filter: 'saturate(1.55) contrast(1.15) hue-rotate(-12deg)',
    overlays: [
      { mode: 'overlay', top: 'rgba(255,60,180,0.28)', bottom: 'rgba(40,200,255,0.26)' },
    ],
  },
  {
    id: 'vice', name: 'Vice City',
    filter: 'saturate(1.30) contrast(1.10)',
    overlays: [
      { mode: 'soft-light', top: 'rgba(0,220,200,0.30)', bottom: 'rgba(255,80,160,0.30)' },
    ],
  },
  {
    id: 'gold', name: 'Golden Hour',
    filter: 'sepia(0.45) saturate(1.40) contrast(1.05) brightness(1.06)',
    overlays: [
      { mode: 'multiply', top: 'rgba(255,200,90,0.16)', bottom: 'rgba(180,90,20,0.22)' },
    ],
  },
  {
    id: 'noir', name: 'Noir',
    filter: 'grayscale(1) contrast(1.28) brightness(0.94)',
    overlays: [
      { mode: 'multiply', top: 'rgba(255,255,255,0.06)', bottom: 'rgba(0,0,0,0.30)' },
    ],
  },
  {
    id: 'miami', name: 'Miami Pop',
    filter: 'saturate(1.65) hue-rotate(8deg) contrast(1.12)',
    overlays: [
      { mode: 'overlay', top: 'rgba(255,110,200,0.30)', bottom: 'rgba(0,210,220,0.28)' },
    ],
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// ------------------------------------------------------------- photo crops
// Cover-fit with a focus point: the point (fx, fy) of the photo, in 0..1,
// lands on the panel centre; zoom enlarges around it. The result is clamped
// so the photo always covers the panel.

export function coverDrawRect(img, rect, fx, fy, zoom) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(rect.w / iw, rect.h / ih) * Math.max(1, zoom || 1);
  const dw = iw * s;
  const dh = ih * s;
  let dx = rect.x + rect.w / 2 - fx * dw;
  let dy = rect.y + rect.h / 2 - fy * dh;
  dx = Math.min(rect.x, Math.max(rect.x + rect.w - dw, dx));
  dy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, dy));
  return { dx, dy, dw, dh };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ------------------------------------------------------------ panel drawing

function drawRoleTag(ctx, rect, role, atTop, scale) {
  const text = (role || '').trim().toUpperCase();
  if (!text) return;
  // Size the bar from the panel's smaller side, so a tall hero panel does
  // not get a giant tag.
  const barH = Math.max(16, Math.min(rect.h * 0.11, rect.w * 0.12));
  const fontPx = barH * 0.58;
  ctx.save();
  ctx.font = `${fontPx}px Anton, 'Arial Narrow', sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = fontPx * 0.9;
  const bw = tw + pad * 2;
  const bx = rect.x + rect.w * 0.03;
  const by = atTop ? rect.y + rect.h * 0.04 : rect.y + rect.h - barH - rect.h * 0.04;
  // Slanted bar: black fill, gold leading edge.
  ctx.beginPath();
  ctx.moveTo(bx + barH * 0.35, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw - barH * 0.35, by + barH);
  ctx.lineTo(bx, by + barH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(12, 4, 20, 0.92)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + barH * 0.35, by);
  ctx.lineTo(bx + barH * 0.35 + fontPx * 0.16, by);
  ctx.lineTo(bx + barH * 0.35 + fontPx * 0.16 - barH * 0.35, by + barH);
  ctx.lineTo(bx, by + barH);
  ctx.closePath();
  ctx.fillStyle = '#ffc93d';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + pad + fontPx * 0.16, by + barH / 2 + fontPx * 0.04);
  ctx.restore();
}

function drawPanel(ctx, rect, panel, grade, isBottomRow) {
  const r = Math.min(10, rect.w * 0.02);
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, r);
  ctx.clip();
  ctx.fillStyle = '#1c0b28';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (panel.photo) {
    ctx.filter = grade.filter;
    const d = coverDrawRect(panel.photo, rect, panel.fx ?? 0.5, panel.fy ?? 0.35, panel.zoom ?? 1);
    ctx.drawImage(panel.photo, d.dx, d.dy, d.dw, d.dh);
    ctx.filter = 'none';
    for (const o of grade.overlays) {
      const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
      g.addColorStop(0, o.top);
      g.addColorStop(1, o.bottom);
      ctx.globalCompositeOperation = o.mode;
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.globalCompositeOperation = 'source-over';
    // Vignette: darker corners so the panel reads as one photo.
    const v = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,2,20,0.35)');
    ctx.fillStyle = v;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    ctx.strokeStyle = 'rgba(255,201,61,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `${Math.max(14, rect.h * 0.09)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
  // Hairline frame around the panel.
  ctx.save();
  roundRectPath(ctx, rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, r);
  ctx.strokeStyle = 'rgba(255,214,110,0.75)';
  ctx.lineWidth = Math.max(1.5, rect.w * 0.004);
  ctx.stroke();
  ctx.restore();
  drawRoleTag(ctx, rect, panel.role, isBottomRow, 1);
}

// ------------------------------------------------------------- chrome title
// The big title is drawn on its own layer so the stripes can be clipped to
// the letters: extrusion, outline, chrome gradient, then horizontal bands.

function chromeTitleLayer(text, size, maxW) {
  const probe = document.createElement('canvas').getContext('2d');
  let px = size;
  probe.font = `${px}px Anton, sans-serif`;
  const squeeze = 0.88;
  while (probe.measureText(text).width * squeeze > maxW && px > 12) {
    px -= 2;
    probe.font = `${px}px Anton, sans-serif`;
  }
  const tw = probe.measureText(text).width * squeeze;
  // Tight layer: just enough room for the letters, their extrusion and the
  // outline. A padded layer would make the height cap in drawPoster shrink
  // the whole title far below the size the zone allows.
  const padX = px * 0.10;
  const padY = px * 0.12;
  const layer = document.createElement('canvas');
  layer.width = Math.ceil(tw + padX * 2);
  layer.height = Math.ceil(px * 1.50);
  const c = layer.getContext('2d');
  const cx = layer.width / 2;
  const baseline = padY + px * 1.02;
  c.save();
  c.translate(cx, baseline);
  c.scale(squeeze, 1);
  c.font = `${px}px Anton, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round';
  // 3D extrusion: the letters again, pushed down-right in deep purple.
  for (let i = 5; i >= 1; i--) {
    c.fillStyle = i % 2 ? '#2a0a3d' : '#1c0628';
    c.fillText(text, i * px * 0.018, i * px * 0.03);
  }
  // Outline: thick dark, then a thin gold edge.
  c.lineWidth = px * 0.16;
  c.strokeStyle = '#160420';
  c.strokeText(text, 0, 0);
  c.lineWidth = px * 0.045;
  c.strokeStyle = '#ffd76a';
  c.strokeText(text, 0, 0);
  // Chrome fill: gold over pink over purple, across the glyph box.
  const g = c.createLinearGradient(0, -px * 0.72, 0, px * 0.30);
  g.addColorStop(0, '#fff6c8');
  g.addColorStop(0.28, '#ffd94d');
  g.addColorStop(0.52, '#ff7a3d');
  g.addColorStop(0.74, '#ef3d8b');
  g.addColorStop(1, '#8a2be2');
  c.fillStyle = g;
  c.fillText(text, 0, 0);
  // Stripes clipped to the letters.
  c.globalCompositeOperation = 'source-atop';
  const band = px * 0.085;
  for (let y = -px * 0.72, i = 0; y < px * 0.30; y += band * 2, i++) {
    c.fillStyle = i % 2 ? 'rgba(255,255,255,0.20)' : 'rgba(20,4,32,0.16)';
    c.fillRect(-layer.width, y, layer.width * 2, band);
  }
  // Hot top edge: a thin bright line across the letters' tops.
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(-layer.width, -px * 0.72, layer.width * 2, px * 0.045);
  c.restore();
  return layer;
}

function scriptLayer(text, size, maxW) {
  const probe = document.createElement('canvas').getContext('2d');
  let px = size;
  probe.font = `${px}px 'Great Vibes', cursive`;
  while (probe.measureText(text).width > maxW && px > 12) {
    px -= 2;
    probe.font = `${px}px 'Great Vibes', cursive`;
  }
  const tw = probe.measureText(text).width;
  const layer = document.createElement('canvas');
  layer.width = Math.ceil(tw + px);
  layer.height = Math.ceil(px * 1.9);
  const c = layer.getContext('2d');
  c.font = `${px}px 'Great Vibes', cursive`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.shadowColor = 'rgba(255,60,160,0.85)';
  c.shadowBlur = px * 0.25;
  c.lineWidth = px * 0.09;
  c.strokeStyle = '#ffffff';
  c.strokeText(text, layer.width / 2, layer.height / 2 + px * 0.08);
  c.shadowBlur = 0;
  c.fillStyle = '#ff5da2';
  c.fillText(text, layer.width / 2, layer.height / 2 + px * 0.08);
  return layer;
}

// ------------------------------------------------------------ poster pieces

function drawTopStrip(ctx, W, H, quote, source) {
  const y = H * 0.012;
  const starSize = H * 0.026;
  // Five gold stars on the left.
  ctx.save();
  ctx.fillStyle = '#ffc93d';
  ctx.font = `${starSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', W * 0.016, y + starSize * 0.55);
  const quoteX = W * 0.016 + starSize * 5.4;
  ctx.font = `${H * 0.021}px Anton, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`"${quote}"`, quoteX, y + starSize * 0.55);
  const qw = ctx.measureText(`"${quote}"`).width;
  ctx.fillStyle = '#ffc93d';
  ctx.font = `${H * 0.016}px Anton, sans-serif`;
  ctx.fillText(`— ${source}`, quoteX + qw + W * 0.012, y + starSize * 0.55);
  // VOL. 1 badge on the right.
  const label = 'VOL. 1';
  ctx.font = `${H * 0.02}px Anton, sans-serif`;
  const lw = ctx.measureText(label).width;
  const bw = lw + H * 0.03;
  const bh = H * 0.034;
  const bx = W * 0.984 - bw;
  ctx.fillStyle = '#ffc93d';
  ctx.beginPath();
  ctx.roundRect(bx, y, bw, bh, bh * 0.18);
  ctx.fill();
  ctx.fillStyle = '#1c0628';
  ctx.textAlign = 'center';
  ctx.fillText(label, bx + bw / 2, y + bh / 2 + H * 0.002);
  ctx.restore();
}

function drawSeal(ctx, x, y, r, top, bottom) {
  ctx.save();
  ctx.translate(x, y);
  // Serrated gold disc.
  ctx.beginPath();
  const spikes = 28;
  for (let i = 0; i <= spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.88 : r;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffe98a');
  g.addColorStop(0.6, '#ffc93d');
  g.addColorStop(1, '#c78d12');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = '#7a5200';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#3a2400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.34}px Anton, sans-serif`;
  ctx.fillText('★', 0, -r * 0.32);
  ctx.font = `${r * 0.30}px Anton, sans-serif`;
  ctx.fillText(top, 0, r * 0.02);
  ctx.font = `${r * 0.26}px Anton, sans-serif`;
  ctx.fillText(bottom, 0, r * 0.36);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, code) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let px = x + w * 0.04;
  let seed = 0;
  for (const ch of code) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  ctx.fillStyle = '#111111';
  while (px < x + w * 0.96) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const bw = 1 + (seed % 4) * (w / 220);
    if (seed % 3) ctx.fillRect(px, y + h * 0.06, bw, h * 0.66);
    px += bw + (w / 220) * (1 + (seed % 3));
  }
  ctx.font = `${h * 0.16}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, x + w / 2, y + h * 0.88);
  ctx.restore();
}

function drawMotelSign(ctx, rect) {
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.clip();
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, '#3d1157');
  g.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255,214,110,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `${rect.h * 0.30}px Anton, sans-serif`;
  ctx.fillText('MOTEL', rect.x + rect.w / 2, rect.y + rect.h * 0.34);
  const script = scriptLayer('Palm Court', rect.h * 0.26, rect.w * 0.9);
  ctx.drawImage(script, rect.x + (rect.w - script.width) / 2, rect.y + rect.h * 0.42);
  // VACANCY pill.
  const pillW = rect.w * 0.52;
  const pillH = rect.h * 0.16;
  ctx.fillStyle = '#1c0628';
  ctx.beginPath();
  ctx.roundRect(rect.x + (rect.w - pillW) / 2, rect.y + rect.h * 0.72, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffc93d';
  ctx.font = `${pillH * 0.52}px Anton, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('VACANCY', rect.x + rect.w / 2, rect.y + rect.h * 0.72 + pillH / 2 + 1);
  ctx.restore();
}

// ---------------------------------------------------------------- the poster

export function drawPoster(ctx, W, H, state) {
  const grade = gradeById(state.gradeId);
  const layout = layoutById(state.layoutId);
  const geo = layout.describe(W, H);
  const S = H / 1080; // scale factor: sizes below are authored at 1080 tall

  // Backdrop: deep plum with a sunset wash at the top.
  ctx.fillStyle = '#150820';
  ctx.fillRect(0, 0, W, H);
  const wash = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  wash.addColorStop(0, 'rgba(255,110,80,0.20)');
  wash.addColorStop(1, 'rgba(255,110,80,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H * 0.5);

  // Panels.
  const titleTop = geo.title.y;
  const titleBottom = geo.title.y + geo.title.h;
  geo.panels.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    const isBottomRow = rect.y + rect.h / 2 > titleBottom;
    drawPanel(ctx, rect, { ...panel, role: panel.role ?? DEFAULT_ROLES[i % DEFAULT_ROLES.length] }, grade, isBottomRow);
  });
  if (geo.sign) drawMotelSign(ctx, geo.sign);

  // Title zone.
  const tz = geo.title;
  if (tz.overlay) {
    const bg = ctx.createLinearGradient(0, tz.y - 20 * S, 0, tz.y + tz.h + 20 * S);
    bg.addColorStop(0, 'rgba(16,4,26,0)');
    bg.addColorStop(0.25, 'rgba(16,4,26,0.78)');
    bg.addColorStop(0.75, 'rgba(16,4,26,0.78)');
    bg.addColorStop(1, 'rgba(16,4,26,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, tz.y - 20 * S, W, tz.h + 40 * S);
  }
  const titleText = (state.title || 'SUNSET HEIST').trim().toUpperCase() || 'SUNSET HEIST';
  // The zone is a strict vertical budget: title 0.02–0.56, subtitle centred
  // on 0.70, tagline 0.83–0.98. Nothing may spill into the panels below.
  const titleLayer = chromeTitleLayer(titleText, tz.h * 0.52, tz.w * 0.98);
  let titleDrawW = Math.min(titleLayer.width, tz.w * 0.98);
  let titleDrawH = titleLayer.height * (titleDrawW / titleLayer.width);
  const maxTitleH = tz.h * 0.54;
  if (titleDrawH > maxTitleH) {
    titleDrawH = maxTitleH;
    titleDrawW = titleLayer.width * (titleDrawH / titleLayer.height);
  }
  const titleY = tz.y + tz.h * 0.02;
  ctx.drawImage(titleLayer, tz.x + (tz.w - titleDrawW) / 2, titleY, titleDrawW, titleDrawH);

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subLayer = scriptLayer(sub, tz.h * 0.30, tz.w * 0.9);
    let sw = Math.min(subLayer.width, tz.w * 0.9);
    let sh = subLayer.height * (sw / subLayer.width);
    const maxSubH = tz.h * 0.26;
    if (sh > maxSubH) {
      sh = maxSubH;
      sw = subLayer.width * (sh / subLayer.height);
    }
    ctx.save();
    ctx.translate(tz.x + tz.w / 2, tz.y + tz.h * 0.70);
    ctx.rotate(-0.045);
    ctx.drawImage(subLayer, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  // Tagline ribbon at the bottom of the zone.
  const tag = (state.tagline || '').trim().toUpperCase();
  if (tag) {
    ctx.save();
    const rh = tz.h * 0.15;
    ctx.font = `${Math.max(13, rh * 0.62)}px Anton, sans-serif`;
    const tw = ctx.measureText(tag).width;
    const rw = tw + rh * 2.2;
    const rx = tz.x + (tz.w - rw) / 2;
    const ry = tz.y + tz.h - rh - tz.h * 0.02;
    ctx.beginPath();
    ctx.moveTo(rx + rh * 0.4, ry);
    ctx.lineTo(rx + rw, ry);
    ctx.lineTo(rx + rw - rh * 0.4, ry + rh);
    ctx.lineTo(rx, ry + rh);
    ctx.closePath();
    ctx.fillStyle = '#e83e8c';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, rx + rw / 2, ry + rh / 2 + rh * 0.06);
    ctx.restore();
  }

  drawTopStrip(ctx, W, H, state.quote || 'GOLDEN HOUR, CRIMINAL INTENT', state.source || 'THE SUNSET GAZETTE');

  // Gold seal, bottom-right over the panels.
  drawSeal(ctx, W * 0.935, H * 0.795, H * 0.052, 'BEST', 'CAST');

  // Bottom strip: COMING SOON left, billing centre, barcode right.
  const by = H * 0.955;
  ctx.save();
  ctx.fillStyle = '#ff5da2';
  ctx.font = `${H * 0.022}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('— COMING SOON', W * 0.016, by + H * 0.012);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `${H * 0.0135}px 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('A PALM & PISTOL PRODUCTION  ·  STARRING YOU', W / 2, by + H * 0.004);
  ctx.fillText('SHOT ON YOUR OWN CAMERA  ·  NO CREW, NO PERMIT', W / 2, by + H * 0.022);
  ctx.restore();
  drawBarcode(ctx, W * 0.925, by - H * 0.012, W * 0.06, H * 0.038, '0 10472 85991 8');

  // Frame: dark edge plus a gold hairline, then a soft vignette.
  ctx.save();
  ctx.strokeStyle = '#0d0316';
  ctx.lineWidth = Math.max(4, W * 0.008);
  ctx.strokeRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,201,61,0.55)';
  ctx.lineWidth = Math.max(1.5, W * 0.002);
  ctx.strokeRect(W * 0.006, H * 0.006, W * 0.988, H * 0.988);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(8,2,16,0.30)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Renders the poster at an exact export size and returns the canvas.
export function renderCover(state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawPoster(canvas.getContext('2d'), W, H, state);
  return canvas;
}

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];
