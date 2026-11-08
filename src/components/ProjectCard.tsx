import type { Project } from "../types";

type ProjectCardProps = {
  project: Project;
  index: number;
  taskCount: number;
  inProgressCount: number;
  acceptedCount: number;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ProjectCard({
  project,
  index,
  taskCount,
  inProgressCount,
  acceptedCount,
  canManage,
  onOpen,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const completion = taskCount
    ? Math.round((acceptedCount / taskCount) * 100)
    : 0;

  return (
    <article className="project-card">
      <button className="project-card-open" onClick={onOpen}>
        <div className={`project-art art-${index % 3}`}>
          <span className="art-no">
            ОБЪЕКТ — {(index + 1).toString().padStart(2, "0")}
          </span>
          <span className="project-arrow">↗</span>
          <div className="building-lines">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="project-info">
          <div className="project-title">
            <h3>{project.name}</h3>
            <span className="tiny-dot" />
          </div>
          <p>⌖ &nbsp;{project.address}</p>
          <div className="project-meta">
            <span>
              ЗАДАЧИ <b>{taskCount}</b>
            </span>
            <span>
              В РАБОТЕ <b>{inProgressCount}</b>
            </span>
          </div>
          <div className="progress">
            <i style={{ width: `${completion}%` }} />
          </div>
        </div>
      </button>
      {canManage && (
        <div className="project-card-actions">
          <button onClick={onEdit}>Изменить</button>
          <button className="danger-link" onClick={onDelete}>
            Удалить
          </button>
        </div>
      )}
    </article>
  );
}
