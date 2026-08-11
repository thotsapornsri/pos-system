import { usePos } from '../store/PosContext';
import { ImageSlot } from './ui/ImageSlot';

export function Login() {
  const pos = usePos();
  const { t } = pos;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 20% 20%, #1c2e3a 0%, #0f1a22 60%)',
        padding: 20,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pos.login();
        }}
        style={{
          width: 420,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 20,
          padding: 36,
          boxShadow: '0 30px 80px rgba(0,0,0,.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
          <div style={{ width: 38, height: 38 }}>
            <ImageSlot id="store-logo" shape="rounded" radius={10} placeholder="Logo" fontSize={10} />
          </div>
          <div>
            <div className="display" style={{ fontSize: 16 }}>
              {pos.storeSettings.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{t.tagline}</div>
          </div>
        </div>

        <h1 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>
          {t.loginTitle}
        </h1>
        <p style={{ fontSize: 12.5, color: '#8a8a9a', margin: 0, marginBottom: 22 }}>{t.loginSubtitle}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 10 }}>
          <label style={{ display: 'block' }}>
            <span className="field-label" style={{ display: 'block' }}>
              {t.username}
            </span>
            <input
              className="input"
              type="email"
              autoComplete="username"
              required
              disabled={pos.loginBusy}
              value={pos.loginEmail}
              onChange={(e) => pos.set({ loginEmail: e.target.value, loginError: false })}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span className="field-label" style={{ display: 'block' }}>
              {t.password}
            </span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              disabled={pos.loginBusy}
              value={pos.loginPassword}
              onChange={(e) => pos.set({ loginPassword: e.target.value, loginError: false })}
            />
          </label>
        </div>

        {pos.loginError ? (
          <div
            role="alert"
            style={{
              fontSize: 11.5,
              color: 'var(--danger)',
              background: 'var(--danger-bg)',
              padding: '9px 12px',
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            {t.loginFailed}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 20 }}>{t.loginHint}</div>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={pos.loginBusy}>
          {pos.loginBusy ? t.loginBusy : t.loginButton}
        </button>
      </form>
    </div>
  );
}
