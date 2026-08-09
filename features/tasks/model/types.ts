export type Task = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  created_at: string;
  archived_at: string | null;
};

export type Completion = {
  id: string;
  task_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
};
