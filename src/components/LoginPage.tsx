import type { FormEvent } from "react";

type LoginPageProps = {
  busy: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginPage({ busy, error, onSubmit }: LoginPageProps) {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand">
          <span className="brand-mark">с</span>
          <span>
            строй<span className="brand-soft">контроль</span>
          </span>
        </div>

        <div className="login-copy">
          <div className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div>
          <h1>
            Всё под
            <br />
            контролем.
          </h1>
          <p>Объекты, задачи и понятный процесс — в одном месте.</p>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="name@company.ru"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              placeholder="Введите пароль"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primary full" disabled={busy}>
            {busy ? "Входим…" : "Войти в систему"} <span>→</span>
          </button>
          {error && (
            <p className="error login-error" role="alert">
              {error}
            </p>
          )}
        </form>

        <div className="login-foot">
          Доступ выдает руководитель · Регистрация закрыта
        </div>
      </section>

      <aside className="login-art">
        <div className="art-grid" />
        <div className="art-content">
          <div className="art-kicker">УПРАВЛЕНИЕ СТРОИТЕЛЬСТВОМ</div>
          <div className="art-title">
            Стройка
            <br />
            <i>идёт по плану.</i>
          </div>
          <div className="art-bottom">
            <span>01 — ПРОЗРАЧНОСТЬ</span>
            <span>02 — РЕЗУЛЬТАТ</span>
          </div>
        </div>
        <div className="art-circle circle-one" />
        <div className="art-circle circle-two" />
      </aside>
    </main>
  );
}
