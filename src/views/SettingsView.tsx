import { ACCENT_SWATCHES } from '../data/seed';
import { usePos } from '../store/PosContext';
import { ImageSlot } from '../components/ui/ImageSlot';
import { Toggle } from '../components/ui/primitives';
import type { FeatureKey, StoreSettings } from '../types';

const FEATURE_KEYS: FeatureKey[] = ['inventory', 'dashboard', 'payments', 'loyalty', 'multiBranch'];

export function SettingsView() {
  const pos = usePos();
  const { t } = pos;
  const canEdit = pos.hasPerm('settings');
  const form = pos.settingsDraft ?? pos.storeSettings;
  const dirty = pos.settingsDraft !== null;

  const patchForm = (p: Partial<StoreSettings>) => {
    if (!canEdit) return;
    // storeSettings comes from the merged query data (pos.storeSettings),
    // not the raw PosState the `set` updater's `s` parameter reflects — read
    // it from the closure, not from `s`.
    pos.set((s) => ({ settingsDraft: { ...(s.settingsDraft ?? pos.storeSettings), ...p } }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <section className="card card--pad-lg">
        <h2 className="card-title" style={{ margin: 0, marginBottom: 16 }}>
          {t.storeInfo}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="field-label">{t.storeLogo}</div>
            <div style={{ width: 64, height: 64, background: 'var(--bg-chip)', borderRadius: 12 }}>
              <ImageSlot id="store-logo" shape="rounded" radius={12} placeholder="Logo" fontSize={12} />
            </div>
          </div>

          <label>
            <span className="field-label" style={{ display: 'block' }}>
              {t.storeName}
            </span>
            <input className="input" value={form.name} disabled={!canEdit} onChange={(e) => patchForm({ name: e.target.value })} />
          </label>

          <label>
            <span className="field-label" style={{ display: 'block' }}>
              {t.businessType}
            </span>
            <input
              className="input"
              value={form.businessType}
              disabled={!canEdit}
              onChange={(e) => patchForm({ businessType: e.target.value })}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>
              <span className="field-label" style={{ display: 'block' }}>
                {t.currency}
              </span>
              <select
                className="input"
                value={form.currency}
                disabled={!canEdit}
                onChange={(e) => patchForm({ currency: e.target.value as StoreSettings['currency'] })}
              >
                <option value="THB">บาทไทย (THB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </label>
            <label>
              <span className="field-label" style={{ display: 'block' }}>
                {t.taxRate}
              </span>
              <input
                className="input"
                type="number"
                value={form.taxRate}
                disabled={!canEdit}
                onChange={(e) => patchForm({ taxRate: Number(e.target.value) })}
              />
            </label>
          </div>

          <div>
            <div className="field-label">{t.themeColor}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {ACCENT_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={pos.accent === color}
                  disabled={!canEdit}
                  onClick={() => pos.setAccent(color)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: color,
                    border: pos.accent === color ? '3px solid var(--text)' : '1px solid var(--border-strong)',
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {!canEdit && (
            <div style={{ fontSize: 11.5, color: 'var(--warn)', background: 'var(--warn-bg)', padding: '9px 12px', borderRadius: 8 }}>
              {t.noPermSettings}
            </div>
          )}

          {dirty && (
            <button type="button" className="btn btn--primary btn--block" style={{ padding: 12, borderRadius: 10, fontSize: 13 }} onClick={pos.saveSettings}>
              {t.save}
            </button>
          )}
        </div>
      </section>

      <section className="card card--pad-lg">
        <h2 className="card-title" style={{ margin: 0, marginBottom: 4 }}>
          {t.modules}
        </h2>
        <p className="card-sub" style={{ margin: 0, marginBottom: 16 }}>
          {t.modulesDesc}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FEATURE_KEYS.map((key, i) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'var(--bg-muted)',
                borderRadius: 10,
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{t.features[i][0]}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{t.features[i][1]}</div>
              </div>
              <Toggle on={pos.featureFlags[key]} label={t.features[i][0]} onToggle={() => pos.toggleFeature(key)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
