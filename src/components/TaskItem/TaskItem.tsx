import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { normalizeTitle } from '../../lib/tasks';
import type { Task } from '../../types/task';
import { TaskNote } from '../TaskNote/TaskNote';
import styles from './TaskItem.module.css';

type TaskItemProps = {
  task: Task;
  onToggle: (id: string, done: boolean) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onNoteSave: (id: string, note: string) => void;
};

export function TaskItem({ task, onToggle, onRename, onDelete, onNoteSave }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(task.title);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(task.title);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizeTitle(draft)) return;
    onRename(task.id, draft);
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  if (isEditing) {
    return (
      <li className={styles.item}>
        <form className={styles.editForm} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className={styles.editInput}
            type="text"
            value={draft}
            aria-label={`Edit ${task.title}`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className={styles.save} disabled={!normalizeTitle(draft)}>
            Save
          </button>
          <button type="button" className={styles.cancel} onClick={cancelEditing}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className={styles.item} data-done={task.done || undefined}>
      <label className={styles.main}>
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={task.done}
          onChange={(event) => onToggle(task.id, event.target.checked)}
        />
        <span className={styles.title}>{task.title}</span>
      </label>
      <div className={styles.actions}>
        <button type="button" className={styles.edit} aria-label={`Edit ${task.title}`} onClick={startEditing}>
          Edit
        </button>
        <button
          type="button"
          className={styles.remove}
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
      <TaskNote task={task} onSave={onNoteSave} />
    </li>
  );
}
