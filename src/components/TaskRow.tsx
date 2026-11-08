import type { Task } from "../types";

const statusClass = {
  Новая: "new",
  "В работе": "working",
  "На проверке": "review",
  Принята: "accepted",
  "На доработке": "revision",
} as const;

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

export function TaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <button className="task-row" onClick={onOpen}>
      <span className="task-check">
        {task.status === "Принята" ? "✓" : "·"}
      </span>
      <span className="task-text">
        <b>{task.title}</b>
        <small>
          {task.project?.name} · {task.assignee?.full_name} ·{" "}
          {dateLabel(task.created_at)}
        </small>
      </span>
      <span className={`status-badge ${statusClass[task.status]}`}>
        <i />
        {task.status}
      </span>
      <span className="row-arrow">↗</span>
    </button>
  );
}
