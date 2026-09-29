import {
  BLACK,
  WHITE,
  contrastRatio,
  hoverShade,
  mix,
  parseHexColor,
  readableTextOn,
  toHex,
  type Rgb,
} from '../../lib/contrast';
import type { ResolvedTheme } from './settings';

/** Preset swatches for the accent picker. Each one is adjusted per theme when needed. */
export const ACCENT_PRESETS: readonly { value: string; label: string }[] = [
  { value: '#1d4ed8', label: 'Blue' },
  { value: '#0f766e', label: 'Teal' },
  { value: '#7c3aed', label: 'Violet' },
  { value: '#b91c1c', label: 'Red' },
  { value: '#a16207', label: 'Amber' },
  { value: '#15803d', label: 'Green' },
  { value: '#334155', label: 'Slate' },
];

/**
 * Mirrors the `--surface` values in tokens.css. The accent is also used as text
 * on the surface (hover states, focus ring), so it has to be checked against
 * it. `styles/tokens.test.ts` fails if the two ever drift apart.
 */
export const THEME_SURFACE: Record<ResolvedTheme, string> = {
  light: '#ffffff',
  dark: '#161b22',
};

/** The built-in accent per theme, used when the user has not picked one. */
export const THEME_DEFAULT_ACCENT: Record<ResolvedTheme, string> = {
  light: '#1d4ed8',
  dark: '#74a9ff',
};

/** How far toward the safe end of the theme to push a color, best first. */
const STEPS = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36, 0.28, 0.2, 0.12, 0.04, 0];

export type ResolvedAccent = {
  accent: string;
  hover: string;
  contrastText: string;
  /** True when the picked color had to be shifted to stay readable. */
  adjusted: boolean;
};

function isReadableAs(accent: Rgb, theme: ResolvedTheme): boolean {
  const surface = parseHexColor(THEME_SURFACE[theme]);
  if (!surface) return false;
  const onAccent = contrastRatio(accent, readableTextOn(accent));
  return onAccent >= 4.5 && contrastRatio(accent, surface) >= 4.5;
}

/**
 * Nudges a custom accent toward the safe end of the theme until it can be used
 * as a button background *and* as text on the surface. Returns null when the
 * value is not a color at all, so the caller can keep the default.
 */
export function resolveAccent(accent: string, theme: ResolvedTheme): ResolvedAccent | null {
  const rgb = parseHexColor(accent);
  if (!rgb) return null;

  const toward = theme === 'light' ? BLACK : WHITE;
  const chosen = isReadableAs(rgb, theme)
    ? rgb
    : mix(
        rgb,
        toward,
        STEPS.find((value) => isReadableAs(mix(rgb, toward, value), theme)) ?? 0,
      );

  return {
    accent: toHex(chosen),
    hover: toHex(hoverShade(chosen)),
    contrastText: toHex(readableTextOn(chosen)),
    adjusted: chosen !== rgb,
  };
}
