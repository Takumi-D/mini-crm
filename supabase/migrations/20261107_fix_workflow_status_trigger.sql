-- Apply in Supabase SQL Editor. Allows the SECURITY DEFINER workflow to set
-- task status while keeping direct API updates by authenticated users blocked.
create or replace function public.protect_task_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status and current_user = 'authenticated' then
    raise exception 'Use the task workflow to change protected fields';
  end if;

  if new.author_id is distinct from old.author_id then
    raise exception 'Use the task workflow to change protected fields';
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    if public.current_role() <> 'manager' then raise exception 'Only managers can reassign tasks'; end if;
    if not exists(select 1 from public.profiles where id = new.assignee_id and role = 'executor') then
      raise exception 'Assignee must be an executor';
    end if;
  end if;

  return new;
end $$;
