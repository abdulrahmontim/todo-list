import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteTask as removeTask, listTasks, mutateTask, putTask } from '../db/tasks';
import { newId } from '../lib/id';
import { createTask, renameTask, setDone, setNote } from '../lib/tasks';
import type { Task, TaskDraft } from '../types/task';

export type TasksStatus = 'loading' | 'ready' | 'error';

function describeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Something went wrong while talking to the database.';
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<TasksStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    const stored = await listTasks();
    if (!isMounted.current) return;
    setTasks(stored);
    setStatus('ready');
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void refresh().catch((cause: unknown) => {
      if (!isMounted.current) return;
      setError(describeError(cause));
      setStatus('error');
    });
    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  const run = useCallback(async (operation: () => Promise<unknown>): Promise<boolean> => {
    try {
      await operation();
      await refresh();
      if (isMounted.current) setError(null);
      return true;
    } catch (cause) {
      if (isMounted.current) {
        setError(describeError(cause));
        setStatus('error');
      }
      return false;
    }
  }, [refresh]);

  const addTask = useCallback(
    async (draft: TaskDraft) =>
      run(async () => {
        await putTask(createTask({ ...draft, id: newId(), now: Date.now() }));
      }),
    [run],
  );

  const editTask = useCallback(
    (id: string, title: string) =>
      run(() => {
        const now = Date.now();
        return mutateTask(id, (task) => renameTask(task, title, now), now);
      }),
    [run],
  );

  const toggleTask = useCallback(
    (id: string, done: boolean) =>
      run(() => {
        const now = Date.now();
        return mutateTask(id, (task) => setDone(task, done, now), now);
      }),
    [run],
  );

  const setTaskNote = useCallback(
    (id: string, note: string) =>
      run(() => {
        const now = Date.now();
        return mutateTask(id, (task) => setNote(task, note, now), now);
      }),
    [run],
  );

  const deleteTask = useCallback(
    (id: string) =>
      run(async () => {
        await removeTask(id);
      }),
    [run],
  );

  const retry = useCallback(() => {
    setStatus('loading');
    setError(null);
    return refresh().catch((cause: unknown) => {
      if (!isMounted.current) return;
      setError(describeError(cause));
      setStatus('error');
    });
  }, [refresh]);

  return { tasks, status, error, addTask, editTask, toggleTask, setTaskNote, deleteTask, retry };
}
