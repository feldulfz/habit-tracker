create table if not exists public.habit_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habit_notes_task_updated_idx
  on public.habit_notes (task_id, updated_at desc);

alter table public.habit_notes enable row level security;

drop policy if exists "Users can read their own habit notes" on public.habit_notes;
create policy "Users can read their own habit notes"
  on public.habit_notes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create notes for their own habits" on public.habit_notes;
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

drop policy if exists "Users can update their own habit notes" on public.habit_notes;
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

drop policy if exists "Users can delete their own habit notes" on public.habit_notes;
create policy "Users can delete their own habit notes"
  on public.habit_notes for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.habit_notes to authenticated;
