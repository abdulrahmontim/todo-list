import type { Task } from '../types/task';
import { getDb, TASK_STORE } from './schema';

export type TaskPatch = Partial<Omit<Task, 'id' | 'createdAt'>>;

export async function listTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.getAll(TASK_STORE);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDb();
  return db.get(TASK_STORE, id);
}

export async function putTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.put(TASK_STORE, task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(TASK_STORE, id);
}

/**
 * Read-modify-write inside a single transaction so `id` and `createdAt` can
 * never be changed by a caller and concurrent writes cannot interleave.
 * `updatedAt` is always stamped here, keeping last-write-wins semantics.
 */
export async function mutateTask(
  id: string,
  mutate: (task: Task) => Task,
  now: number = Date.now(),
): Promise<Task> {
  const db = await getDb();
  const tx = db.transaction(TASK_STORE, 'readwrite');
  const existing = await tx.store.get(id);
  if (!existing) {
    // Nothing was written, so let the transaction commit empty rather than
    // aborting: an abort surfaces as an unhandled rejection on tx.done.
    throw new Error(`Cannot update missing task ${id}`);
  }
  const mutated = mutate(existing);
  const next: Task = {
    ...mutated,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  await tx.store.put(next);
  await tx.done;
  return next;
}

export function patchTask(id: string, patch: TaskPatch, now?: number): Promise<Task> {
  return mutateTask(id, (task) => ({ ...task, ...patch }), now);
}
