import type { FormEvent } from "react";

type ProjectFormDialogProps = {
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProjectFormDialog({
  busy,
  onClose,
  onSubmit,
}: ProjectFormDialogProps) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="task-modal project-form-dialog">
        <header className="modal-head">
          <span className="eyebrow">НОВАЯ ПЛОЩАДКА</span>
          <button onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <div className="modal-body">
          <h2>Добавить объект</h2>
          <p className="description">
            Укажите название и адрес строительной площадки.
          </p>
          <form id="project-form" className="dialog-form" onSubmit={onSubmit}>
            <label>
              Название объекта
              <input
                name="name"
                placeholder="Например, ЖК Северный"
                required
                autoFocus
              />
            </label>
            <label>
              Адрес
              <input name="address" placeholder="Город, улица, дом" required />
            </label>
          </form>
        </div>
        <footer className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Отмена
          </button>
          <button
            type="submit"
            form="project-form"
            className="primary"
            disabled={busy}
          >
            {busy ? "Создаём…" : "Создать объект"}
          </button>
        </footer>
      </section>
    </div>
  );
}
