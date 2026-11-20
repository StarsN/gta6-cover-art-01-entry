// Colour grades: each preset is a canvas filter string (saturation / contrast / warmth) plus a
// gradient overlay the renderer washes over the whole collage in a blend-friendly alpha, so a
// flat phone photo picks up the sunset or neon cast of a Vice City poster.

/** Vice City sunset: warm magenta-and-amber wash, lifted saturation. */
export const GRADE_VICE_SUNSET = {
  id: 'sunset',
  label: 'Vice City sunset',
  filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
  overlay: ['rgba(255, 94, 58, 0)', 'rgba(255, 64, 140, 0.34)', 'rgba(64, 16, 96, 0.30)'],
  vignette: 0.22,
};

/** Neon night: cool teal shadows with a magenta bloom from the top. */
export const GRADE_NEON_NIGHT = {
  id: 'neon',
  label: 'Neon night',
  filter: 'saturate(1.45) contrast(1.16) brightness(0.98) hue-rotate(-8deg)',
  overlay: ['rgba(255, 46, 170, 0.26)', 'rgba(20, 10, 60, 0.10)', 'rgba(0, 200, 220, 0.24)'],
  vignette: 0.34,
};

/** Teal and orange: the blockbuster split-tone, teal shade against warm skin light. */
export const GRADE_TEAL_ORANGE = {
  id: 'teal',
  label: 'Teal / orange',
  filter: 'saturate(1.22) contrast(1.12)',
  overlay: ['rgba(255, 150, 60, 0.16)', 'rgba(0, 90, 110, 0.14)', 'rgba(0, 60, 90, 0.28)'],
  vignette: 0.26,
};

/** Noir: drained black-and-white with hard contrast and a deep vignette. */
export const GRADE_NOIR = {
  id: 'noir',
  label: 'B&W noir',
  filter: 'grayscale(1) contrast(1.28) brightness(1.02)',
  overlay: ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.10)', 'rgba(0, 0, 0, 0.34)'],
  vignette: 0.42,
};

/** Every grade the editor offers, in menu order. */
export const COLOUR_GRADES = [GRADE_VICE_SUNSET, GRADE_NEON_NIGHT, GRADE_TEAL_ORANGE, GRADE_NOIR];

/** Finds a grade by id, falling back to the Vice City sunset. */
export function gradeById(id) {
  return COLOUR_GRADES.find((grade) => grade.id === id) ?? GRADE_VICE_SUNSET;
}
