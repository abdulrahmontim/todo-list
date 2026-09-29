import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings';
import { useSettings } from '../useSettings';
import { applySettings } from '../theme';
import { STORAGE_KEY } from '../storage';
import { SettingsPanel } from './SettingsPanel';

function Harness() {
  return <SettingsPanel settings={useSettings()} id="settings-panel" />;
}

const root = document.documentElement;

function stored() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  applySettings(DEFAULT_SETTINGS, false);
  root.removeAttribute('style');
});

describe('SettingsPanel', () => {
  it('offers light, dark and system, with system preselected', () => {
    render(<Harness />);

    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(screen.getByText('Follows your operating system setting.')).toBeInTheDocument();
  });

  it('applies and stores the chosen theme straight away', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(root.dataset.theme).toBe('dark');
    expect(stored()).toEqual({ theme: 'dark', accent: null, highContrast: false });
    expect(screen.queryByText('Follows your operating system setting.')).not.toBeInTheDocument();
  });

  it('goes back to following the system when System is picked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(screen.getByRole('radio', { name: 'System' }));

    expect(root.dataset.theme).toBeUndefined();
  });

  it('stores a preset accent and shows it as selected', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Violet' }));

    expect(stored().accent).toBe('#7c3aed');
    expect(root.style.getPropertyValue('--accent')).toBe('#7c3aed');
    expect(screen.getByRole('radio', { name: 'Violet' })).toBeChecked();
  });

  it('stays quiet about a preset, which is tuned for each theme', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(screen.getByRole('radio', { name: 'Violet' }));

    expect(root.style.getPropertyValue('--accent')).not.toBe('#7c3aed');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('returns to the theme default accent', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Violet' }));
    await user.click(screen.getByRole('radio', { name: 'Default' }));

    expect(stored().accent).toBeNull();
    expect(root.style.getPropertyValue('--accent')).toBe('');
  });

  it('takes a custom color and warns when it has to be adjusted', async () => {
    render(<Harness />);

    // A near white color would put white text on white, so it gets adjusted.
    fireEvent.change(screen.getByLabelText('Custom color'), { target: { value: '#ffff00' } });

    expect(stored().accent).toBe('#ffff00');
    expect(root.style.getPropertyValue('--accent')).not.toBe('#ffff00');
    expect(screen.getByRole('status')).toHaveTextContent('adjusted for contrast');
  });

  it('stores the high contrast preference', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('checkbox', { name: 'High contrast' }));

    expect(root.dataset.contrast).toBe('high');
    expect(stored().highContrast).toBe(true);
  });

  it('starts from what is already in storage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: 'dark', accent: '#b91c1c', highContrast: true }),
    );

    render(<Harness />);

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Red' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'High contrast' })).toBeChecked();
  });
});
