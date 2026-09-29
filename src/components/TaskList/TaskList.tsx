import { TaskItem } from '../TaskItem/TaskItem';
import type { Task } from '../../types/task';
import styles from './TaskList.module.css';

type TaskListProps = {
  tasks: Task[];
  onToggle: (id: string, done: boolean) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onNoteSave: (id: string, note: string) => void;
};

export function TaskList({ tasks, onToggle, onRename, onDelete, onNoteSave }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className={styles.empty} role="status">
        Nothing to do yet. Add your first task above.
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onRename={onRename}
          onDelete={onDelete}
          onNoteSave={onNoteSave}
        />
      ))}
    </ul>
  );
}
