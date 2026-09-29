import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/task';
import { TaskItem } from './TaskItem';

const task: Task = {
  id: 'task-1',
  title: 'Buy milk',
  done: false,
  createdAt: 1,
  priority: 'medium',
  tags: [],
  updatedAt: 1,
};

function renderItem(overrides: Partial<React.ComponentProps<typeof TaskItem>> = {}) {
  const props = {
    task,
    onToggle: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onNoteSave: vi.fn(),
    ...overrides,
  };
  render(
    <ul>
      <TaskItem {...props} />
    </ul>,
  );
  return props;
}

describe('TaskItem', () => {
  it('renders the title and per-task controls', () => {
    renderItem();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Buy milk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Buy milk' })).toBeInTheDocument();
  });

  it('toggles completion', async () => {
    const user = userEvent.setup();
    const props = renderItem();

    await user.click(screen.getByRole('checkbox'));

    expect(props.onToggle).toHaveBeenCalledWith('task-1', true);
  });

  it('deletes', async () => {
    const user = userEvent.setup();
    const props = renderItem();

    await user.click(screen.getByRole('button', { name: 'Delete Buy milk' }));

    expect(props.onDelete).toHaveBeenCalledWith('task-1');
  });

  it('focuses the edit field and saves with Enter', async () => {
    const user = userEvent.setup();
    const props = renderItem();

    await user.click(screen.getByRole('button', { name: 'Edit Buy milk' }));

    const input = screen.getByLabelText('Edit Buy milk');
    expect(input).toHaveFocus();

    await user.clear(input);
    await user.type(input, 'Buy oat milk{Enter}');

    expect(props.onRename).toHaveBeenCalledWith('task-1', 'Buy oat milk');
  });

  it('cancels editing with Escape without saving', async () => {
    const user = userEvent.setup();
    const props = renderItem();

    await user.click(screen.getByRole('button', { name: 'Edit Buy milk' }));
    await user.clear(screen.getByLabelText('Edit Buy milk'));
    await user.type(screen.getByLabelText('Edit Buy milk'), 'Discarded{Escape}');

    expect(props.onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('cancels editing with the Cancel button', async () => {
    const user = userEvent.setup();
    const props = renderItem();

    await user.click(screen.getByRole('button', { name: 'Edit Buy milk' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('refuses to save an empty title', async () => {
    const user = userEvent.setup();
    const props = renderItem();

    await user.click(screen.getByRole('button', { name: 'Edit Buy milk' }));
    const input = screen.getByLabelText('Edit Buy milk');
    await user.clear(input);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(props.onRename).not.toHaveBeenCalled();
  });

  it('can be reached with the keyboard alone', async () => {
    const user = userEvent.setup();
    renderItem();

    await user.tab();
    expect(screen.getByRole('checkbox')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Edit Buy milk' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Delete Buy milk' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Add note' })).toHaveFocus();
  });

  it('saves a note through the note editor', async () => {
    const user = userEvent.setup();
    const props = renderItem();

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Note for Buy milk' }), 'Two litres{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(props.onNoteSave).toHaveBeenCalledWith('task-1', 'Two litres\n');
  });

  it('hides the note editor while the title is being edited', async () => {
    const user = userEvent.setup();
    renderItem();

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    expect(screen.getByRole('textbox', { name: 'Note for Buy milk' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit Buy milk' }));

    expect(screen.queryByRole('textbox', { name: 'Note for Buy milk' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Edit Buy milk')).toHaveFocus();
  });

  it('shows an existing note', () => {
    renderItem({ task: { ...task, note: 'Ask for oat milk' } });
    expect(screen.getByText('Ask for oat milk')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit note' })).toBeInTheDocument();
  });
});
