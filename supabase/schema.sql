create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  note text check (note is null or char_length(note) <= 240),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null,
  completed_at timestamptz not null default now(),
  unique (task_id, completion_date)
);

create index if not exists tasks_user_id_idx
  on public.tasks (user_id, created_at);

create index if not exists task_completions_user_date_idx
  on public.task_completions (user_id, completion_date);

alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;

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

create policy "Users can delete their own completions"
  on public.task_completions for delete
  using (auth.uid() = user_id);
