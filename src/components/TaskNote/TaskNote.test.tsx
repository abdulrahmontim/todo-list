import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/task';
import { TaskNote } from './TaskNote';

const task: Task = {
  id: 'task-1',
  title: 'Buy milk',
  done: false,
  createdAt: 1,
  priority: 'medium',
  tags: [],
  updatedAt: 1,
};

function renderNote(overrides: Partial<Task> = {}) {
  const onSave = vi.fn();
  render(
    <ul>
      <li>
        <TaskNote task={{ ...task, ...overrides }} onSave={onSave} />
      </li>
    </ul>,
  );
  return { onSave };
}

describe('TaskNote', () => {
  it('offers to add a note when there is none', () => {
    renderNote();
    expect(screen.getByRole('button', { name: 'Add note' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows an existing note and offers to edit it', () => {
    renderNote({ note: 'Ask for oat milk' });
    expect(screen.getByText('Ask for oat milk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit note' })).toBeInTheDocument();
  });

  it('focuses the textarea when opened', async () => {
    const user = userEvent.setup();
    renderNote();

    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(screen.getByRole('textbox', { name: 'Note for Buy milk' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Add note' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('saves the note and closes the editor', async () => {
    const user = userEvent.setup();
    const { onSave } = renderNote();

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox'), 'Check the fridge first');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('task-1', 'Check the fridge first');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('saves with Ctrl+Enter', async () => {
    const user = userEvent.setup();
    const { onSave } = renderNote();

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox'), 'Quick save{Control>}{Enter}{/Control}');

    expect(onSave).toHaveBeenCalledWith('task-1', 'Quick save');
  });

  it('keeps newlines typed in the textarea', async () => {
    const user = userEvent.setup();
    const { onSave } = renderNote();

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox'), 'line one{Enter}line two');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('task-1', 'line one\nline two');
  });

  it('cancels with Escape without saving', async () => {
    const user = userEvent.setup();
    const { onSave } = renderNote();

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox'), 'Discarded{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('cancels with the Cancel button', async () => {
    const user = userEvent.setup();
    const { onSave } = renderNote({ note: 'Original' });

    await user.click(screen.getByRole('button', { name: 'Edit note' }));
    await user.clear(screen.getByRole('textbox'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('disables Save until the note changes', async () => {
    const user = userEvent.setup();
    renderNote({ note: 'Original' });

    await user.click(screen.getByRole('button', { name: 'Edit note' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.type(screen.getByRole('textbox'), ' more');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('allows saving a cleared note', async () => {
    const user = userEvent.setup();
    const { onSave } = renderNote({ note: 'Original' });

    await user.click(screen.getByRole('button', { name: 'Edit note' }));
    await user.clear(screen.getByRole('textbox'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('task-1', '');
  });

  it('closes the editor when the disclosure is clicked again', async () => {
    const user = userEvent.setup();
    const { onSave } = renderNote();

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox'), 'Typed but abandoned');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
