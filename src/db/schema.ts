import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Task } from '../types/task';

export const DB_NAME = 'todo-list';
export const DB_VERSION = 2;
export const TASK_STORE = 'tasks';

export interface TodoDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-createdAt': number;
      'by-updatedAt': number;
    };
  };
}

let connection: Promise<IDBPDatabase<TodoDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<TodoDB>> {
  connection ??= openDB<TodoDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(TASK_STORE)) {
          const store = db.createObjectStore(TASK_STORE, { keyPath: 'id' });
          store.createIndex('by-createdAt', 'createdAt');
          store.createIndex('by-updatedAt', 'updatedAt');
        }
      }

      if (oldVersion < 2) {
        // v2 adds the optional `note` field. No data rewrite is needed: records
        // written by v1 simply have no `note` key and read back as undefined.
      }
    },
    blocking() {
      // Another tab is upgrading the schema; let go of the connection.
      void closeDb();
    },
  });
  return connection;
}

export async function closeDb(): Promise<void> {
  const pending = connection;
  connection = null;
  if (pending) {
    const db = await pending;
    db.close();
  }
}
