-- Daymark development reset.
-- This intentionally deletes all existing Daymark task, note, and time-log data.
drop table if exists public.habit_notes cascade;
drop table if exists public.task_completions cascade;
drop table if exists public.tasks cascade;

create extension if not exists "pgcrypto";

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  note text check (note is null or char_length(note) <= 240),
  minimum_minutes integer check (
    minimum_minutes is null
    or minimum_minutes between 1 and 1440
  ),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null,
  actual_minutes integer not null check (actual_minutes between 1 and 1440),
  completed_at timestamptz not null default now(),
  unique (task_id, completion_date)
);

create table public.habit_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx
  on public.tasks (user_id, created_at);

create index task_completions_user_date_idx
  on public.task_completions (user_id, completion_date);

create index habit_notes_task_updated_idx
  on public.habit_notes (task_id, updated_at desc);

alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.habit_notes enable row level security;

create policy "Users can read their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can create their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create policy "Users can read their own completions"
  on public.task_completions for select
  using (auth.uid() = user_id);

create policy "Users can create completions for their own tasks"
  on public.task_completions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.tasks
      where tasks.id = task_completions.task_id
        and tasks.user_id = auth.uid()
    )
  );

create policy "Users can update their own completions"
  on public.task_completions for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.tasks
      where tasks.id = task_completions.task_id
        and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete their own completions"
  on public.task_completions for delete
  using (auth.uid() = user_id);

create policy "Users can read their own habit notes"
  on public.habit_notes for select
  using (auth.uid() = user_id);

create policy "Users can create notes for their own habits"
  on public.habit_notes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tasks
      where tasks.id = habit_notes.task_id
        and tasks.user_id = auth.uid()
    )
  );

create policy "Users can update their own habit notes"
  on public.habit_notes for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tasks
      where tasks.id = habit_notes.task_id
        and tasks.user_id = auth.uid()
    )
  );

create policy "Users can delete their own habit notes"
  on public.habit_notes for delete
  using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.task_completions to authenticated;
grant select, insert, update, delete on table public.habit_notes to authenticated;
