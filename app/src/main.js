// Vice Panels — the editor. Wires the page: load photos from the person's own machine (file
// picker or drag and drop, read locally, never uploaded), fill the collage panels, crop each
// panel by dragging and zooming, switch layouts and colour grades, edit the title and caption,
// and export the cover as a PNG at 1080x1080, 1080x1350 or 1920x1080. A `?shot=` query instead
// sets up one fixed scene for a screenshot (./shots.js).

import { drawCoverArt } from './cover.js';
import { COVER_LAYOUTS, layoutById } from './layouts.js';
import { COLOUR_GRADES, gradeById } from './grades.js';
import { parseShotScene, SHOT_PANEL_CROPS, markShotReady } from './shots.js';

/** The bundled sample photos, drawn for this app, offered before the user loads their own. */
export const SAMPLE_PHOTOS = [
  { name: 'sunset-boulevard', label: 'Sunset Boulevard' },
  { name: 'neon-pier', label: 'Neon Pier' },
  { name: 'skyline-heli', label: 'Skyline Chopper' },
  { name: 'classic-boulevard', label: 'Palm Boulevard' },
  { name: 'classic-pier', label: 'The Pier' },
];

/** The export sizes the posters are posted at: square, portrait and landscape. */
export const EXPORT_SIZES = [
  { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
];

const canvas = document.getElementById('coverCanvas');
const titleInput = document.getElementById('titleText');
const captionInput = document.getElementById('captionText');
const zoomRange = document.getElementById('zoomRange');
const statusLine = document.getElementById('statusLine');
const tray = document.getElementById('photoTray');
const layoutBar = document.getElementById('layoutBar');
const gradeBar = document.getElementById('gradeBar');
const panelLabel = document.getElementById('panelLabel');

/** The whole editor state: loaded photos, one crop slot per panel, and the words. */
export const editorState = {
  photos: [],
  slots: [],
  selectedPanel: 0,
  selectedPhoto: -1,
  layout: layoutById('grid6'),
  grade: gradeById('sunset'),
  title: 'VICE HEAT',
  caption: 'Sunset Heist',
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Makes sure there is a crop slot for every panel of the current layout. */
export function ensureSlots() {
  while (editorState.slots.length < editorState.layout.panels.length) {
    editorState.slots.push({ img: null, panX: 0, panY: 0, zoom: 1 });
  }
  if (editorState.selectedPanel >= editorState.layout.panels.length) editorState.selectedPanel = 0;
}

/** Redraws the live preview from the current state. */
export function redrawPreview() {
  ensureSlots();
  drawCoverArt(canvas, {
    layout: editorState.layout,
    grade: editorState.grade,
    slots: editorState.slots,
    title: editorState.title,
    caption: editorState.caption,
    selected: editorState.selectedPanel,
  });
  panelLabel.textContent = `Panel ${editorState.selectedPanel + 1} of ${editorState.layout.panels.length}`;
  const slot = editorState.slots[editorState.selectedPanel];
  if (slot) zoomRange.value = String(Math.round(slot.zoom * 100));
}

/** Adds a loaded image to the photo tray and returns its tray index. */
export function addPhotoToTray(img, label) {
  editorState.photos.push({ img, label });
  const index = editorState.photos.length - 1;
  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = 'thumb';
  thumb.title = label;
  const pic = document.createElement('img');
  pic.src = img.src;
  pic.alt = label;
  thumb.appendChild(pic);
  thumb.addEventListener('click', () => selectPhoto(index));
  tray.appendChild(thumb);
  return index;
}

/** Marks a tray photo as chosen and fills the selected panel with it. */
export function selectPhoto(index) {
  editorState.selectedPhoto = index;
  [...tray.children].forEach((el, i) => el.classList.toggle('chosen', i === index));
  const photo = editorState.photos[index];
  if (!photo) return;
  ensureSlots();
  const slot = editorState.slots[editorState.selectedPanel];
  slot.img = photo.img;
  statusLine.textContent = `${photo.label} fills panel ${editorState.selectedPanel + 1}. Pick another panel to place it elsewhere too.`;
  redrawPreview();
}

/** Builds a row of toggle buttons (layouts or grades) into a container. */
export function buildToggleBar(container, items, currentId, onPick) {
  container.textContent = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.className = item.id === currentId ? 'toggle chosen' : 'toggle';
    btn.addEventListener('click', () => onPick(item.id));
    container.appendChild(btn);
  });
}

/** Refreshes both toggle bars after a layout or grade change. */
export function refreshToggleBars() {
  buildToggleBar(layoutBar, COVER_LAYOUTS, editorState.layout.id, (id) => {
    editorState.layout = layoutById(id);
    refreshToggleBars();
    redrawPreview();
  });
  buildToggleBar(gradeBar, COLOUR_GRADES, editorState.grade.id, (id) => {
    editorState.grade = gradeById(id);
    refreshToggleBars();
    redrawPreview();
  });
}

/** Renders the cover offscreen at an export size and downloads it as a PNG. */
export function exportCoverPng(width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  drawCoverArt(off, {
    layout: editorState.layout,
    grade: editorState.grade,
    slots: editorState.slots,
    title: editorState.title,
    caption: editorState.caption,
    selected: null,
  });
  off.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-panels-cover-${width}x${height}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    statusLine.textContent = `Saved vice-panels-cover-${width}x${height}.png`;
  }, 'image/png');
}

/** Reads the person's own image files locally and adds each to the tray. */
export async function ingestFiles(fileList) {
  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImageElement(URL.createObjectURL(file));
    const index = addPhotoToTray(img, file.name);
    selectPhoto(index);
  }
}

/** Applies a parsed shot scene: samples into the panels, words, layout and grade. */
export async function applyShotScene(scene) {
  editorState.layout = layoutById(scene.layoutId);
  editorState.grade = gradeById(scene.gradeId);
  editorState.title = scene.title;
  editorState.caption = scene.caption;
  titleInput.value = scene.title;
  captionInput.value = scene.caption;
  ensureSlots();
  const loaded = [];
  for (const name of scene.photos) {
    loaded.push(await loadImageElement(`samples/${name}.jpg`));
  }
  if (scene.mode === 'editor') {
    // The editor screenshot must show the tray as a user sees it: every scene photo, thumbnailed.
    const seen = new Set();
    scene.photos.forEach((name, i) => {
      if (seen.has(name)) return;
      seen.add(name);
      const sample = SAMPLE_PHOTOS.find((s) => s.name === name);
      addPhotoToTray(loaded[i], sample ? sample.label : name);
    });
  }
  editorState.layout.panels.forEach((panel, i) => {
    const crop = SHOT_PANEL_CROPS[i % SHOT_PANEL_CROPS.length];
    editorState.slots[i] = {
      img: loaded[i % loaded.length],
      panX: crop.panX,
      panY: crop.panY,
      zoom: crop.zoom,
    };
  });
  if (scene.mode === 'cover') {
    document.body.classList.add('shot-cover');
    canvas.width = scene.width;
    canvas.height = scene.height;
    drawCoverArt(canvas, {
      layout: editorState.layout,
      grade: editorState.grade,
      slots: editorState.slots,
      title: editorState.title,
      caption: editorState.caption,
      selected: null,
    });
  } else {
    refreshToggleBars();
    redrawPreview();
  }
  markShotReady();
}

/** Wires every control on the page. */
export function wireEditorControls() {
  document.getElementById('photoFiles').addEventListener('change', (event) => {
    ingestFiles(event.target.files);
  });
  const dropZone = document.getElementById('canvasWrap');
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dropping');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dropping'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dropping');
    ingestFiles(event.dataTransfer.files);
  });
  titleInput.addEventListener('input', () => {
    editorState.title = titleInput.value;
    redrawPreview();
  });
  captionInput.addEventListener('input', () => {
    editorState.caption = captionInput.value;
    redrawPreview();
  });
  zoomRange.addEventListener('input', () => {
    const slot = editorState.slots[editorState.selectedPanel];
    if (slot) slot.zoom = Number(zoomRange.value) / 100;
    redrawPreview();
  });
  document.querySelectorAll('[data-export-w]').forEach((btn) => {
    btn.addEventListener('click', () => exportCoverPng(Number(btn.dataset.exportW), Number(btn.dataset.exportH)));
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const fx = (event.clientX - rect.left) / rect.width;
    const fy = (event.clientY - rect.top) / rect.height;
    const hit = editorState.layout.panels.findIndex(
      (p) => fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h,
    );
    if (hit >= 0) editorState.selectedPanel = hit;
    canvas.setPointerCapture(event.pointerId);
    canvas.dataset.dragX = String(event.clientX);
    canvas.dataset.dragY = String(event.clientY);
    redrawPreview();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!canvas.hasPointerCapture(event.pointerId) || canvas.dataset.dragX === undefined) return;
    const slot = editorState.slots[editorState.selectedPanel];
    if (!slot || !slot.img) return;
    const rect = canvas.getBoundingClientRect();
    slot.panX = Math.max(-1, Math.min(1, slot.panX + (event.clientX - Number(canvas.dataset.dragX)) / rect.width * 2));
    slot.panY = Math.max(-1, Math.min(1, slot.panY + (event.clientY - Number(canvas.dataset.dragY)) / rect.height * 2));
    canvas.dataset.dragX = String(event.clientX);
    canvas.dataset.dragY = String(event.clientY);
    redrawPreview();
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const slot = editorState.slots[editorState.selectedPanel];
    if (!slot) return;
    slot.zoom = Math.max(1, Math.min(3, slot.zoom * (event.deltaY < 0 ? 1.06 : 0.94)));
    redrawPreview();
  }, { passive: false });
}

/** Loads the hero samples so the app opens on a finished-looking collage. */
export async function loadDefaultSamples() {
  const heroes = SAMPLE_PHOTOS.slice(0, 3);
  for (const sample of heroes) {
    const img = await loadImageElement(`samples/${sample.name}.jpg`);
    addPhotoToTray(img, sample.label);
  }
  ensureSlots();
  editorState.layout.panels.forEach((panel, i) => {
    const crop = SHOT_PANEL_CROPS[i % SHOT_PANEL_CROPS.length];
    editorState.slots[i] = {
      img: editorState.photos[i % editorState.photos.length].img,
      panX: crop.panX,
      panY: crop.panY,
      zoom: crop.zoom,
    };
  });
}

/** Entry point: shot scene when the query asks for one, otherwise the live editor. */
export async function startApp() {
  wireEditorControls();
  refreshToggleBars();
  try {
    await document.fonts.load('64px AntonCover');
  } catch {
    // The vendored font is a plain file under app/fonts; if it cannot load the fallback face still draws.
  }
  const scene = parseShotScene(new URLSearchParams(location.search));
  if (scene) {
    await applyShotScene(scene);
    return;
  }
  await loadDefaultSamples();
  redrawPreview();
  statusLine.textContent = 'Samples loaded. Add your own photos, click a panel, drag to crop.';
}

startApp();
