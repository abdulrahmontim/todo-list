import { ACCENT_PRESETS, THEME_DEFAULT_ACCENT } from '../accent';
import { THEME_LABELS, THEME_MODES, type ThemeMode } from '../settings';
import type { UseSettings } from '../useSettings';
import styles from './SettingsPanel.module.css';

type SettingsPanelProps = {
  settings: UseSettings;
  id: string;
};

export function SettingsPanel({ settings, id }: SettingsPanelProps) {
  const { settings: current, theme, accentAdjusted, update, reset } = settings;
  const defaultAccent = THEME_DEFAULT_ACCENT[theme];
  /** Presets are tuned per theme, so only a custom color is worth a warning. */
  const isCustom = current.accent !== null && !ACCENT_PRESETS.some((p) => p.value === current.accent);

  return (
    <section className={styles.panel} id={id} aria-label="Appearance settings">
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Theme</legend>
        <div className={styles.options}>
          {THEME_MODES.map((mode: ThemeMode) => (
            <label key={mode} className={styles.option}>
              <input
                type="radio"
                name="theme"
                className={styles.radio}
                value={mode}
                checked={current.theme === mode}
                onChange={() => update({ theme: mode })}
              />
              {THEME_LABELS[mode]}
            </label>
          ))}
        </div>
        {current.theme === 'system' && (
          <p className={styles.hint}>Follows your operating system setting.</p>
        )}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Accent color</legend>
        <div className={styles.swatches}>
          <label className={styles.swatchLabel} title="Theme default">
            <input
              type="radio"
              name="accent"
              className={styles.srOnly}
              checked={current.accent === null}
              onChange={reset}
            />
            <span
              className={styles.swatch}
              style={{ background: `linear-gradient(135deg, ${THEME_DEFAULT_ACCENT.light} 50%, ${THEME_DEFAULT_ACCENT.dark} 50%)` }}
              aria-hidden="true"
              data-selected={current.accent === null || undefined}
            />
            <span className={styles.swatchName}>Default</span>
          </label>

          {ACCENT_PRESETS.map((preset) => (
            <label key={preset.value} className={styles.swatchLabel} title={preset.value}>
              <input
                type="radio"
                name="accent"
                className={styles.srOnly}
                checked={current.accent === preset.value}
                onChange={() => update({ accent: preset.value })}
              />
              <span
                className={styles.swatch}
                style={{ background: preset.value }}
                aria-hidden="true"
                data-selected={current.accent === preset.value || undefined}
              />
              <span className={styles.swatchName}>{preset.label}</span>
            </label>
          ))}
        </div>

        <div className={styles.custom}>
          <label className={styles.label} htmlFor="custom-accent">
            Custom color
          </label>
          <input
            id="custom-accent"
            type="color"
            className={styles.colorInput}
            value={current.accent ?? defaultAccent}
            onChange={(event) => update({ accent: event.target.value })}
          />
        </div>

        {accentAdjusted && isCustom && (
          <p className={styles.warning} role="status">
            This color is adjusted for contrast, so text stays readable.
          </p>
        )}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Accessibility</legend>
        <label className={styles.option}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={current.highContrast}
            onChange={(event) => update({ highContrast: event.target.checked })}
          />
          High contrast
        </label>
      </fieldset>
    </section>
  );
}
