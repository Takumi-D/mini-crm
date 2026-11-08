import { ProjectCard } from "./ProjectCard";
import type { Profile, Project, Task } from "../types";

type ProjectsPageProps = {
  projects: Project[];
  tasks: Task[];
  role: Profile["role"];
  onCreateProject: () => void;
  onOpenProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
};

export function ProjectsPage({
  projects,
  tasks,
  role,
  onCreateProject,
  onOpenProject,
  onEditProject,
  onDeleteProject,
}: ProjectsPageProps) {
  const reviewCount = tasks.filter(
    (task) => task.status === "На проверке",
  ).length;
  const activeTaskCount = tasks.filter(
    (task) => task.status !== "Принята",
  ).length;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ОБЗОР ПРОЕКТОВ</div>
          <h1>
            Объекты
            <span className="heading-count">
              {projects.length.toString().padStart(2, "0")}
            </span>
          </h1>
          <p>Ваши строительные площадки и текущие задачи.</p>
        </div>
        {role === "manager" && (
          <button className="primary" onClick={onCreateProject}>
            ＋ Новый объект
          </button>
        )}
      </div>

      <div className="stats">
        <StatCard
          label="ВСЕ ОБЪЕКТЫ"
          value={projects.length}
          caption="В рабочем пространстве"
        />
        <StatCard
          label="АКТИВНЫЕ ЗАДАЧИ"
          value={activeTaskCount}
          caption="Требуют внимания"
        />
        <StatCard
          label="НА ПРОВЕРКЕ"
          value={reviewCount}
          caption="Ожидают решения"
        />
      </div>

      <div className="section-head">
        <div>
          <h2>Все объекты</h2>
          <span>{projects.length} площадки</span>
        </div>
        <span className="subtle">ОБНОВЛЕНО ТОЛЬКО ЧТО</span>
      </div>

      <div className="project-grid">
        {projects.map((project, index) => {
          const projectTasks = tasks.filter(
            (task) => task.project_id === project.id,
          );
          return (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              taskCount={projectTasks.length}
              inProgressCount={
                projectTasks.filter((task) => task.status === "В работе").length
              }
              acceptedCount={
                projectTasks.filter((task) => task.status === "Принята").length
              }
              canManage={role === "manager"}
              onOpen={() => onOpenProject(project)}
              onEdit={() => onEditProject(project)}
              onDelete={() => onDeleteProject(project)}
            />
          );
        })}
        {projects.length === 0 && (
          <div className="empty">
            <span>▦</span>
            <h3>Пока нет объектов</h3>
            <p>Создайте первый объект, чтобы начать работу.</p>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <b>{value.toString().padStart(2, "0")}</b>
      <small>{caption}</small>
    </div>
  );
}
