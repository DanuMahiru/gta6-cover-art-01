// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone at the requested size.
// Query: photo (sample name), title, subtitle, layout, grade, w, h.
// window.__shotReady is set once the scene painted; ?shot=export-test also
// proves the PNG export path by writing the blob size into document.title.

export async function runShot(shot, query, editor, loadImage) {
  const photo = query.get('photo') ?? 'pier';
  const title = query.get('title') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'one last summer';
  const layout = query.get('layout') ?? 'classic';
  const grade = query.get('grade') ?? 'sunset';

  editor.setLayout(layout);
  editor.setGrade(grade);
  editor.setTitle(title);
  editor.setSubtitle(subtitle);

  if (shot === 'cover' || shot === 'export-test') {
    document.body.classList.add('shot-cover');
    const w = Number(query.get('w') || 1920);
    const h = Number(query.get('h') || 1080);
    editor.setPreviewSizeForShot(w, h);
  }

  try {
    await editor.loadSample(photo);
  } catch {
    // A missing sample leaves the panels empty; the scene still renders.
  }
  // Load the other sample too, so the panels show different photos instead
  // of the same face six times.
  const other = photo === 'pier' ? 'boulevard' : 'pier';
  try {
    await editor.loadSample(other);
  } catch {
    // As above: not fatal.
  }
  editor.autoFill();

  if (shot === 'export-test') {
    const out = await editor.exportPng();
    document.title = out ? `exported:${out.blob.size}:${out.blob.type}` : 'export-failed';
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
