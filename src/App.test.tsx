import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { resetTestDb } from './test/resetDb';

beforeEach(async () => {
  await resetTestDb();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-contrast');
  document.documentElement.removeAttribute('style');
});

async function addTask(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.type(screen.getByLabelText('New task'), `${title}{Enter}`);
  await screen.findByText(title);
}

describe('App', () => {
  it('shows an empty state before anything is added', async () => {
    render(<App />);
    expect(await screen.findByText('Nothing to do yet. Add your first task above.')).toBeInTheDocument();
  });

  it('adds, edits, completes and deletes a task', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');

    await addTask(user, 'Buy milk');
    expect(screen.getByLabelText('New task')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Edit Buy milk' }));
    const input = screen.getByLabelText('Edit Buy milk');
    await user.clear(input);
    await user.type(input, 'Buy oat milk{Enter}');
    expect(await screen.findByText('Buy oat milk')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('checkbox'));
    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeChecked();
      expect(screen.getByRole('listitem')).toHaveAttribute('data-done', 'true');
    });

    await user.click(screen.getByRole('button', { name: 'Delete Buy oat milk' }));
    await waitFor(() => {
      expect(screen.getByText('Nothing to do yet. Add your first task above.')).toBeInTheDocument();
    });
  });

  it('keeps tasks in the right order: open first, completed last', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');

    await addTask(user, 'First');
    await addTask(user, 'Second');

    await user.click(screen.getAllByRole('checkbox')[0]!);

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Second');
      expect(items[1]).toHaveTextContent('First');
    });
  });

  it('reports how many tasks are remaining', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');

    await addTask(user, 'Only task');
    expect(await screen.findByText('1 of 1 remaining · 0 done')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));
    expect(await screen.findByText('0 of 1 remaining · 1 done')).toBeInTheDocument();
  });

  it('restores tasks from IndexedDB on reload', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');
    await addTask(user, 'Persisted task');
    first.unmount();

    render(<App />);
    expect(await screen.findByText('Persisted task')).toBeInTheDocument();
  });

  it('adds, persists and clears a note', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');
    await addTask(user, 'Call bank');

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Note for Call bank' }), 'Ask about fees');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Ask about fees')).toBeInTheDocument();
    first.unmount();

    render(<App />);
    expect(await screen.findByText('Ask about fees')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit note' }));
    await user.clear(screen.getByRole('textbox', { name: 'Note for Call bank' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.queryByText('Ask about fees')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
  });

  it('keeps a note attached to its own task', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');
    await addTask(user, 'First');
    await addTask(user, 'Second');

    await user.click(screen.getAllByRole('button', { name: 'Add note' })[1]!);
    await user.type(screen.getByRole('textbox', { name: 'Note for Second' }), 'Only mine');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Only mine');

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('First');
    expect(items[0]).not.toHaveTextContent('Only mine');
    expect(items[1]).toHaveTextContent('Second');
    expect(items[1]).toHaveTextContent('Only mine');
  });

  it('does not lose a note when the task is completed', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');
    await addTask(user, 'Water plants');

    await user.click(screen.getByRole('button', { name: 'Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Note for Water plants' }), 'Twice a week');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Twice a week');

    await user.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(screen.getByRole('listitem')).toHaveAttribute('data-done', 'true');
    });
    expect(screen.getByText('Twice a week')).toBeInTheDocument();
  });

  it('adds a task with a note in one go and keeps it', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');

    await user.type(screen.getByLabelText('New task'), 'Buy milk');
    await user.click(screen.getByRole('button', { name: '+ Note' }));
    await user.type(screen.getByLabelText('Note'), 'oat, not cow');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('oat, not cow')).toBeInTheDocument();
    first.unmount();

    render(<App />);
    expect(await screen.findByText('oat, not cow')).toBeInTheDocument();
  });

  it('does not store an empty note as a blank one', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');

    await user.type(screen.getByLabelText('New task'), 'Walk the dog');
    await user.click(screen.getByRole('button', { name: '+ Note' }));
    await user.type(screen.getByLabelText('Note'), '    ');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Walk the dog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
  });

  it('changes the theme from the header without breaking tasks', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Nothing to do yet. Add your first task above.');

    const toggle = screen.getByRole('button', { name: 'Settings' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(JSON.parse(window.localStorage.getItem('todo.settings.v1') ?? '{}')).toMatchObject({
      theme: 'dark',
    });

    await addTask(user, 'Still works');
    expect(await screen.findByText('Still works')).toBeInTheDocument();
  });
});
