alter table public.tasks
add column if not exists sort_order integer;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, status
      order by created_at desc, id
    ) - 1 as next_sort_order
  from public.tasks
)
update public.tasks as tasks
set sort_order = ranked.next_sort_order
from ranked
where tasks.id = ranked.id
  and tasks.sort_order is null;

alter table public.tasks
alter column sort_order set default 0;

update public.tasks
set sort_order = 0
where sort_order is null;

alter table public.tasks
alter column sort_order set not null;

create index if not exists tasks_user_status_sort_order_idx
on public.tasks (user_id, status, sort_order);
