import { normalizeHex } from '../../lib/contrast';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Everything the user can change about the look of the app. Keeping it in one
 * object means adding a setting is a one file change.
 */
export type Settings = {
  theme: ThemeMode;
  /** `#rrggbb`, or null to use the per-theme default from tokens.css. */
  accent: string | null;
  highContrast: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accent: null,
  highContrast: false,
};

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

/** Turns anything (localStorage, an event payload) into a valid Settings. */
export function normalizeSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_SETTINGS };

  const source = value as Partial<Record<keyof Settings, unknown>>;

  return {
    theme: isThemeMode(source.theme) ? source.theme : DEFAULT_SETTINGS.theme,
    accent: typeof source.accent === 'string' ? normalizeHex(source.accent) : DEFAULT_SETTINGS.accent,
    highContrast:
      typeof source.highContrast === 'boolean' ? source.highContrast : DEFAULT_SETTINGS.highContrast,
  };
}
