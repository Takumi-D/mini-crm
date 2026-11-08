type StatusMessagesProps = {
  error: string;
  notice: string;
  onDismissError: () => void;
  onDismissNotice: () => void;
};

export function StatusMessages({
  error,
  notice,
  onDismissError,
  onDismissNotice,
}: StatusMessagesProps) {
  return (
    <>
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button
            onClick={onDismissError}
            aria-label="Закрыть сообщение об ошибке"
          >
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="alert success" role="status">
          {notice}
          <button onClick={onDismissNotice} aria-label="Закрыть уведомление">
            ×
          </button>
        </div>
      )}
    </>
  );
}
