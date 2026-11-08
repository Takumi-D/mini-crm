-- Mini CRM: paste into Supabase SQL Editor and run once.
create extension if not exists pgcrypto;

create type public.app_role as enum ('manager', 'executor');
create type public.task_status as enum ('Новая', 'В работе', 'На проверке', 'Принята', 'На доработке');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  role public.app_role not null
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  address text not null check (length(trim(address)) between 1 and 300),
  created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  project_id uuid not null references public.projects(id) on delete cascade,
  assignee_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  status public.task_status not null default 'Новая',
  created_at timestamptz not null default now()
);
create table public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  from_status public.task_status,
  to_status public.task_status not null,
  comment text,
  created_at timestamptz not null default now()
);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_project_idx on public.tasks(project_id);
create index history_task_idx on public.task_history(task_id, created_at);

create function public.current_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;
create function public.can_view_project(p_project_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.current_role() = 'manager' or exists (
    select 1 from public.tasks t where t.project_id = p_project_id and t.assignee_id = (select auth.uid())
  )
$$;

create function public.create_task(p_title text, p_description text, p_project_id uuid, p_assignee_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if (select auth.uid()) is null or public.current_role() <> 'manager' then raise exception 'Only managers can create tasks'; end if;
  if not exists(select 1 from public.profiles where id = p_assignee_id and role = 'executor') then raise exception 'Assignee must be an executor'; end if;
  if not exists(select 1 from public.projects where id = p_project_id) then raise exception 'Project does not exist'; end if;
  insert into public.tasks(title, description, project_id, assignee_id, author_id)
  values (trim(p_title), coalesce(p_description, ''), p_project_id, p_assignee_id, (select auth.uid())) returning id into v_id;
  return v_id;
end $$;

create function public.transition_task(p_task_id uuid, p_action text, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_task public.tasks%rowtype; v_next public.task_status;
begin
  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then raise exception 'Task not found'; end if;
  if p_action in ('start','submit','return_to_work') then
    if public.current_role() <> 'executor' or v_task.assignee_id <> (select auth.uid()) then raise exception 'Only the assigned executor can do this'; end if;
    if p_action = 'start' and v_task.status = 'Новая' then v_next := 'В работе';
    elsif p_action = 'submit' and v_task.status = 'В работе' then v_next := 'На проверке';
    elsif p_action = 'return_to_work' and v_task.status = 'На доработке' then v_next := 'В работе';
    else raise exception 'Transition is not allowed'; end if;
  elsif p_action in ('accept','request_revision') then
    if public.current_role() <> 'manager' then raise exception 'Only managers can review tasks'; end if;
    if v_task.status <> 'На проверке' then raise exception 'Task is not awaiting review'; end if;
    if p_action = 'request_revision' and length(trim(coalesce(p_comment,''))) = 0 then raise exception 'A comment is required for revision'; end if;
    v_next := case when p_action = 'accept' then 'Принята'::public.task_status else 'На доработке'::public.task_status end;
  else raise exception 'Unknown action'; end if;
  update public.tasks set status = v_next where id = p_task_id;
  insert into public.task_history(task_id, actor_id, from_status, to_status, comment)
  values (p_task_id, (select auth.uid()), v_task.status, v_next, nullif(trim(coalesce(p_comment,'')),''));
end $$;

create function public.log_task_creation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.task_history(task_id, actor_id, from_status, to_status)
  values (new.id, new.author_id, null, 'Новая');
  return new;
end $$;
create trigger task_creation_history after insert on public.tasks for each row execute function public.log_task_creation();

-- Do not allow direct status, authorship or history manipulation through the API.
create function public.protect_task_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- SECURITY DEFINER workflow calls run with the function owner's role.
  -- API updates run as authenticated and cannot change status directly.
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
create trigger protect_task_fields before update on public.tasks for each row execute function public.protect_task_fields();
create function public.reject_history_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Preserve history from API edits while allowing a manager's task deletion to cascade.
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then return old; end if;
  raise exception 'Task history is immutable';
end $$;
create trigger immutable_history before update or delete on public.task_history for each row execute function public.reject_history_mutation();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;

create policy "read profiles in workspace" on public.profiles for select to authenticated
using (public.current_role() = 'manager' or id = (select auth.uid()) or exists(select 1 from public.tasks t where t.assignee_id = (select auth.uid()) and (t.assignee_id = profiles.id or t.author_id = profiles.id)));
create policy "read permitted projects" on public.projects for select to authenticated
using (public.current_role() = 'manager' or public.can_view_project(id));
create policy "managers insert projects" on public.projects for insert to authenticated
with check (public.current_role() = 'manager');
create policy "managers update projects" on public.projects for update to authenticated
using (public.current_role() = 'manager') with check (public.current_role() = 'manager');
create policy "managers delete projects" on public.projects for delete to authenticated
using (public.current_role() = 'manager');
create policy "read permitted tasks" on public.tasks for select to authenticated
using (public.current_role() = 'manager' or assignee_id = (select auth.uid()));
create policy "managers edit task details" on public.tasks for update to authenticated
using (public.current_role() = 'manager') with check (public.current_role() = 'manager');
create policy "managers delete tasks" on public.tasks for delete to authenticated
using (public.current_role() = 'manager');
create policy "read permitted task history" on public.task_history for select to authenticated
using (exists(select 1 from public.tasks t where t.id = task_id and (public.current_role() = 'manager' or t.assignee_id = (select auth.uid()))));

revoke all on public.profiles, public.projects, public.tasks, public.task_history from anon, authenticated;
grant select on public.profiles, public.projects, public.tasks, public.task_history to authenticated;
grant insert, update, delete on public.projects to authenticated;
grant update, delete on public.tasks to authenticated;
grant execute on function public.create_task(text,text,uuid,uuid) to authenticated;
grant execute on function public.transition_task(uuid,text,text) to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.can_view_project(uuid) to authenticated;

-- Create accounts in Authentication > Users with "Disable email confirmations" on,
-- then insert a profile row for each user. Assign manager/executor roles deliberately:
-- insert into public.profiles(id, full_name, role) values ('AUTH-USER-UUID', 'Имя', 'manager');
