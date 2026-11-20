// The cover renderer: draws the panel collage, the colour grade and the bold display lettering
// onto any 2D canvas at whatever size that canvas is, so the editor preview and the exported
// PNGs (1080x1080, 1080x1350, 1920x1080) are the very same drawing at different resolutions.

/** The display face used for all cover lettering (vendored under app/fonts, OFL licensed). */
export const COVER_FONT_FAMILY = 'AntonCover, sans-serif';

/**
 * Draws one photo into a panel rectangle with cover-fit scaling: `zoom` multiplies the fit
 * scale and `panX` / `panY` (each -1..1) slide the crop window across the overflow.
 */
export function drawPhotoInPanel(ctx, img, rect, panX, panY, zoom) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const drawnW = img.naturalWidth * scale;
  const drawnH = img.naturalHeight * scale;
  const x = rect.x + (rect.w - drawnW) / 2 + panX * (drawnW - rect.w) / 2;
  const y = rect.y + (rect.h - drawnH) / 2 + panY * (drawnH - rect.h) / 2;
  ctx.drawImage(img, x, y, drawnW, drawnH);
}

/** Fills a panel that has no photo yet with a dusk gradient and its panel number. */
export function drawEmptyPanel(ctx, rect, index, minSide) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, '#3a2358');
  grad.addColorStop(1, '#17102a');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = `${Math.round(minSide * 0.16)}px ${COVER_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
}

/** Washes the grade's three-stop gradient and vignette over the finished collage. */
export function applyColourGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.overlay[0]);
  wash.addColorStop(0.55, grade.overlay[1]);
  wash.addColorStop(1, grade.overlay[2]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, `rgba(0, 0, 0, ${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Fits a font size so `text` spans at most `maxWidth`, shrinking from `startSize`. */
export function fitFontSize(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size *= 0.94;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/**
 * Draws poster lettering with a heavy dark outline: the title across the top in white with a
 * warm drop shadow, the caption along the foot in warm yellow, each centred and auto-fitted.
 */
export function drawCoverLettering(ctx, w, h, title, caption) {
  const minSide = Math.min(w, h);
  ctx.textAlign = 'center';
  const titleText = title.trim().toUpperCase();
  if (titleText) {
    const size = fitFontSize(ctx, titleText, w * 0.92, minSide * 0.135, COVER_FONT_FAMILY);
    ctx.font = `${size}px ${COVER_FONT_FAMILY}`;
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = 'rgba(10, 6, 20, 0.92)';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 64, 140, 0.55)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = size * 0.07;
    ctx.strokeText(titleText, w / 2, size * 1.18);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(titleText, w / 2, size * 1.18);
    ctx.shadowOffsetY = 0;
  }
  const captionText = caption.trim().toUpperCase();
  if (captionText) {
    const size = fitFontSize(ctx, captionText, w * 0.92, minSide * 0.115, COVER_FONT_FAMILY);
    ctx.font = `${size}px ${COVER_FONT_FAMILY}`;
    ctx.lineWidth = size * 0.17;
    ctx.strokeStyle = 'rgba(10, 6, 20, 0.92)';
    ctx.lineJoin = 'round';
    ctx.strokeText(captionText, w / 2, h - minSide * 0.045);
    const grad = ctx.createLinearGradient(0, h - size * 1.4, 0, h);
    grad.addColorStop(0, '#ffe259');
    grad.addColorStop(1, '#ff7b39');
    ctx.fillStyle = grad;
    ctx.fillText(captionText, w / 2, h - minSide * 0.045);
  }
}

/**
 * Draws the whole cover described by `scene` onto `canvas` at the canvas's own size.
 * scene: { layout, grade, slots: [{img, panX, panY, zoom}...], title, caption, selected }
 * When scene.selected is a panel index (editor only), that panel gets a cyan outline.
 */
export function drawCoverArt(canvas, scene) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const minSide = Math.min(w, h);
  const gutter = Math.max(3, Math.round(minSide * 0.008));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  scene.layout.panels.forEach((panel, index) => {
    const rect = {
      x: panel.x * w + gutter / 2,
      y: panel.y * h + gutter / 2,
      w: panel.w * w - gutter,
      h: panel.h * h - gutter,
    };
    const slot = scene.slots[index] ?? { img: null, panX: 0, panY: 0, zoom: 1 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (slot.img) {
      ctx.filter = scene.grade.filter;
      drawPhotoInPanel(ctx, slot.img, rect, slot.panX, slot.panY, slot.zoom);
      ctx.filter = 'none';
    } else {
      drawEmptyPanel(ctx, rect, index, minSide);
    }
    ctx.restore();
  });
  applyColourGrade(ctx, w, h, scene.grade);
  // Crisp white panel borders over the grade, the poster's signature framing.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gutter;
  scene.layout.panels.forEach((panel) => {
    ctx.strokeRect(panel.x * w + gutter / 2, panel.y * h + gutter / 2, panel.w * w - gutter, panel.h * h - gutter);
  });
  ctx.strokeRect(gutter / 2, gutter / 2, w - gutter, h - gutter);
  drawCoverLettering(ctx, w, h, scene.title, scene.caption);
  if (Number.isInteger(scene.selected)) {
    const panel = scene.layout.panels[scene.selected];
    if (panel) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(3, gutter * 0.8);
      ctx.setLineDash([minSide * 0.03, minSide * 0.018]);
      ctx.strokeRect(panel.x * w + gutter * 1.4, panel.y * h + gutter * 1.4, panel.w * w - gutter * 2.8, panel.h * h - gutter * 2.8);
      ctx.setLineDash([]);
    }
  }
}
