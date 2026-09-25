-- Run once in the Supabase SQL editor for an existing Daymark database.
alter table public.tasks
  add column if not exists sort_order integer;

with ranked_tasks as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at, id
    ) - 1 as position
  from public.tasks
)
update public.tasks
set sort_order = ranked_tasks.position
from ranked_tasks
where public.tasks.id = ranked_tasks.id
  and public.tasks.sort_order is null;

alter table public.tasks
  alter column sort_order set default 0,
  alter column sort_order set not null;

create index if not exists tasks_user_sort_idx
  on public.tasks (user_id, archived_at, sort_order, created_at);

create or replace function public.swap_task_order(
  first_task_id uuid,
  second_task_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  first_order integer;
  second_order integer;
begin
  if first_task_id = second_task_id then
    return;
  end if;

  select sort_order into first_order
  from public.tasks
  where id = first_task_id and user_id = auth.uid()
  for update;

  select sort_order into second_order
  from public.tasks
  where id = second_task_id and user_id = auth.uid()
  for update;

  if first_order is null or second_order is null then
    raise exception 'Task not found';
  end if;

  update public.tasks
  set sort_order = case id
    when first_task_id then second_order
    when second_task_id then first_order
  end
  where user_id = auth.uid()
    and id in (first_task_id, second_task_id);
end;
$$;

grant execute on function public.swap_task_order(uuid, uuid) to authenticated;
