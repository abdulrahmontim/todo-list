import { useId, useMemo, useState } from 'react';
import { TaskForm } from './components/TaskForm/TaskForm';
import { TaskList } from './components/TaskList/TaskList';
import { SettingsPanel } from './features/settings/SettingsPanel/SettingsPanel';
import { useSettings } from './features/settings/useSettings';
import { useTasks } from './hooks/useTasks';
import { countTasks, sortTasks } from './lib/tasks';
import styles from './App.module.css';

export default function App() {
  const { tasks, status, error, addTask, editTask, toggleTask, setTaskNote, deleteTask, retry } = useTasks();
  const settings = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsId = useId();

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);
  const counts = useMemo(() => countTasks(tasks), [tasks]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Todo List</h1>
          <button
            type="button"
            className={styles.settingsToggle}
            aria-expanded={isSettingsOpen}
            aria-controls={settingsId}
            onClick={() => setIsSettingsOpen((open) => !open)}
          >
            Settings
          </button>
        </div>
        <p className={styles.count} aria-live="polite">
          {status === 'loading'
            ? 'Loading your tasks…'
            : `${counts.remaining} of ${counts.total} remaining · ${counts.done} done`}
        </p>
      </header>

      {isSettingsOpen && <SettingsPanel settings={settings} id={settingsId} />}

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" className={styles.retry} onClick={() => void retry()}>
            Try again
          </button>
        </div>
      )}

      <TaskForm onAdd={addTask} disabled={status === 'loading'} />

      <main className={styles.panel}>
        {status === 'loading' ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <TaskList
            tasks={sortedTasks}
            onToggle={toggleTask}
            onRename={editTask}
            onDelete={deleteTask}
            onNoteSave={setTaskNote}
          />
        )}
      </main>
    </div>
  );
}
