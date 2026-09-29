import { describe, expect, it } from 'vitest';
import { contrastRatio, hexContrastRatio, parseHexColor } from '../../lib/contrast';
import { ACCENT_PRESETS, resolveAccent, THEME_SURFACE } from './accent';
import type { ResolvedTheme } from './settings';

const THEMES: ResolvedTheme[] = ['light', 'dark'];

/** A spread of hues and lightnesses, including colors that need adjusting. */
const CANDIDATES = [
  ...ACCENT_PRESETS.map((preset) => preset.value),
  '#ffffff',
  '#000000',
  '#ffff00',
  '#00ff00',
  '#ff00ff',
  '#808080',
  '#7f7f7f',
  '#123',
  '#fefefe',
];

describe('resolveAccent', () => {
  it('returns null when the value is not a color', () => {
    expect(resolveAccent('chartreuse', 'light')).toBeNull();
    expect(resolveAccent('', 'light')).toBeNull();
  });

  it('leaves a color alone when it already works', () => {
    const resolved = resolveAccent('#1d4ed8', 'light');
    expect(resolved).toEqual({
      accent: '#1d4ed8',
      hover: expect.any(String),
      contrastText: '#ffffff',
      adjusted: false,
    });
  });

  it('darkens a light color so light button text stays readable', () => {
    const resolved = resolveAccent('#ffff00', 'light');
    expect(resolved).not.toBeNull();
    expect(resolved!.adjusted).toBe(true);
    expect(hexContrastRatio(resolved!.accent, resolved!.contrastText)!).toBeGreaterThanOrEqual(4.5);
  });

  it('lightens a dark color for the dark theme', () => {
    const resolved = resolveAccent('#000000', 'dark');
    expect(resolved!.adjusted).toBe(true);
    expect(hexContrastRatio(resolved!.accent, resolved!.contrastText)!).toBeGreaterThanOrEqual(4.5);
  });

  for (const theme of THEMES) {
    it(`always produces a readable accent for any color in the ${theme} theme`, () => {
      const surface = THEME_SURFACE[theme];
      for (const color of CANDIDATES) {
        const resolved = resolveAccent(color, theme);
        expect(resolved, color).not.toBeNull();

        const onAccent = hexContrastRatio(resolved!.contrastText, resolved!.accent)!;
        const onSurface = hexContrastRatio(resolved!.accent, surface)!;
        expect(onAccent, `${color} text on ${resolved!.accent}`).toBeGreaterThanOrEqual(4.5);
        expect(onSurface, `${resolved!.accent} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`moves the hover shade away from the text, never toward it, in the ${theme} theme`, () => {
      for (const color of CANDIDATES) {
        const resolved = resolveAccent(color, theme)!;
        const base = parseHexColor(resolved.accent)!;
        const hover = parseHexColor(resolved.hover)!;
        const toText = contrastRatio(hover, parseHexColor(resolved.contrastText)!);
        const fromText = contrastRatio(base, parseHexColor(resolved.contrastText)!);
        expect(toText, `${color} hover`).toBeGreaterThanOrEqual(fromText);
      }
    });
  }
});
