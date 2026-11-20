// Panel collage layouts in the classic multi-panel poster style. Each layout is a list of panel
// rectangles in fractions of the cover (x, y, w, h from 0 to 1); the renderer insets them by a
// white gutter so every panel gets the crisp white border the posters are known for.

/** The six-panel grid: three columns over two rows, the signature poster wall. */
export const LAYOUT_GRID_SIX = {
  id: 'grid6',
  label: 'Grid · 6 panels',
  panels: [
    { x: 0, y: 0, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
    { x: 0, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
  ],
};

/** One wide hero panel on top with a strip of three beneath it. */
export const LAYOUT_HERO_STRIPS = {
  id: 'hero',
  label: 'Hero + strips',
  panels: [
    { x: 0, y: 0, w: 1, h: 0.58 },
    { x: 0, y: 0.58, w: 1 / 3, h: 0.42 }, { x: 1 / 3, y: 0.58, w: 1 / 3, h: 0.42 }, { x: 2 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
  ],
};

/** The clean 2 x 2 quad, good for one photo repeated or four different ones. */
export const LAYOUT_QUAD = {
  id: 'quad',
  label: 'Quad · 2×2',
  panels: [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
};

/** A tall hero panel on the left with two stacked panels on the right. */
export const LAYOUT_HERO_SIDE = {
  id: 'side',
  label: 'Side hero',
  panels: [
    { x: 0, y: 0, w: 0.58, h: 1 },
    { x: 0.58, y: 0, w: 0.42, h: 0.5 }, { x: 0.58, y: 0.5, w: 0.42, h: 0.5 },
  ],
};

/** Every layout the editor offers, in menu order. */
export const COVER_LAYOUTS = [LAYOUT_GRID_SIX, LAYOUT_HERO_STRIPS, LAYOUT_QUAD, LAYOUT_HERO_SIDE];

/** Finds a layout by id, falling back to the six-panel grid. */
export function layoutById(id) {
  return COVER_LAYOUTS.find((layout) => layout.id === id) ?? LAYOUT_GRID_SIX;
}
