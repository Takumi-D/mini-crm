-- Apply in Supabase SQL Editor to an existing installation.
create or replace function public.protect_task_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status or new.author_id is distinct from old.author_id then
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

create or replace function public.reject_history_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then return old; end if;
  raise exception 'Task history is immutable';
end $$;

drop policy if exists "managers delete tasks" on public.tasks;
create policy "managers delete tasks" on public.tasks for delete to authenticated
using (public.current_role() = 'manager');

-- Split project read/write rules: a visible project must not become deletable by an executor.
drop policy if exists "managers manage projects" on public.projects;
drop policy if exists "read permitted projects" on public.projects;
drop policy if exists "managers insert projects" on public.projects;
drop policy if exists "managers update projects" on public.projects;
drop policy if exists "managers delete projects" on public.projects;

create policy "read permitted projects" on public.projects for select to authenticated
using (public.current_role() = 'manager' or public.can_view_project(id));
create policy "managers insert projects" on public.projects for insert to authenticated
with check (public.current_role() = 'manager');
create policy "managers update projects" on public.projects for update to authenticated
using (public.current_role() = 'manager') with check (public.current_role() = 'manager');
create policy "managers delete projects" on public.projects for delete to authenticated
using (public.current_role() = 'manager');
