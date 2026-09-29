import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { MAX_NOTE_LENGTH, normalizeNote } from '../../lib/tasks';
import type { Task } from '../../types/task';
import styles from './TaskNote.module.css';

type TaskNoteProps = {
  task: Task;
  onSave: (id: string, note: string) => void;
};

export function TaskNote({ task, onSave }: TaskNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.note ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelId = useId();

  const note = normalizeNote(task.note ?? '');
  const isUnchanged = normalizeNote(draft) === note;

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(task.note ?? '');
    setIsEditing(true);
  }

  function cancel() {
    setIsEditing(false);
    setDraft(task.note ?? '');
  }

  function save() {
    onSave(task.id, draft);
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      save();
    }
  }

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isEditing}
        aria-controls={panelId}
        onClick={() => (isEditing ? cancel() : startEditing())}
      >
        {note ? 'Edit note' : 'Add note'}
      </button>

      <div id={panelId} className={styles.panel}>
        {isEditing ? (
          <>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={draft}
              rows={3}
              maxLength={MAX_NOTE_LENGTH}
              aria-label={`Note for ${task.title}`}
              placeholder="Add a note…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className={styles.actions}>
              <button type="button" className={styles.save} onClick={save} disabled={isUnchanged}>
                Save
              </button>
              <button type="button" className={styles.cancel} onClick={cancel}>
                Cancel
              </button>
            </div>
            <p className={styles.hint}>Ctrl/⌘ + Enter saves, Escape cancels.</p>
          </>
        ) : (
          note && <p className={styles.text}>{note}</p>
        )}
      </div>
    </div>
  );
}
