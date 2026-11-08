import type { History, Profile, Task, TaskAction } from "../types";

const statusClass = {
  Новая: "new",
  "В работе": "working",
  "На проверке": "review",
  Принята: "accepted",
  "На доработке": "revision",
} as const;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

type TaskDialogProps = {
  task: Task;
  profile: Profile;
  history: History[];
  busy: boolean;
  onClose: () => void;
  onAction: (action: TaskAction, comment?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onError: (message: string) => void;
};

export function TaskDialog({
  task,
  profile,
  history,
  busy,
  onClose,
  onAction,
  onEdit,
  onDelete,
  onError,
}: TaskDialogProps) {
  const isAssignedExecutor =
    profile.role === "executor" && task.assignee_id === profile.id;
  const canReview = profile.role === "manager" && task.status === "На проверке";
  const hasAction =
    canReview ||
    (isAssignedExecutor &&
      ["Новая", "На доработке", "В работе"].includes(task.status));

  const requestRevision = () => {
    const comment = window.prompt(
      "Комментарий с причиной доработки (обязательно):",
    );
    if (comment?.trim()) onAction("request_revision", comment.trim());
    else if (comment !== null) {
      onError("Укажите комментарий, чтобы вернуть задачу на доработку.");
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="task-modal">
        <header className="modal-head">
          <span className="eyebrow">КАРТОЧКА ЗАДАЧИ</span>
          <button onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className="modal-body">
          <span className={`status-badge ${statusClass[task.status]}`}>
            <i />
            {task.status}
          </span>
          <h2>{task.title}</h2>
          <p className="description">
            {task.description || "Описание не добавлено."}
          </p>

          <div className="detail-grid">
            <div>
              <small>ОБЪЕКТ</small>
              <b>{task.project?.name}</b>
            </div>
            <div>
              <small>ИСПОЛНИТЕЛЬ</small>
              <b>{task.assignee?.full_name}</b>
            </div>
            <div>
              <small>АВТОР</small>
              <b>{task.author?.full_name}</b>
            </div>
            <div>
              <small>СОЗДАНА</small>
              <b>{formatDate(task.created_at)}</b>
            </div>
          </div>

          <section className="history">
            <h3>История изменений</h3>
            {history.map((item) => (
              <div className="history-item" key={item.id}>
                <span className="history-line" />
                <div className="history-body">
                  <b>
                    {item.from_status
                      ? `${item.from_status} → ${item.to_status}`
                      : `Задача создана · ${item.to_status}`}
                  </b>
                  <p>
                    {item.actor?.full_name} · {formatDate(item.created_at)}
                  </p>
                  {item.comment && <blockquote>{item.comment}</blockquote>}
                </div>
              </div>
            ))}
          </section>
        </div>

        <footer className="modal-actions">
          {profile.role === "manager" && (
            <>
              <button className="secondary" disabled={busy} onClick={onEdit}>
                Изменить
              </button>
              <button
                className="danger-button"
                disabled={busy}
                onClick={onDelete}
              >
                Удалить
              </button>
            </>
          )}
          {isAssignedExecutor && task.status === "Новая" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => onAction("start")}
            >
              Взять в работу →
            </button>
          )}
          {isAssignedExecutor && task.status === "На доработке" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => onAction("return_to_work")}
            >
              Продолжить работу →
            </button>
          )}
          {isAssignedExecutor && task.status === "В работе" && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => onAction("submit")}
            >
              Отправить на проверку →
            </button>
          )}
          {canReview && (
            <>
              <button
                className="secondary"
                disabled={busy}
                onClick={requestRevision}
              >
                ↩ На доработку
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() => onAction("accept")}
              >
                Принять задачу ✓
              </button>
            </>
          )}
          {!hasAction && (
            <span className="no-actions">Нет доступных действий</span>
          )}
        </footer>
      </section>
    </div>
  );
}
