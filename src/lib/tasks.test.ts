import { describe, expect, it } from 'vitest';
import type { Task } from '../types/task';
import {
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
  countTasks,
  createTask,
  normalizeNote,
  normalizeTitle,
  renameTask,
  setDone,
  setNote,
  sortTasks,
  toggleDone,
} from './tasks';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'a',
    title: 'Task',
    done: false,
    createdAt: 1,
    priority: 'medium',
    tags: [],
    updatedAt: 1,
    ...overrides,
  };
}

describe('normalizeTitle', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeTitle('  buy   milk \n')).toBe('buy milk');
  });

  it('caps length', () => {
    expect(normalizeTitle('x'.repeat(500))).toHaveLength(MAX_TITLE_LENGTH);
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeTitle('   ')).toBe('');
  });
});

describe('createTask', () => {
  it('builds an undone task with matching timestamps', () => {
    const created = createTask({ title: '  Walk the dog ', id: 'id-1', now: 100 });
    expect(created).toEqual({
      id: 'id-1',
      title: 'Walk the dog',
      done: false,
      createdAt: 100,
      priority: 'medium',
      tags: [],
      updatedAt: 100,
    });
  });

  it('throws on an empty title', () => {
    expect(() => createTask({ title: '   ', id: 'id-1', now: 1 })).toThrow(/empty/i);
  });

  it('keeps a note given at capture time', () => {
    const created = createTask({ title: 'Buy milk', note: '  oat, not cow  ', id: 'id-1', now: 1 });
    expect(created.note).toBe('oat, not cow');
    expect(created.updatedAt).toBe(1);
  });

  it('leaves the note key out when it is blank or missing', () => {
    expect('note' in createTask({ title: 'Buy milk', note: '   ', id: 'id-1', now: 1 })).toBe(false);
    expect('note' in createTask({ title: 'Buy milk', id: 'id-1', now: 1 })).toBe(false);
  });

  it('caps the note like setNote does', () => {
    const created = createTask({ title: 'Buy milk', note: 'x'.repeat(5000), id: 'id-1', now: 1 });
    expect(created.note).toHaveLength(MAX_NOTE_LENGTH);
  });
});

describe('renameTask', () => {
  it('updates the title and bumps updatedAt', () => {
    const renamed = renameTask(task(), '  New  title ', 50);
    expect(renamed.title).toBe('New title');
    expect(renamed.updatedAt).toBe(50);
  });

  it('returns the same object when the title is unchanged', () => {
    const original = task({ title: 'Same' });
    expect(renameTask(original, 'Same', 50)).toBe(original);
  });

  it('throws on an empty title', () => {
    expect(() => renameTask(task(), '  ', 50)).toThrow(/empty/i);
  });
});

describe('done state', () => {
  it('stamps completedAt when completing', () => {
    const done = setDone(task(), true, 42);
    expect(done.done).toBe(true);
    expect(done.completedAt).toBe(42);
    expect(done.updatedAt).toBe(42);
  });

  it('clears completedAt when un-completing', () => {
    const done = setDone(task({ done: true, completedAt: 42 }), false, 60);
    expect(done.done).toBe(false);
    expect(done.completedAt).toBeUndefined();
    expect(done.updatedAt).toBe(60);
  });

  it('toggles', () => {
    expect(toggleDone(task(), 10).done).toBe(true);
    expect(toggleDone(task({ done: true }), 10).done).toBe(false);
  });

  it('is a no-op when the state already matches', () => {
    const original = task({ done: true, completedAt: 5 });
    expect(setDone(original, true, 99)).toBe(original);
  });
});

describe('normalizeNote', () => {
  it('trims the note', () => {
    expect(normalizeNote('  call the dentist \n')).toBe('call the dentist');
  });

  it('keeps inner newlines', () => {
    expect(normalizeNote('first line\nsecond line')).toBe('first line\nsecond line');
  });

  it('caps length', () => {
    expect(normalizeNote('x'.repeat(5000))).toHaveLength(MAX_NOTE_LENGTH);
  });

  it('returns undefined for a blank note', () => {
    expect(normalizeNote('   ')).toBeUndefined();
  });
});

describe('setNote', () => {
  it('attaches a note and bumps updatedAt', () => {
    const updated = setNote(task(), '  ring the bell  ', 77);
    expect(updated.note).toBe('ring the bell');
    expect(updated.updatedAt).toBe(77);
  });

  it('replaces an existing note', () => {
    expect(setNote(task({ note: 'old' }), 'new', 5).note).toBe('new');
  });

  it('removes the key entirely when the note is cleared', () => {
    const cleared = setNote(task({ note: 'old' }), '   ', 5);
    expect('note' in cleared).toBe(false);
    expect(cleared.updatedAt).toBe(5);
  });

  it('returns the same object when the note is unchanged', () => {
    const original = task({ note: 'same' });
    expect(setNote(original, ' same ', 9)).toBe(original);
  });

  it('is a no-op when clearing a note that does not exist', () => {
    const original = task();
    expect(setNote(original, '', 9)).toBe(original);
  });

  it('leaves the rest of the task intact', () => {
    const original = task({ id: 'keep', title: 'Keep', tags: ['home'], createdAt: 3 });
    const updated = setNote(original, 'note', 9);
    expect(updated).toMatchObject({ id: 'keep', title: 'Keep', tags: ['home'], createdAt: 3, done: false });
  });
});

describe('countTasks', () => {  it('counts done and remaining', () => {
    expect(countTasks([task(), task({ done: true })])).toEqual({ total: 2, done: 1, remaining: 1 });
  });

  it('handles an empty list', () => {
    expect(countTasks([])).toEqual({ total: 0, done: 0, remaining: 0 });
  });
});

describe('sortTasks', () => {
  it('puts undone tasks first, oldest first, without mutating the input', () => {
    const input = [
      task({ id: 'done', done: true, createdAt: 1 }),
      task({ id: 'new', createdAt: 3 }),
      task({ id: 'old', createdAt: 2 }),
    ];
    const sorted = sortTasks(input);
    expect(sorted.map((t) => t.id)).toEqual(['old', 'new', 'done']);
    expect(input.map((t) => t.id)).toEqual(['done', 'new', 'old']);
  });

  it('breaks ties on id so ordering is deterministic', () => {
    const sorted = sortTasks([task({ id: 'b', createdAt: 1 }), task({ id: 'a', createdAt: 1 })]);
    expect(sorted.map((t) => t.id)).toEqual(['a', 'b']);
  });
});
