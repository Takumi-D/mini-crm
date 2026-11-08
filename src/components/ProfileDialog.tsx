import type { Profile } from "../types";

type ProfileDialogProps = {
  profile: Profile;
  email: string;
  onClose: () => void;
  onSignOut: () => void;
};

export function ProfileDialog({
  profile,
  email,
  onClose,
  onSignOut,
}: ProfileDialogProps) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="task-modal profile-dialog">
        <header className="modal-head">
          <span className="eyebrow">ВАШ АККАУНТ</span>
          <button onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <div className="modal-body">
          <div className="profile-large-avatar">
            {profile.full_name.slice(0, 1).toUpperCase()}
          </div>
          <h2>{profile.full_name}</h2>
          <p className="description">Профиль пользователя Стройконтроль</p>
          <div className="detail-grid profile-details">
            <div>
              <small>EMAIL</small>
              <b>{email}</b>
            </div>
            <div>
              <small>РОЛЬ</small>
              <b>
                {profile.role === "manager" ? "Постановщик" : "Исполнитель"}
              </b>
            </div>
          </div>
        </div>
        <footer className="modal-actions">
          <button className="secondary" onClick={onClose}>
            Закрыть
          </button>
          <button className="danger-button signout-action" onClick={onSignOut}>
            ↗ &nbsp;Выйти из приложения
          </button>
        </footer>
      </section>
    </div>
  );
}
