import type { NewTask, Task } from '../types/task';
import { newId } from './id';

export const MAX_TITLE_LENGTH = 200;
export const MAX_NOTE_LENGTH = 2000;

export function normalizeTitle(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE_LENGTH);
}

/** Returns undefined for an empty note so the key can be dropped entirely. */
export function normalizeNote(raw: string): string | undefined {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.slice(0, MAX_NOTE_LENGTH) : undefined;
}

export function createTask({ title, note, now, id = newId() }: NewTask): Task {
  const clean = normalizeTitle(title);
  if (!clean) {
    throw new Error('Task title cannot be empty');
  }

  const task: Task = {
    id,
    title: clean,
    done: false,
    createdAt: now,
    priority: 'medium',
    tags: [],
    updatedAt: now,
  };

  // Same rule as setNote: a blank note leaves the key out entirely.
  const cleanNote = normalizeNote(note ?? '');
  if (cleanNote !== undefined) {
    task.note = cleanNote;
  }

  return task;
}

export function renameTask(task: Task, title: string, now: number): Task {
  const clean = normalizeTitle(title);
  if (!clean) {
    throw new Error('Task title cannot be empty');
  }
  if (clean === task.title) {
    return task;
  }
  return { ...task, title: clean, updatedAt: now };
}

export function setDone(task: Task, done: boolean, now: number): Task {
  if (task.done === done) {
    return task;
  }
  return { ...task, done, completedAt: done ? now : undefined, updatedAt: now };
}

export function toggleDone(task: Task, now: number): Task {
  return setDone(task, !task.done, now);
}

export function setNote(task: Task, note: string, now: number): Task {
  const normalized = normalizeNote(note);
  if (normalized === task.note) {
    return task;
  }
  const next: Task = { ...task, updatedAt: now };
  if (normalized === undefined) {
    delete next.note;
  } else {
    next.note = normalized;
  }
  return next;
}

export function countTasks(tasks: Task[]): { total: number; done: number; remaining: number } {
  let done = 0;
  for (const task of tasks) {
    if (task.done) {
      done += 1;
    }
  }
  return { total: tasks.length, done, remaining: tasks.length - done };
}

export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    if (a.createdAt !== b.createdAt) {
      return a.createdAt - b.createdAt;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
