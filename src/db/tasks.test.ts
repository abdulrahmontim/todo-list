import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Task } from '../types/task';
import { closeDb, DB_NAME } from './schema';
import { deleteTask, getTask, listTasks, patchTask, putTask } from './tasks';

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

async function resetDb(): Promise<void> {
  await closeDb();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

beforeEach(resetDb);
afterEach(closeDb);

describe('task store', () => {
  it('round-trips a task', async () => {
    await putTask(task({ title: 'Write tests' }));
    expect(await getTask('a')).toMatchObject({ id: 'a', title: 'Write tests' });
  });

  it('lists stored tasks', async () => {
    await putTask(task({ id: 'a' }));
    await putTask(task({ id: 'b' }));
    expect((await listTasks()).map((t) => t.id).sort()).toEqual(['a', 'b']);
  });

  it('updates fields and bumps updatedAt, keeping id and createdAt', async () => {
    await putTask(task());
    const patched = await patchTask('a', { title: 'Renamed', done: true }, 99);
    expect(patched).toMatchObject({
      id: 'a',
      createdAt: 1,
      title: 'Renamed',
      done: true,
      updatedAt: 99,
    });
    expect(await getTask('a')).toMatchObject({ title: 'Renamed' });
  });

  it('does not let a patch change id or createdAt', async () => {
    await putTask(task());
    const patched = await patchTask('a', { id: 'hacked', createdAt: 500 } as never, 99);
    expect(patched.id).toBe('a');
    expect(patched.createdAt).toBe(1);
  });

  it('throws when patching a missing task', async () => {
    await expect(patchTask('missing', { done: true })).rejects.toThrow(/missing task/i);
  });

  it('deletes a task', async () => {
    await putTask(task());
    await deleteTask('a');
    expect(await getTask('a')).toBeUndefined();
  });

  it('persists across a reconnect', async () => {
    await putTask(task({ title: 'Persisted' }));
    await closeDb();
    expect((await listTasks())[0]?.title).toBe('Persisted');
  });
});
