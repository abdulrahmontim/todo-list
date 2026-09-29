import { resolveAccent } from './accent';
import type { ResolvedTheme, Settings, ThemeMode } from './settings';

export function prefersDarkScheme(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark ? 'dark' : 'light';
  return mode;
}

/**
 * `null` means "no attribute", which lets the `prefers-color-scheme` block in
 * tokens.css pick the palette. That is what keeps System mode reactive.
 */
export function themeAttribute(mode: ThemeMode): 'light' | 'dark' | null {
  return mode === 'system' ? null : mode;
}

export type AppliedSettings = {
  theme: ResolvedTheme;
  /** Custom accent, already adjusted for contrast. Null when using defaults. */
  accent: { accent: string; hover: string; contrastText: string } | null;
  accentAdjusted: boolean;
};

function accentVars(accent: NonNullable<AppliedSettings['accent']>): Record<string, string> {
  return {
    '--accent': accent.accent,
    '--accent-hover': accent.hover,
    '--accent-contrast': accent.contrastText,
    '--focus': accent.accent,
  };
}

/**
 * Writes the settings to the document element. Kept in sync with the inline
 * script in index.html by `applySettings.test.ts`.
 */
export function applySettings(
  settings: Settings,
  systemPrefersDark: boolean,
  root: HTMLElement = document.documentElement,
): AppliedSettings {
  const theme = resolveTheme(settings.theme, systemPrefersDark);
  const attribute = themeAttribute(settings.theme);

  if (attribute) root.dataset.theme = attribute;
  else delete root.dataset.theme;

  if (settings.highContrast) root.dataset.contrast = 'high';
  else delete root.dataset.contrast;

  const resolved = settings.accent ? resolveAccent(settings.accent, theme) : null;
  if (resolved) {
    for (const [name, value] of Object.entries(accentVars(resolved))) {
      root.style.setProperty(name, value);
    }
  } else {
    for (const name of ['--accent', '--accent-hover', '--accent-contrast', '--focus']) {
      root.style.removeProperty(name);
    }
  }

  return {
    theme,
    accent: resolved ? { accent: resolved.accent, hover: resolved.hover, contrastText: resolved.contrastText } : null,
    accentAdjusted: resolved?.adjusted ?? false,
  };
}
