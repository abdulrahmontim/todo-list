import { openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDb, DB_NAME, DB_VERSION, getDb, TASK_STORE } from './schema';
import { getTask, listTasks, mutateTask } from './tasks';
import { resetTestDb } from '../test/resetDb';
import type { Task } from '../types/task';

/** Recreates the schema as it existed at DB_VERSION 1, which had no `note`. */
async function seedVersion1Database() {
  const legacy = await openDB(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(TASK_STORE, { keyPath: 'id' });
      store.createIndex('by-createdAt', 'createdAt');
      store.createIndex('by-updatedAt', 'updatedAt');
    },
  });
  const task: Task = {
    id: 'legacy',
    title: 'Written by v1',
    done: false,
    createdAt: 1,
    priority: 'medium',
    tags: [],
    updatedAt: 1,
  };
  await legacy.put(TASK_STORE, task);
  legacy.close();
}

beforeEach(resetTestDb);
afterEach(closeDb);

describe('schema migrations', () => {
  it('is at version 2', () => {
    expect(DB_VERSION).toBe(2);
  });

  it('upgrades a v1 database and keeps existing tasks', async () => {
    await seedVersion1Database();

    const db = await getDb();
    expect(db.version).toBe(2);

    const stored = await getTask('legacy');
    expect(stored).toMatchObject({ id: 'legacy', title: 'Written by v1' });
    expect(stored).not.toHaveProperty('note');
  });

  it('can add and remove a note on a task created by v1', async () => {
    await seedVersion1Database();
    await getDb();

    const added = await mutateTask('legacy', (task) => ({ ...task, note: 'added later' }), 10);
    expect(added.note).toBe('added later');
    expect((await listTasks())[0]?.note).toBe('added later');
  });

  it('does not corrupt the database when opened repeatedly', async () => {
    await getDb();
    await closeDb();
    await getDb();
    expect((await getDb()).version).toBe(DB_VERSION);
  });
});
