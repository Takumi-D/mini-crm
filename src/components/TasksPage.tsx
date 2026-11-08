import type { FormEvent } from "react";
import { TaskRow } from "./TaskRow";
import type { Profile, Project, Task } from "../types";

type TasksPageProps = {
  view: "projects" | "mine";
  project: Project | null;
  tasks: Task[];
  people: Profile[];
  role: Profile["role"];
  busy: boolean;
  onBack: () => void;
  onOpenTask: (task: Task) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => void;
};

export function TasksPage({
  view,
  project,
  tasks,
  people,
  role,
  busy,
  onBack,
  onOpenTask,
  onCreateTask,
}: TasksPageProps) {
  const isMyTasks = view === "mine";
  const title = isMyTasks ? "Мои задачи" : (project?.name ?? "Объект");

  return (
    <>
      <div className="page-heading compact">
        <div>
          <button className="back-link" onClick={onBack}>
            ← &nbsp;Все объекты
          </button>
          <div className="eyebrow">
            {isMyTasks ? "ВАША РАБОЧАЯ ЗОНА" : "КАРТОЧКА ОБЪЕКТА"}
          </div>
          <h1>{title}</h1>
          <p>{isMyTasks ? "Задачи, назначенные на вас." : project?.address}</p>
        </div>
      </div>

      <div className="section-head">
        <div>
          <h2>{isMyTasks ? "Мои задачи" : "Задачи объекта"}</h2>
          <span>{tasks.length} задач</span>
        </div>
        <span className="subtle">
          {isMyTasks ? "ЛИЧНЫЙ СПИСОК" : "АКТУАЛЬНЫЙ СТАТУС"}
        </span>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onOpen={() => onOpenTask(task)} />
        ))}
        {tasks.length === 0 && (
          <div className="empty">
            <span>✓</span>
            <h3>Задач пока нет</h3>
            <p>Как только появятся задачи, они отобразятся здесь.</p>
          </div>
        )}
      </div>

      {role === "manager" && project && (
        <section className="inline-form task-create">
          <div>
            <div className="eyebrow">НОВАЯ ЗАДАЧА</div>
            <h2>Поставить задачу</h2>
          </div>
          <form onSubmit={onCreateTask}>
            <input name="title" placeholder="Название задачи" required />
            <textarea name="description" placeholder="Описание" rows={2} />
            <select name="assignee_id" required defaultValue="">
              <option value="" disabled>
                Выберите исполнителя
              </option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
            <button className="primary" disabled={busy}>
              Создать задачу
            </button>
          </form>
        </section>
      )}
    </>
  );
}
