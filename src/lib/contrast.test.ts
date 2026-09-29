import { describe, expect, it } from 'vitest';
import {
  AA_TEXT,
  contrastRatio,
  hexContrastRatio,
  mix,
  normalizeHex,
  parseHexColor,
  readableTextHex,
  readableTextOn,
  relativeLuminance,
  toHex,
} from './contrast';

describe('parseHexColor', () => {
  it('parses 6 digit hex with and without the leading hash', () => {
    expect(parseHexColor('#1d4ed8')).toEqual({ r: 29, g: 78, b: 216 });
    expect(parseHexColor('1d4ed8')).toEqual({ r: 29, g: 78, b: 216 });
  });

  it('expands 3 digit hex', () => {
    expect(parseHexColor('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('rejects anything that is not a hex color', () => {
    for (const value of ['', 'red', '#12345', 'rgb(1,2,3)', '#gggggg', '#1d4ed8ff']) {
      expect(parseHexColor(value)).toBeNull();
    }
  });
});

describe('normalizeHex', () => {
  it('always produces a lowercase #rrggbb value', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc');
    expect(normalizeHex(' #1D4ED8 ')).toBe('#1d4ed8');
  });

  it('returns null for invalid input', () => {
    expect(normalizeHex('nope')).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('matches the reference values from the WCAG spec', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white and 1 for identical colors', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 5);
    expect(contrastRatio({ r: 18, g: 18, b: 18 }, { r: 18, g: 18, b: 18 })).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    const a = { r: 29, g: 78, b: 216 };
    const b = { r: 242, g: 245, b: 249 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});

describe('hexContrastRatio', () => {
  it('returns null when a color cannot be parsed', () => {
    expect(hexContrastRatio('#fff', 'not-a-color')).toBeNull();
  });
});

describe('mix', () => {
  it('weights the first color', () => {
    expect(toHex(mix({ r: 0, g: 0, b: 0 }, { r: 100, g: 100, b: 100 }, 1))).toBe('#000000');
    expect(toHex(mix({ r: 0, g: 0, b: 0 }, { r: 100, g: 100, b: 100 }, 0))).toBe('#646464');
  });

  it('clamps the weight', () => {
    expect(toHex(mix({ r: 0, g: 0, b: 0 }, { r: 100, g: 100, b: 100 }, 5))).toBe('#000000');
  });
});

describe('readableTextOn', () => {
  it('always clears AA text contrast, whatever the background', () => {
    const samples = ['#000000', '#1d4ed8', '#808080', '#74a9ff', '#f2f5f9', '#ffff00', '#00ff00', '#7f7f7f'];
    for (const background of samples) {
      const rgb = parseHexColor(background)!;
      const text = readableTextOn(rgb);
      const ratio = contrastRatio(rgb, text);
      expect(ratio, `${background} with ${toHex(text)}`).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('uses light text on dark backgrounds and dark text on light backgrounds', () => {
    expect(readableTextHex('#1d4ed8')).toBe('#ffffff');
    expect(readableTextHex('#f2f5f9')).toBe('#000000');
  });

  it('falls back to white text when the background is unparseable', () => {
    expect(readableTextHex('nope')).toBe('#ffffff');
  });
});
