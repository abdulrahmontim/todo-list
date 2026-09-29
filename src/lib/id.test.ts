import { describe, expect, it } from 'vitest';
import { isValidId, newId } from './id';

describe('newId', () => {
  it('returns a v4 uuid', () => {
    expect(isValidId(newId())).toBe(true);
  });

  it('does not repeat', () => {
    expect(newId()).not.toBe(newId());
  });
});
