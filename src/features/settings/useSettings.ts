import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveAccent, type ResolvedAccent } from './accent';
import { normalizeSettings, type ResolvedTheme, type Settings } from './settings';
import { readSettings, writeSettings } from './storage';
import { applySettings, prefersDarkScheme, resolveTheme } from './theme';

export type UseSettings = {
  settings: Settings;
  theme: ResolvedTheme;
  /** The accent actually in use, already adjusted for contrast. */
  accent: ResolvedAccent | null;
  accentAdjusted: boolean;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
};

export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings>(() => readSettings());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => prefersDarkScheme());

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applySettings(settings, systemPrefersDark);
  }, [settings, systemPrefersDark]);

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

  const theme = resolveTheme(settings.theme, systemPrefersDark);
  const accent = useMemo(
    () => (settings.accent ? resolveAccent(settings.accent, theme) : null),
    [settings.accent, theme],
  );

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => normalizeSettings({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings((current) => normalizeSettings({ ...current, accent: null }));
  }, []);

  return { settings, theme, accent, accentAdjusted: accent?.adjusted ?? false, update, reset };
}
