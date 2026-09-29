import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from './storage';
import { applySettings } from './theme';
import { normalizeSettings, type Settings } from './settings';
import indexHtml from '../../../index.html?raw';

/**
 * The no-flash script in index.html cannot import anything, so it duplicates
 * the theme logic. These tests run the real inline script against a real
 * element and compare it with applySettings, so the two cannot drift apart.
 */

const inlineScript = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)?.[1];

function runInlineScript(saved: string | null): HTMLElement {
  const root = document.createElement('html');
  const storage: Record<string, string> = {};

  if (saved !== null) storage[STORAGE_KEY] = saved;
  const localStorage = {
    getItem: (key: string) => storage[key] ?? null,
  } as Pick<Storage, 'getItem'>;

  new Function('document', 'localStorage', inlineScript ?? '')({ documentElement: root }, localStorage);

  return root;
}

function runApp(settings: Settings, systemPrefersDark = false): HTMLElement {
  const root = document.createElement('html');
  applySettings(settings, systemPrefersDark, root);
  return root;
}

function snapshot(root: HTMLElement) {
  return {
    theme: root.dataset.theme,
    contrast: root.dataset.contrast,
    accent: root.style.getPropertyValue('--accent'),
    focus: root.style.getPropertyValue('--focus'),
    accentContrast: root.style.getPropertyValue('--accent-contrast'),
  };
}

const CASES: [string, Settings][] = [
  ['no saved settings', { theme: 'system', accent: null, highContrast: false }],
  ['light', { theme: 'light', accent: null, highContrast: false }],
  ['dark with high contrast', { theme: 'dark', accent: null, highContrast: true }],
  ['system with high contrast', { theme: 'system', accent: null, highContrast: true }],
  ['light with an accent', { theme: 'light', accent: '#1d4ed8', highContrast: false }],
  ['dark with an accent', { theme: 'dark', accent: '#74a9ff', highContrast: true }],
];

describe('the inline script in index.html', () => {
  it('is present and has no attributes, so it runs before the app', () => {
    expect(inlineScript).toBeTruthy();
    expect(indexHtml.indexOf('<script>')).toBeLessThan(indexHtml.indexOf('/src/main.tsx'));
  });

  it.each(CASES)('matches the app for %s', (_name, settings) => {
    const stored = JSON.stringify(settings);
    expect(snapshot(runInlineScript(stored))).toEqual(snapshot(runApp(normalizeSettings(JSON.parse(stored)))));
  });

  it('does not touch the palette when there is nothing stored', () => {
    expect(snapshot(runInlineScript(null))).toEqual({
      theme: undefined,
      contrast: undefined,
      accent: '',
      focus: '',
      accentContrast: '',
    });
  });

  it('survives unreadable storage', () => {
    expect(() => runInlineScript('{oops')).not.toThrow();
    expect(snapshot(runInlineScript('{oops')).theme).toBeUndefined();
  });
});
