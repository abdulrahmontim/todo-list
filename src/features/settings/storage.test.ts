import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';
import { readSettings, STORAGE_KEY, writeSettings } from './storage';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('readSettings', () => {
  it('returns the defaults when nothing is stored', () => {
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('reads back what was written', () => {
    writeSettings({ theme: 'dark', accent: '#b91c1c', highContrast: true });
    expect(readSettings()).toEqual({ theme: 'dark', accent: '#b91c1c', highContrast: true });
  });

  it('ignores malformed or hostile values', () => {
    for (const raw of ['not json', '[]', '{"theme":"neon","accent":"red"}', 'null']) {
      window.localStorage.setItem(STORAGE_KEY, raw);
      expect(readSettings(), raw).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('keeps the fields it can salvage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"theme":"dark","accent":"#ABC","highContrast":7}');
    expect(readSettings()).toEqual({ theme: 'dark', accent: '#aabbcc', highContrast: false });
  });

  it('falls back to the defaults when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('writeSettings', () => {
  it('never throws when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeSettings(DEFAULT_SETTINGS)).not.toThrow();
  });

  it('stores the whole object under one key', () => {
    writeSettings({ ...DEFAULT_SETTINGS, theme: 'light' });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{"theme":"light","accent":null,"highContrast":false}');
  });
});
