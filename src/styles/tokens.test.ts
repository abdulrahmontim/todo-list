import { describe, expect, it } from 'vitest';
import { THEME_SURFACE } from '../features/settings/accent';
import { AA_NON_TEXT, AA_TEXT, hexContrastRatio } from '../lib/contrast';
import tokensCss from './tokens.css?raw';

/**
 * Reads the real tokens.css instead of a copy, so editing a color in the
 * palette is enough for `npm test` to catch a contrast regression in any
 * theme, including high contrast.
 */

type Vars = Record<string, string>;
type Rule = { selector: string; inDarkMedia: boolean; vars: Vars };

const css = tokensCss.replace(/\/\*[\s\S]*?\*\//g, '');

function parseVars(body: string): Vars {
  const vars: Vars = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[name!] = value!.trim();
  }
  return vars;
}

/** Walks the braces so rules inside @media keep their context. */
function collect(source: string, inDarkMedia = false): Rule[] {
  const rules: Rule[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const open = source.indexOf('{', cursor);
    if (open === -1) break;

    const prelude = source.slice(cursor, open).trim();
    let depth = 1;
    let end = open + 1;
    while (end < source.length && depth > 0) {
      if (source[end] === '{') depth += 1;
      else if (source[end] === '}') depth -= 1;
      end += 1;
    }

    const body = source.slice(open + 1, end - 1);
    if (prelude.startsWith('@')) {
      rules.push(...collect(body, inDarkMedia || prelude.includes('prefers-color-scheme')));
    } else {
      rules.push({ selector: prelude, inDarkMedia, vars: parseVars(body) });
    }
    cursor = end;
  }

  return rules;
}

const rules = collect(css);

/** Supports the selector shapes this file uses: :root, [attr], [attr='v'], :not([attr='v']). */
function matches(selector: string, attrs: Record<string, string>): boolean {
  if (!/^:root\b/.test(selector)) return false;
  const checks = [...selector.matchAll(/(:not\()?\[([\w-]+)(?:=['"]([^'"]*)['"])?\]/g)];
  return checks.every(([, not, name, value]) => {
    const actual = attrs[name!];
    const hit = value === undefined ? name! in attrs : actual === value;
    return not === ':not(' ? !hit : hit;
  });
}

type Scenario = {
  name: string;
  dark: boolean;
  highContrast: boolean;
};

const SCENARIOS: Scenario[] = [
  { name: 'light', dark: false, highContrast: false },
  { name: 'dark', dark: true, highContrast: false },
  { name: 'light, high contrast', dark: false, highContrast: true },
  { name: 'dark, high contrast', dark: true, highContrast: true },
];

function paletteFor(scenario: Scenario): Vars {
  const attrs: Record<string, string> = {};
  if (scenario.dark) attrs['data-theme'] = 'dark';
  if (scenario.highContrast) attrs['data-contrast'] = 'high';

  const palette: Vars = {};
  for (const rule of rules) {
    if (rule.inDarkMedia && !scenario.dark) continue;
    if (matches(rule.selector, attrs)) Object.assign(palette, rule.vars);
  }
  return palette;
}

/** [foreground, background, minimum] */
const TEXT_PAIRS: [string, string, number][] = [
  ['--text', '--bg', AA_TEXT],
  ['--text', '--surface', AA_TEXT],
  ['--muted', '--bg', AA_TEXT],
  ['--muted', '--surface', AA_TEXT],
  ['--accent-contrast', '--accent', AA_TEXT],
  ['--accent', '--surface', AA_TEXT],
  ['--danger', '--surface', AA_TEXT],
  ['--danger-contrast', '--danger', AA_TEXT],
];

const NON_TEXT_PAIRS: [string, string, number][] = [
  ['--border-strong', '--surface', AA_NON_TEXT],
  ['--border-strong', '--bg', AA_NON_TEXT],
  ['--focus', '--bg', AA_NON_TEXT],
  ['--focus', '--surface', AA_NON_TEXT],
];

/** Decorative dividers: below 3:1, but they must stay visible. */
const DECORATIVE_PAIRS: [string, string, number][] = [['--border', '--surface', 1.3]];

describe('tokens.css', () => {
  it('defines every color token the app uses, in every theme', () => {
    const required = [
      '--bg',
      '--surface',
      '--text',
      '--muted',
      '--border',
      '--border-strong',
      '--accent',
      '--accent-hover',
      '--accent-contrast',
      '--danger',
      '--danger-hover',
      '--danger-contrast',
      '--focus',
    ];
    for (const scenario of SCENARIOS) {
      const palette = paletteFor(scenario);
      for (const token of required) {
        expect(palette[token], `${token} in ${scenario.name}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('keeps the mirrored surface colors in sync with accent.ts', () => {
    expect(THEME_SURFACE.light).toBe(paletteFor(SCENARIOS[0]!)['--surface']);
    expect(THEME_SURFACE.dark).toBe(paletteFor(SCENARIOS[1]!)['--surface']);
  });

    for (const scenario of SCENARIOS) {
      describe(scenario.name, () => {
        const palette = paletteFor(scenario);

        it.each(TEXT_PAIRS)('%s on %s meets AA text contrast', (fg, bg, minimum) => {
          const ratio = hexContrastRatio(palette[fg]!, palette[bg]!);
          expect(ratio, `${fg} ${palette[fg]} on ${bg} ${palette[bg]}`).not.toBeNull();
          expect(ratio!, `${fg} on ${bg}`).toBeGreaterThanOrEqual(minimum);
        });

        it.each(NON_TEXT_PAIRS)('%s on %s meets AA non-text contrast', (fg, bg, minimum) => {
          const ratio = hexContrastRatio(palette[fg]!, palette[bg]!);
          expect(ratio!, `${fg} on ${bg}`).toBeGreaterThanOrEqual(minimum);
        });

        it.each(DECORATIVE_PAIRS)('%s on %s stays visible', (fg, bg, minimum) => {
          const ratio = hexContrastRatio(palette[fg]!, palette[bg]!);
          expect(ratio!, `${fg} on ${bg}`).toBeGreaterThanOrEqual(minimum);
        });
      });
    }
});
