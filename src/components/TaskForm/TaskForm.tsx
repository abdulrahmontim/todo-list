import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { MAX_NOTE_LENGTH, normalizeNote, normalizeTitle } from '../../lib/tasks';
import type { TaskDraft } from '../../types/task';
import styles from './TaskForm.module.css';

type TaskFormProps = {
  onAdd: (draft: TaskDraft) => boolean | Promise<boolean>;
  disabled?: boolean;
};

export function TaskForm({ onAdd, disabled = false }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const noteId = useId();

  const canSubmit = normalizeTitle(title).length > 0 && !disabled && !isSaving;

  useEffect(() => {
    if (isNoteOpen) {
      noteRef.current?.focus();
    }
  }, [isNoteOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    const saved = await onAdd({ title, note });
    setIsSaving(false);
    if (saved) {
      // A note means the user is in the slow lane, so leave the field open for
      // the next one. Without a note, collapse back to the fast path.
      setIsNoteOpen(normalizeNote(note) !== undefined);
      setTitle('');
      setNote('');
      inputRef.current?.focus();
    }
  }

  function handleNoteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsNoteOpen(false);
      return;
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor="new-task">
          New task
        </label>
        <button
          type="button"
          className={styles.noteToggle}
          aria-expanded={isNoteOpen}
          aria-controls={noteId}
          onClick={() => setIsNoteOpen((open) => !open)}
        >
          {isNoteOpen ? 'Hide note' : '+ Note'}
        </button>
      </div>

      <div className={styles.row}>
        <input
          id="new-task"
          ref={inputRef}
          className={styles.input}
          type="text"
          value={title}
          placeholder="What needs doing?"
          autoComplete="off"
          disabled={disabled}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="submit" className={styles.button} disabled={!canSubmit}>
          Add
        </button>
      </div>

      <div id={noteId} className={styles.notePanel}>
        {isNoteOpen && (
          <textarea
            ref={noteRef}
            className={styles.textarea}
            value={note}
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="Anything worth remembering about it…"
            aria-label="Note"
            onChange={(event) => setNote(event.target.value)}
            onKeyDown={handleNoteKeyDown}
          />
        )}
      </div>
    </form>
  );
}
