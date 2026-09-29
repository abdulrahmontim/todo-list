import { normalizeSettings, type Settings } from './settings';

/** UI preferences only. Task data never goes in localStorage. */
export const STORAGE_KEY = 'todo.settings.v1';

export function readSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? normalizeSettings(null) : normalizeSettings(JSON.parse(raw));
  } catch {
    return normalizeSettings(null);
  }
}

export function writeSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The app still
    // works, the choice just does not survive a reload.
  }
}
