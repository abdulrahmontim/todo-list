import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';
import { applySettings, prefersDarkScheme, resolveTheme, themeAttribute } from './theme';

const root = document.documentElement;

afterEach(() => {
  applySettings(DEFAULT_SETTINGS, false);
});

describe('resolveTheme', () => {
  it('uses the explicit choice when there is one', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the system when asked to', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('themeAttribute', () => {
  it('leaves the attribute off for system mode so the media query applies', () => {
    expect(themeAttribute('system')).toBeNull();
  });

  it('pins the palette for an explicit choice', () => {
    expect(themeAttribute('light')).toBe('light');
    expect(themeAttribute('dark')).toBe('dark');
  });
});

describe('prefersDarkScheme', () => {
  it('reports false when matchMedia is unavailable', () => {
    const original = window.matchMedia;
    // @ts-expect-error simulating a browser without matchMedia
    delete window.matchMedia;
    expect(prefersDarkScheme()).toBe(false);
    window.matchMedia = original;
  });
});

describe('applySettings', () => {
  it('pins the palette for an explicit theme', () => {
    applySettings({ ...DEFAULT_SETTINGS, theme: 'dark' }, false);
    expect(root.dataset.theme).toBe('dark');
  });

  it('removes the attribute for system mode', () => {
    applySettings({ ...DEFAULT_SETTINGS, theme: 'dark' }, false);
    applySettings({ ...DEFAULT_SETTINGS, theme: 'system' }, false);
    expect(root.dataset.theme).toBeUndefined();
  });

  it('toggles the high contrast attribute', () => {
    applySettings({ ...DEFAULT_SETTINGS, highContrast: true }, false);
    expect(root.dataset.contrast).toBe('high');
    applySettings({ ...DEFAULT_SETTINGS, highContrast: false }, false);
    expect(root.dataset.contrast).toBeUndefined();
  });

  it('writes a custom accent as custom properties', () => {
    const applied = applySettings({ ...DEFAULT_SETTINGS, accent: '#1d4ed8' }, false);
    expect(root.style.getPropertyValue('--accent')).toBe('#1d4ed8');
    expect(root.style.getPropertyValue('--focus')).toBe('#1d4ed8');
    expect(applied.accent?.contrastText).toBe('#ffffff');
    expect(applied.accentAdjusted).toBe(false);
  });

  it('adjusts an accent that would be unreadable and says so', () => {
    const applied = applySettings({ ...DEFAULT_SETTINGS, accent: '#ffff00' }, false);
    expect(applied.accentAdjusted).toBe(true);
    expect(root.style.getPropertyValue('--accent')).not.toBe('#ffff00');
  });

  it('falls back to the default accent when the value is not a color', () => {
    const applied = applySettings({ ...DEFAULT_SETTINGS, accent: null }, false);
    expect(applied.accent).toBeNull();
    expect(root.style.getPropertyValue('--accent')).toBe('');
  });

  it('resolves the theme it actually applied', () => {
    expect(applySettings({ ...DEFAULT_SETTINGS, theme: 'system' }, true).theme).toBe('dark');
  });
});
