/**
 * WCAG 2.1 contrast math. Pure functions only, no DOM access, so they can be
 * unit tested and reused by the settings page and the token self-check.
 */

export type Rgb = {
  r: number;
  g: number;
  b: number;
};

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function clampChannel(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function toHexPart(value: number): string {
  return clampChannel(value).toString(16).padStart(2, '0');
}

export function parseHexColor(value: string): Rgb | null {
  const match = HEX_PATTERN.exec(value.trim());
  const hex = match?.[1];
  if (!hex) return null;

  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Normalizes any accepted hex form to `#rrggbb`, or null when unparseable. */
export function normalizeHex(value: string): string | null {
  const rgb = parseHexColor(value);
  return rgb ? toHex(rgb) : null;
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
}

function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Contrast ratio between two colors, from 1 to 21. Order does not matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Contrast ratio for two hex colors, or null when either cannot be parsed. */
export function hexContrastRatio(a: string, b: string): number | null {
  const first = parseHexColor(a);
  const second = parseHexColor(b);
  if (!first || !second) return null;
  return contrastRatio(first, second);
}

export function mix(a: Rgb, b: Rgb, weight: number): Rgb {
  const w = Math.min(1, Math.max(0, weight));
  return {
    r: a.r * w + b.r * (1 - w),
    g: a.g * w + b.g * (1 - w),
    b: a.b * w + b.b * (1 - w),
  };
}

export const WHITE: Rgb = { r: 255, g: 255, b: 255 };
export const BLACK: Rgb = { r: 0, g: 0, b: 0 };

/**
 * Luminance at which white and black text score the same contrast (4.58:1, the
 * worst case of the whole range). Named so the inline script in index.html can
 * use the same number without duplicating the formula.
 */
export const LUMINANCE_CROSSOVER = 0.1791;

/**
 * Picks the text color that reads best on a background. Between the two, the
 * worst case is 4.58:1, so this always clears AA text contrast.
 */
export function readableTextOn(background: Rgb): Rgb {
  return relativeLuminance(background) > LUMINANCE_CROSSOVER ? BLACK : WHITE;
}

export function readableTextHex(background: string): string {
  const rgb = parseHexColor(background);
  return rgb ? toHex(readableTextOn(rgb)) : toHex(WHITE);
}

/** A shade that stands out against the text color picked for this background. */
export function hoverShade(background: Rgb, weight = 0.85): Rgb {
  return mix(background, readableTextOn(background) === WHITE ? BLACK : WHITE, weight);
}

export function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100;
}

/** WCAG AA for body text and UI boundaries respectively. */
export const AA_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AA_NON_TEXT = 3;
