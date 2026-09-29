import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  it('adds a task on Enter and clears the field', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<TaskForm onAdd={onAdd} />);

    const input = screen.getByLabelText('New task');
    await user.type(input, 'Buy milk{Enter}');

    expect(onAdd).toHaveBeenCalledWith({ title: 'Buy milk', note: '' });
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('adds a task with the Add button', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<TaskForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText('New task'), 'Walk the dog');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith({ title: 'Walk the dog', note: '' });
  });

  it('keeps the button disabled until there is a title', async () => {
    const user = userEvent.setup();
    render(<TaskForm onAdd={vi.fn().mockResolvedValue(true)} />);

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('New task'), '   ');
    expect(button).toBeDisabled();
  });

  it('keeps the typed value when saving fails', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(false);
    render(<TaskForm onAdd={onAdd} />);

    const input = screen.getByLabelText('New task');
    await user.type(input, 'Retry me{Enter}');

    expect(input).toHaveValue('Retry me');
  });

  describe('note field', () => {
    it('is hidden until the toggle is used', async () => {
      const user = userEvent.setup();
      render(<TaskForm onAdd={vi.fn().mockResolvedValue(true)} />);

      const toggle = screen.getByRole('button', { name: '+ Note' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByLabelText('Note')).not.toBeInTheDocument();

      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByLabelText('Note')).toHaveFocus();
    });

    it('sends the note with the task', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(true);
      render(<TaskForm onAdd={onAdd} />);

      await user.type(screen.getByLabelText('New task'), 'Buy milk');
      await user.click(screen.getByRole('button', { name: '+ Note' }));
      await user.type(screen.getByLabelText('Note'), 'oat, not cow');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(onAdd).toHaveBeenCalledWith({ title: 'Buy milk', note: 'oat, not cow' });
    });

    it('clears the note but stays open after a task with a note', async () => {
      const user = userEvent.setup();
      render(<TaskForm onAdd={vi.fn().mockResolvedValue(true)} />);

      await user.type(screen.getByLabelText('New task'), 'Buy milk');
      await user.click(screen.getByRole('button', { name: '+ Note' }));
      await user.type(screen.getByLabelText('Note'), 'oat, not cow{Enter}');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getByLabelText('Note')).toHaveValue('');
      expect(screen.getByLabelText('New task')).toHaveFocus();
    });

    it('collapses again when the added task had no note', async () => {
      const user = userEvent.setup();
      render(<TaskForm onAdd={vi.fn().mockResolvedValue(true)} />);

      await user.click(screen.getByRole('button', { name: '+ Note' }));
      await user.type(screen.getByLabelText('Note'), '   ');
      await user.type(screen.getByLabelText('New task'), 'Buy milk{Enter}');

      expect(screen.queryByLabelText('Note')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+ Note' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('keeps the note when saving fails', async () => {
      const user = userEvent.setup();
      render(<TaskForm onAdd={vi.fn().mockResolvedValue(false)} />);

      await user.type(screen.getByLabelText('New task'), 'Buy milk');
      await user.click(screen.getByRole('button', { name: '+ Note' }));
      await user.type(screen.getByLabelText('Note'), 'oat, not cow');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getByLabelText('New task')).toHaveValue('Buy milk');
      expect(screen.getByLabelText('Note')).toHaveValue('oat, not cow');
    });

    it('submits on Ctrl+Enter so newlines can be typed', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn().mockResolvedValue(true);
      render(<TaskForm onAdd={onAdd} />);

      await user.type(screen.getByLabelText('New task'), 'Call bank');
      await user.click(screen.getByRole('button', { name: '+ Note' }));
      await user.type(screen.getByLabelText('Note'), 'ask about fees{Control>}{Enter}{/Control}');

      expect(onAdd).toHaveBeenCalledWith({ title: 'Call bank', note: 'ask about fees' });
    });

    it('hides on Escape without losing what was typed', async () => {
      const user = userEvent.setup();
      render(<TaskForm onAdd={vi.fn().mockResolvedValue(true)} />);

      await user.click(screen.getByRole('button', { name: '+ Note' }));
      await user.type(screen.getByLabelText('Note'), 'half a thought{Escape}');
      expect(screen.queryByLabelText('Note')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '+ Note' }));
      expect(screen.getByLabelText('Note')).toHaveValue('half a thought');
    });
  });
});
