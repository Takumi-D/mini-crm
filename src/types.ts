export type Role = "manager" | "executor";
export type Status =
  "Новая" | "В работе" | "На проверке" | "Принята" | "На доработке";
export type TaskAction =
  "start" | "submit" | "return_to_work" | "accept" | "request_revision";

export type Profile = { id: string; full_name: string; role: Role };
export type Project = { id: string; name: string; address: string };
export type Task = {
  id: string;
  title: string;
  description: string;
  project_id: string;
  assignee_id: string;
  author_id: string;
  status: Status;
  created_at: string;
  project?: Project;
  assignee?: Profile;
  author?: Profile;
};
export type History = {
  id: string;
  from_status: Status | null;
  to_status: Status;
  comment: string | null;
  created_at: string;
  actor?: Profile;
};
