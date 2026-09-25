export type Task = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  minimum_minutes: number | null;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
};

export type Completion = {
  id: string;
  task_id: string;
  user_id: string;
  completion_date: string;
  actual_minutes: number;
  completed_at: string;
};

export type HabitNote = {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type TaskValues = {
  title: string;
  note: string;
  minimumMinutes: number | null;
};
