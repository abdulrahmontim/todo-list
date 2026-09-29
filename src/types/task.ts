export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  dueAt?: number;
  priority: Priority;
  tags: string[];
  note?: string;
  estimateMins?: number;
  actualMins?: number;
  dependsOn?: string[];
  scheduledStart?: number;
  scheduledEnd?: number;
  completedAt?: number;
  updatedAt: number;
};

/** What the capture form collects, before an id and timestamps exist. */
export type TaskDraft = {
  title: string;
  note?: string;
};

export type NewTask = TaskDraft & {
  id: string;
  now: number;
};
