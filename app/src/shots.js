// Fixed scenes for screenshots: a `?shot=` query describes one whole cover or editor setup, so
// every screenshot in shots.json reproduces exactly. Recognised parameters: shot=cover|editor,
// layout and grade ids, title, caption, photos (comma-separated sample names, cycled across the
// panels), and w / h for the cover canvas's own pixel size. Once the scene is painted,
// window.__shotReady is set so the capture tool knows the frame is final.

/** Parses the page query into a shot scene, or returns null when no `shot` parameter is present. */
export function parseShotScene(params) {
  const mode = params.get('shot');
  if (!mode) return null;
  const photos = (params.get('photos') ?? 'sunset-boulevard')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return {
    mode,
    layoutId: params.get('layout') ?? 'grid6',
    gradeId: params.get('grade') ?? 'sunset',
    title: params.get('title') ?? 'VICE HEAT',
    caption: params.get('caption') ?? 'Sunset Heist',
    photos,
    width: Number(params.get('w')) || 1080,
    height: Number(params.get('h')) || 1080,
  };
}

/** Small per-panel crop presets so a shot's collage is composed, not merely centred. */
export const SHOT_PANEL_CROPS = [
  { panX: 0, panY: -0.15, zoom: 1.12 },
  { panX: -0.2, panY: 0, zoom: 1.2 },
  { panX: 0.15, panY: -0.1, zoom: 1.08 },
  { panX: 0, panY: 0.1, zoom: 1.25 },
  { panX: -0.1, panY: -0.2, zoom: 1.15 },
  { panX: 0.2, panY: 0.05, zoom: 1.1 },
];

/** Flags the painted shot as ready after two animation frames, so fonts and images have landed. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
