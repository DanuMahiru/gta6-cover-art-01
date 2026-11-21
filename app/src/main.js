// Vice Cover Studio — bootstrap.
//
// Loads the vendored fonts, builds the editor, and, when the page is opened
// with a ?shot= query, sets up one fixed scene for a screenshot instead of
// the interactive editor. window.__shotReady is set once the scene painted.
// v2: the editor also wires the hero pop-out toggle (see editor.js).

import { createEditor, loadImage } from './editor.js';
import { runShot } from './shots.js';

const els = {
  canvas: document.getElementById('cover'),
  photoInput: document.getElementById('photo'),
  dropZone: document.getElementById('dropzone'),
  tray: document.getElementById('tray'),
  titleInput: document.getElementById('title'),
  subtitleInput: document.getElementById('subtitle'),
  taglineInput: document.getElementById('tagline'),
  quoteInput: document.getElementById('quote'),
  sourceInput: document.getElementById('source'),
  layoutPicker: document.getElementById('layouts'),
  gradePicker: document.getElementById('grades'),
  sizePicker: document.getElementById('sizes'),
  popoutInput: document.getElementById('popout'),
  roleInput: document.getElementById('role'),
  zoomInput: document.getElementById('zoom'),
  samplesButton: document.getElementById('samples'),
  autoFillButton: document.getElementById('autofill'),
  exportButton: document.getElementById('export'),
  status: document.getElementById('status'),
};

async function readyFonts() {
  // The display face and the script face are vendored under app/fonts/.
  const faces = [
    document.fonts.load('100px Anton'),
    document.fonts.load('100px "Great Vibes"'),
  ];
  await Promise.allSettled(faces);
  await document.fonts.ready;
}

const editor = createEditor(els);

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  document.body.classList.add('shot');
  await readyFonts();
  await runShot(shot, query, editor, loadImage);
} else {
  await readyFonts();
  editor.draw();
  // Start with the built-in samples so the first paint is already a poster.
  editor.loadSamples();
}
