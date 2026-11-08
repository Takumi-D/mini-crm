import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { useProjects } from "./hooks/useProjects";
import { useTasks } from "./hooks/useTasks";
import { isConfigured } from "./lib/api";
import { LoginPage } from "./components/LoginPage";
import { TaskDialog } from "./components/TaskDialog";
import { ProjectFormDialog } from "./components/ProjectFormDialog";
import { ProfileDialog } from "./components/ProfileDialog";
import { WorkspaceLayout } from "./components/WorkspaceLayout";
import { StatusMessages } from "./components/StatusMessages";
import { ProjectsPage } from "./components/ProjectsPage";
import { TasksPage } from "./components/TasksPage";
import type { Project, Task, TaskAction } from "./types";
import "./App.css";

function App() {
  const auth = useAuth();
  const userId = auth.session?.user.id ?? null;
  const profileState = useProfile(userId);
  const projectState = useProjects(userId);
  const taskState = useTasks(userId);
  const { profile, people } = profileState;
  const { projects } = projectState;
  const { tasks, history } = taskState;
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [view, setView] = useState<"projects" | "mine">("projects");
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [notice, setNotice] = useState("");

  const error =
    operationError ||
    auth.error ||
    profileState.error ||
    projectState.error ||
    taskState.error;

  const runOperation = async <T,>(
    operation: () => Promise<T>,
    successMessage?: string,
  ) => {
    setBusy(true);
    setOperationError("");
    setNotice("");
    try {
      const result = await operation();
      if (successMessage) setNotice(successMessage);
      return result;
    } catch (cause) {
      setOperationError(
        cause instanceof Error ? cause.message : "Операция не выполнена.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    await auth.signIn(
      String(values.get("email")),
      String(values.get("password")),
    );
  };

  const handleSignOut = async () => {
    const succeeded = await auth.signOut();
    if (succeeded) {
      setActiveTask(null);
      setActiveProject(null);
      setProfileOpen(false);
      setView("projects");
    }
  };

  const showTask = async (task: Task) => {
    setActiveTask(task);
    setOperationError("");
    try {
      await taskState.loadHistory(task.id);
    } catch (cause) {
      setOperationError(
        cause instanceof Error
          ? cause.message
          : "Не удалось загрузить историю.",
      );
    }
  };

  const perform = async (action: TaskAction, comment?: string) => {
    if (!activeTask) return;
    const updatedStatus = await runOperation(
      () => taskState.transition(activeTask.id, action, comment),
      "Статус задачи обновлён",
    );
    if (updatedStatus) {
      setActiveTask((current) =>
        current ? { ...current, status: updatedStatus } : current,
      );
    }
  };

  const createProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(event.currentTarget);
    const projectId = await runOperation(
      () =>
        projectState.create({
          name: String(values.get("name")),
          address: String(values.get("address")),
        }),
      "Объект создан",
    );
    if (projectId) {
      form.reset();
      setProjectFormOpen(false);
      setActiveProject(projectId);
    }
  };
  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeProject) {
      setOperationError(
        "Сначала откройте объект, для которого нужно создать задачу.",
      );
      return;
    }
    const form = event.currentTarget;
    const values = new FormData(event.currentTarget);
    const createdTaskId = await runOperation(
      () =>
        taskState.create({
          title: String(values.get("title")),
          description: String(values.get("description") ?? ""),
          projectId: activeProject,
          assigneeId: String(values.get("assignee_id")),
        }),
      "Задача создана",
    );
    if (createdTaskId) {
      form.reset();
    }
  };

  const editProject = async (project: Project) => {
    const name = window.prompt("Название объекта", project.name)?.trim();
    if (!name) return;
    const address = window.prompt("Адрес объекта", project.address)?.trim();
    if (!address) return;
    await runOperation(
      () => projectState.update(project.id, { name, address }),
      "Объект обновлён",
    );
  };

  const deleteProject = async (project: Project) => {
    const relatedTasks = tasks.filter(
      (task) => task.project_id === project.id,
    ).length;
    const detail = relatedTasks
      ? ` Вместе с ним будут удалены задачи (${relatedTasks}) и их история.`
      : "";
    if (!window.confirm(`Удалить объект «${project.name}»?${detail}`)) return;
    const removed = await runOperation(
      () => projectState.remove(project.id),
      "Объект удалён",
    );
    if (removed === null) return;
    await taskState.refresh();
  };

  const editTask = async (task: Task) => {
    const title = window.prompt("Название задачи", task.title)?.trim();
    if (!title) return;
    const description =
      window.prompt("Описание задачи", task.description)?.trim() ??
      task.description;
    const choices = people
      .map((person, index) => `${index + 1}. ${person.full_name}`)
      .join("\n");
    const selected = window.prompt(
      `Номер исполнителя (оставьте пустым, чтобы не менять):\n${choices}`,
    );
    let assigneeId = task.assignee_id;
    if (selected?.trim()) {
      const person = people[Number(selected) - 1];
      if (!person) {
        setOperationError("Выберите номер исполнителя из списка.");
        return;
      }
      assigneeId = person.id;
    }
    const updated = await runOperation(
      () => taskState.update(task.id, { title, description, assigneeId }),
      "Задача обновлена",
    );
    if (updated !== null) {
      setActiveTask(null);
    }
  };

  const deleteTask = async (task: Task) => {
    if (
      !window.confirm(
        `Удалить задачу «${task.title}» вместе с историей изменений?`,
      )
    )
      return;
    const removed = await runOperation(
      () => taskState.remove(task.id),
      "Задача удалена",
    );
    if (removed !== null) {
      setActiveTask(null);
    }
  };

  const visibleTasks = useMemo(
    () =>
      view === "mine"
        ? tasks.filter((task) => task.assignee_id === profile?.id)
        : tasks.filter(
            (task) => !activeProject || task.project_id === activeProject,
          ),
    [tasks, view, profile, activeProject],
  );

  if (!isConfigured())
    return (
      <main className="setup">
        <span className="brand-mark">с</span>
        <h1>Настройка подключения</h1>
        <p>
          Создайте файл <code>.env.local</code> в корне проекта и добавьте ключ
          Supabase publishable.
        </p>
        <pre>
          VITE_SUPABASE_URL=https://ваш-проект.supabase.co
          <br />
          VITE_SUPABASE_ANON_KEY=sb_publishable_…
        </pre>
        <p>
          Секретный ключ на клиенте использовать нельзя. Затем выполните SQL из{" "}
          <code>supabase/schema.sql</code>.
        </p>
      </main>
    );
  if (!auth.authReady)
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="brand-mark">с</span>
        <p>Проверяем вход…</p>
      </main>
    );
  if (!auth.session)
    return (
      <LoginPage busy={auth.busy} error={auth.error} onSubmit={handleSignIn} />
    );
  if (profileState.loading || projectState.loading || taskState.loading)
    return (
      <main className="auth-loading" aria-live="polite">
        <span className="brand-mark">с</span>
        <p>Загружаем рабочее пространство…</p>
      </main>
    );
  if (!profile)
    return (
      <main className="setup">
        <h1>Не удалось открыть профиль</h1>
        <p>
          {profileState.error ||
            "Проверьте, что профиль создан в Supabase и у него указана роль."}
        </p>
        <button className="primary" onClick={() => void handleSignOut()}>
          Выйти
        </button>
      </main>
    );

  const activeProjectData =
    projects.find((project) => project.id === activeProject) ?? null;
  const pageTitle =
    view === "mine" ? "Мои задачи" : (activeProjectData?.name ?? "Объекты");

  const navigate = (nextView: "projects" | "mine") => {
    setView(nextView);
    setActiveProject(null);
  };

  return (
    <>
      <WorkspaceLayout
        profile={profile}
        projectCount={projects.length}
        myTaskCount={
          tasks.filter((task) => task.assignee_id === profile.id).length
        }
        view={view}
        pageTitle={pageTitle}
        onNavigate={navigate}
        onOpenProfile={() => setProfileOpen(true)}
        onSignOut={() => void handleSignOut()}
      >
        <StatusMessages
          error={error}
          notice={notice}
          onDismissError={() => setOperationError("")}
          onDismissNotice={() => setNotice("")}
        />

        {view === "projects" && !activeProject ? (
          <ProjectsPage
            projects={projects}
            tasks={tasks}
            role={profile.role}
            onCreateProject={() => setProjectFormOpen(true)}
            onOpenProject={(project) => setActiveProject(project.id)}
            onEditProject={(project) => void editProject(project)}
            onDeleteProject={(project) => void deleteProject(project)}
          />
        ) : (
          <TasksPage
            view={view}
            project={activeProjectData}
            tasks={visibleTasks}
            people={people}
            role={profile.role}
            busy={busy}
            onBack={() => navigate("projects")}
            onOpenTask={(task) => void showTask(task)}
            onCreateTask={createTask}
          />
        )}
      </WorkspaceLayout>
      {projectFormOpen && (
        <ProjectFormDialog
          busy={busy}
          onClose={() => setProjectFormOpen(false)}
          onSubmit={createProject}
        />
      )}
      {profileOpen && (
        <ProfileDialog
          profile={profile}
          email={auth.session?.user.email ?? ""}
          onClose={() => setProfileOpen(false)}
          onSignOut={() => void handleSignOut()}
        />
      )}
      {activeTask && (
        <TaskDialog
          task={activeTask}
          profile={profile}
          history={history}
          busy={busy}
          onClose={() => setActiveTask(null)}
          onAction={(action, comment) => void perform(action, comment)}
          onEdit={() => void editTask(activeTask)}
          onDelete={() => void deleteTask(activeTask)}
          onError={setOperationError}
        />
      )}
    </>
  );
}

export default App;
