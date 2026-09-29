import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { closeDb } from '../db/schema';

afterEach(async () => {
  cleanup();
  await closeDb();
});
