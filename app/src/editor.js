// Vice Cover Studio — the editor.
//
// Owns the poster state, the photo tray, the panel controls and the live
// preview. The poster itself is drawn by poster.js; this file only wires
// the page to it. Photos live on the person's machine: uploads use object
// URLs, the built-in samples are files under app/samples/. v2: six
// built-in samples instead of two, and a hero pop-out toggle.

import { drawPoster, renderCover, layoutById, gradeById, LAYOUTS, GRADES, EXPORT_SIZES, DEFAULT_ROLES } from './poster.js';

// The built-in samples, in tray order. v2 ships six faces so the panels
// stop repeating the same two people; the two v1 samples still work.
export const SAMPLES = ['pier', 'boulevard', 'rooftop', 'street', 'beach', 'diner'];

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

export function createEditor(els) {
  const state = {
    title: 'SUNSET HEIST',
    subtitle: 'one last summer',
    tagline: 'Every sunset has a price',
    quote: 'GOLDEN HOUR, CRIMINAL INTENT',
    source: 'THE SUNSET GAZETTE',
    layoutId: 'classic',
    gradeId: 'sunset',
    sizeId: '1080x1080',
    popout: true, // v2: the hero photo bursts out of its panel as a cut-out
    panels: [],
  };
  const tray = []; // { name, img }
  let selected = 0;
  let previewSize = { w: 1080, h: 1080 };
  let renderQueued = false;

  function panelCount() {
    return layoutById(state.layoutId).describe(previewSize.w, previewSize.h).panels.length;
  }

  function syncPanels() {
    const n = panelCount();
    while (state.panels.length < n) {
      const i = state.panels.length;
      state.panels.push({ photo: null, fx: 0.5, fy: 0.35, zoom: 1, role: DEFAULT_ROLES[i % DEFAULT_ROLES.length] });
    }
    state.panels.length = n;
    if (selected >= n) selected = 0;
  }

  function draw() {
    const canvas = els.canvas;
    canvas.width = previewSize.w;
    canvas.height = previewSize.h;
    drawPoster(canvas.getContext('2d'), previewSize.w, previewSize.h, state);
    if (els.roleInput) {
      const p = state.panels[selected];
      if (p && els.roleInput.value !== p.role) els.roleInput.value = p.role;
    }
    if (els.zoomInput) {
      const p = state.panels[selected];
      if (p) els.zoomInput.value = String(Math.round(p.zoom * 100));
    }
  }

  function queueDraw() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      draw();
    });
  }

  function setPreviewSize() {
    const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[0];
    const cap = 880;
    const scale = Math.min(1, cap / Math.max(size.w, size.h));
    previewSize = { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
    syncPanels();
    queueDraw();
  }

  function addTrayPhoto(name, img) {
    const existing = tray.find((t) => t.name === name);
    if (existing) return existing;
    const item = { name, img };
    tray.push(item);
    renderTray();
    return item;
  }

  function renderTray() {
    if (!els.tray) return;
    els.tray.innerHTML = '';
    tray.forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tray-item';
      b.title = item.name;
      const thumb = document.createElement('canvas');
      thumb.width = 96;
      thumb.height = 96;
      const tctx = thumb.getContext('2d');
      const s = Math.max(96 / item.img.naturalWidth, 96 / item.img.naturalHeight);
      const dw = item.img.naturalWidth * s;
      const dh = item.img.naturalHeight * s;
      tctx.drawImage(item.img, (96 - dw) / 2, (96 - dh) / 2, dw, dh);
      b.appendChild(thumb);
      const label = document.createElement('span');
      label.textContent = item.name;
      b.appendChild(label);
      b.addEventListener('click', () => {
        const p = state.panels[selected];
        if (!p) return;
        p.photo = item.img;
        p.fx = 0.5;
        p.fy = 0.35;
        p.zoom = 1;
        queueDraw();
      });
      els.tray.appendChild(b);
    });
  }

  function autoFill() {
    const photos = tray.map((t) => t.img);
    if (!photos.length) return;
    state.panels.forEach((p, i) => {
      p.photo = photos[i % photos.length];
      p.fx = 0.5;
      p.fy = 0.35;
      p.zoom = 1;
    });
    queueDraw();
  }

  async function loadSample(name) {
    const img = await loadImage(`samples/${name}.jpg`);
    return addTrayPhoto(`${name}.jpg`, img);
  }

  async function loadSamples() {
    for (const name of SAMPLES) {
      try {
        await loadSample(name);
      } catch {
        // A missing sample is not fatal: the editor still works with uploads.
      }
    }
    autoFill();
  }

  function panelAt(clientX, clientY) {
    const canvas = els.canvas;
    const box = canvas.getBoundingClientRect();
    const x = ((clientX - box.left) / box.width) * previewSize.w;
    const y = ((clientY - box.top) / box.height) * previewSize.h;
    const geo = layoutById(state.layoutId).describe(previewSize.w, previewSize.h);
    for (let i = geo.panels.length - 1; i >= 0; i--) {
      const r = geo.panels[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return { index: i, x, y, rect: r };
      }
    }
    return null;
  }

  function bind() {
    // Text inputs.
    const textBindings = [
      ['titleInput', 'title'], ['subtitleInput', 'subtitle'], ['taglineInput', 'tagline'],
      ['quoteInput', 'quote'], ['sourceInput', 'source'],
    ];
    for (const [el, key] of textBindings) {
      if (!els[el]) continue;
      els[el].value = state[key];
      els[el].addEventListener('input', () => {
        state[key] = els[el].value;
        queueDraw();
      });
    }
    // Layout picker.
    if (els.layoutPicker) {
      els.layoutPicker.innerHTML = '';
      for (const l of LAYOUTS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pick' + (l.id === state.layoutId ? ' active' : '');
        b.textContent = l.name;
        b.addEventListener('click', () => {
          state.layoutId = l.id;
          syncPanels();
          els.layoutPicker.querySelectorAll('.pick').forEach((x) => x.classList.toggle('active', x === b));
          queueDraw();
        });
        els.layoutPicker.appendChild(b);
      }
    }
    // Grade picker.
    if (els.gradePicker) {
      els.gradePicker.innerHTML = '';
      for (const g of GRADES) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pick' + (g.id === state.gradeId ? ' active' : '');
        b.textContent = g.name;
        b.addEventListener('click', () => {
          state.gradeId = g.id;
          els.gradePicker.querySelectorAll('.pick').forEach((x) => x.classList.toggle('active', x === b));
          queueDraw();
        });
        els.gradePicker.appendChild(b);
      }
    }
    // Export size picker.
    if (els.sizePicker) {
      els.sizePicker.innerHTML = '';
      for (const s of EXPORT_SIZES) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pick' + (s.id === state.sizeId ? ' active' : '');
        b.textContent = s.label;
        b.addEventListener('click', () => {
          state.sizeId = s.id;
          setPreviewSize();
          els.sizePicker.querySelectorAll('.pick').forEach((x) => x.classList.toggle('active', x === b));
        });
        els.sizePicker.appendChild(b);
      }
    }
    // Hero pop-out toggle (v2): on by default; unchecking keeps the hero
    // inside its panel, exactly like v1.
    if (els.popoutInput) {
      els.popoutInput.checked = state.popout;
      els.popoutInput.addEventListener('change', () => {
        state.popout = els.popoutInput.checked;
        queueDraw();
      });
    }
    // Photo upload + drag and drop.
    if (els.photoInput) {
      els.photoInput.addEventListener('change', async (e) => {
        for (const file of e.target.files || []) {
          try {
            const img = await loadImage(URL.createObjectURL(file));
            addTrayPhoto(file.name, img);
          } catch { /* skip unreadable files */ }
        }
        autoFill();
        e.target.value = '';
      });
    }
    if (els.dropZone) {
      els.dropZone.addEventListener('dragover', (e) => e.preventDefault());
      els.dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        for (const file of e.dataTransfer.files || []) {
          if (!file.type.startsWith('image/')) continue;
          try {
            const img = await loadImage(URL.createObjectURL(file));
            addTrayPhoto(file.name, img);
          } catch { /* skip unreadable files */ }
        }
        autoFill();
      });
    }
    if (els.samplesButton) els.samplesButton.addEventListener('click', loadSamples);
    if (els.autoFillButton) els.autoFillButton.addEventListener('click', autoFill);
    // Selected panel: role + zoom.
    if (els.roleInput) {
      els.roleInput.addEventListener('input', () => {
        const p = state.panels[selected];
        if (p) {
          p.role = els.roleInput.value;
          queueDraw();
        }
      });
    }
    if (els.zoomInput) {
      els.zoomInput.addEventListener('input', () => {
        const p = state.panels[selected];
        if (p) {
          p.zoom = Math.max(1, Number(els.zoomInput.value) / 100);
          queueDraw();
        }
      });
    }
    // Canvas: click to select a panel, drag to pan its photo, wheel to zoom.
    const canvas = els.canvas;
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      const hit = panelAt(e.clientX, e.clientY);
      if (!hit) return;
      selected = hit.index;
      drag = { x: hit.x, y: hit.y, fx: state.panels[selected].fx, fy: state.panels[selected].fy };
      canvas.setPointerCapture(e.pointerId);
      queueDraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const hit = panelAt(e.clientX, e.clientY);
      if (!hit) return;
      const p = state.panels[selected];
      const rect = hit.rect;
      // Dragging moves the focus point opposite to the pointer.
      const img = p.photo;
      if (!img) return;
      const s = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * Math.max(1, p.zoom);
      p.fx = drag.fx - (hit.x - drag.x) / (img.naturalWidth * s);
      p.fy = drag.fy - (hit.y - drag.y) / (img.naturalHeight * s);
      p.fx = Math.min(1, Math.max(0, p.fx));
      p.fy = Math.min(1, Math.max(0, p.fy));
      queueDraw();
    });
    canvas.addEventListener('pointerup', () => { drag = null; });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const hit = panelAt(e.clientX, e.clientY);
      if (!hit) return;
      selected = hit.index;
      const p = state.panels[selected];
      p.zoom = Math.min(3, Math.max(1, p.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      queueDraw();
    }, { passive: false });
    // Export.
    if (els.exportButton) {
      els.exportButton.addEventListener('click', () => exportPng());
    }
  }

  async function exportPng() {
    const size = EXPORT_SIZES.find((s) => s.id === state.sizeId) || EXPORT_SIZES[0];
    const canvas = renderCover(state, size.w, size.h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      if (els.status) els.status.textContent = 'Export failed: the browser could not make the PNG.';
      return null;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    if (els.status) els.status.textContent = `Saved vice-cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB).`;
    return { blob, size };
  }

  setPreviewSize();
  bind();
  return {
    state, tray, draw: queueDraw, loadSample, loadSamples, autoFill, exportPng,
    setTitle(t) { state.title = t; if (els.titleInput) els.titleInput.value = t; queueDraw(); },
    setSubtitle(t) { state.subtitle = t; if (els.subtitleInput) els.subtitleInput.value = t; queueDraw(); },
    setLayout(id) { state.layoutId = id; syncPanels(); queueDraw(); },
    setGrade(id) { state.gradeId = id; queueDraw(); },
    setPopout(v) { state.popout = !!v; if (els.popoutInput) els.popoutInput.checked = state.popout; queueDraw(); },
    setSize(id) { state.sizeId = id; setPreviewSize(); },
    setPreviewSizeForShot(w, h) {
      previewSize = { w, h };
      syncPanels();
      queueDraw();
    },
  };
}
