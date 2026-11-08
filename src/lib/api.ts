import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { History, Profile, Project, Task, TaskAction } from "../types";

function client() {
  if (!supabase) throw new Error("Supabase не настроен. Проверьте .env.local.");
  return supabase;
}

export function isConfigured() {
  return Boolean(supabase);
}

function throwOnError(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

function unwrap<T>(result: {
  data: T | null;
  error: { message: string } | null;
}): NonNullable<T> {
  throwOnError(result);
  if (result.data == null) throw new Error("Supabase не вернул данные.");
  return result.data as NonNullable<T>;
}

// Auth
export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  if (!supabase) {
    queueMicrotask(() => callback("INITIAL_SESSION", null));
    return () => undefined;
  }
  const { data } = client().auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string) {
  const { data, error } = await client().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data.session;
}

export async function signOut() {
  throwOnError(await client().auth.signOut());
}

// Profile
export async function getProfile(userId: string): Promise<Profile> {
  const data = unwrap(
    await client()
      .from("profiles")
      .select("id,full_name,role")
      .eq("id", userId)
      .single(),
  );
  return data as Profile;
}

export async function getExecutors(): Promise<Profile[]> {
  const data = unwrap(
    await client()
      .from("profiles")
      .select("id,full_name,role")
      .eq("role", "executor")
      .order("full_name"),
  );
  return (data ?? []) as Profile[];
}

// Projects
export async function getProjects(): Promise<Project[]> {
  const data = unwrap(
    await client()
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false }),
  );
  return (data ?? []) as Project[];
}

export async function createProject(input: Pick<Project, "name" | "address">) {
  const result = await client()
    .from("projects")
    .insert(input)
    .select("id")
    .single();
  const data = unwrap(
    result as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    },
  );
  return data.id;
}

export async function updateProject(
  projectId: string,
  input: Pick<Project, "name" | "address">,
) {
  throwOnError(
    await client().from("projects").update(input).eq("id", projectId),
  );
}

export async function deleteProject(projectId: string) {
  throwOnError(await client().from("projects").delete().eq("id", projectId));
}

// Tasks and status history
export async function getTasks(): Promise<Task[]> {
  const data = unwrap(
    await client()
      .from("tasks")
      .select(
        "*, project:projects(id,name,address), assignee:profiles!tasks_assignee_id_fkey(id,full_name,role), author:profiles!tasks_author_id_fkey(id,full_name,role)",
      )
      .order("created_at", { ascending: false }),
  );
  return (data ?? []) as Task[];
}

export async function getTaskHistory(taskId: string): Promise<History[]> {
  const data = unwrap(
    await client()
      .from("task_history")
      .select("*, actor:profiles!task_history_actor_id_fkey(id,full_name,role)")
      .eq("task_id", taskId)
      .order("created_at"),
  );
  return (data ?? []) as History[];
}

export async function createTask(input: {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
}) {
  return unwrap(
    await client().rpc("create_task", {
      p_title: input.title,
      p_description: input.description,
      p_project_id: input.projectId,
      p_assignee_id: input.assigneeId,
    }),
  ) as string;
}

export async function updateTask(
  taskId: string,
  input: { title: string; description: string; assigneeId: string },
) {
  throwOnError(
    await client()
      .from("tasks")
      .update({
        title: input.title,
        description: input.description,
        assignee_id: input.assigneeId,
      })
      .eq("id", taskId),
  );
}

export async function deleteTask(taskId: string) {
  throwOnError(await client().from("tasks").delete().eq("id", taskId));
}

export async function transitionTask(
  taskId: string,
  action: TaskAction,
  comment?: string,
) {
  throwOnError(
    await client().rpc("transition_task", {
      p_task_id: taskId,
      p_action: action,
      p_comment: comment ?? null,
    }),
  );
}
