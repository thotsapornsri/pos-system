/**
 * Shown instead of the app when `.env` has no Supabase project configured
 * yet. Deliberately outside PosProvider (no i18n context available there),
 * so this is a small hardcoded bilingual one-off rather than routed through
 * src/i18n/translations.ts.
 */
export function SetupNeeded() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1a22',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 20,
          padding: 36,
          boxShadow: '0 30px 80px rgba(0,0,0,.4)',
          fontFamily: "'Plus Jakarta Sans', 'Noto Sans Thai', sans-serif",
          color: '#15151f',
        }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 6 }}>
          Supabase setup needed / ต้องตั้งค่า Supabase ก่อน
        </div>
        <p style={{ fontSize: 13, color: '#6b6b7b', marginBottom: 20 }}>
          This app needs a Supabase project to sign in and store data.
          <br />
          แอปนี้ต้องเชื่อมต่อกับโปรเจกต์ Supabase ก่อนจึงจะเข้าสู่ระบบและใช้งานได้
        </p>
        <ol style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, marginBottom: 20 }}>
          <li>
            Create a free project at{' '}
            <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#10b981' }}>
              supabase.com
            </a>{' '}
            (สมัครโปรเจกต์ฟรีที่ supabase.com)
          </li>
          <li>
            Run <code>supabase/migrations/0001_auth.sql</code> then <code>supabase/seed.sql</code> in the Supabase
            SQL editor (รันไฟล์ SQL ทั้งสองไฟล์ใน SQL editor ของ Supabase)
          </li>
          <li>
            Copy <code>.env.example</code> to <code>.env</code> and fill in your Project URL + anon key from Project
            Settings → API (คัดลอก .env.example เป็น .env แล้วกรอกค่าจากหน้า Project Settings → API)
          </li>
          <li>Restart the dev server / รีสตาร์ท dev server</li>
        </ol>
      </div>
    </div>
  );
}
