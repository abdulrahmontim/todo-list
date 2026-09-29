import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, isThemeMode, normalizeSettings, THEME_MODES } from './settings';

describe('normalizeSettings', () => {
  it('falls back to the defaults for anything unusable', () => {
    for (const value of [null, undefined, 42, 'dark', []]) {
      expect(normalizeSettings(value)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('keeps valid values', () => {
    expect(normalizeSettings({ theme: 'dark', accent: '#1D4ED8', highContrast: true })).toEqual({
      theme: 'dark',
      accent: '#1d4ed8',
      highContrast: true,
    });
  });

  it('replaces invalid fields one by one', () => {
    expect(normalizeSettings({ theme: 'neon', accent: 'purple', highContrast: 'yes' })).toEqual({
      ...DEFAULT_SETTINGS,
    });
  });

  it('treats a missing accent as "use the theme default"', () => {
    expect(normalizeSettings({ theme: 'light' }).accent).toBeNull();
  });
});

describe('isThemeMode', () => {
  it('accepts exactly the three supported modes', () => {
    for (const mode of THEME_MODES) expect(isThemeMode(mode)).toBe(true);
    expect(isThemeMode('auto')).toBe(false);
    expect(isThemeMode(1)).toBe(false);
  });
});
