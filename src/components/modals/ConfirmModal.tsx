import { usePos } from '../../store/PosContext';

export function ConfirmModal() {
  const pos = usePos();
  const { t, confirmAction } = pos;
  if (!confirmAction) return null;

  return (
    <div className="overlay overlay--dark" style={{ zIndex: 70 }} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal modal--confirm">
        <h2 id="confirm-title" className="display" style={{ fontSize: 16, margin: 0, marginBottom: 8 }}>
          {t.confirmTitle}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginBottom: 20, lineHeight: 1.5 }}>
          {confirmAction.message}
        </p>
        <div className="modal__actions">
          <button type="button" className="btn btn--neutral" onClick={pos.confirmNo}>
            {t.cancel}
          </button>
          <button type="button" className="btn btn--primary" onClick={pos.confirmYes} autoFocus>
            {t.confirmYes}
          </button>
        </div>
      </div>
    </div>
  );
}
