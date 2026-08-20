import { useEffect } from 'react';
import { Login } from './components/Login';
import { SetupNeeded } from './components/SetupNeeded';
import { Shell } from './components/Shell';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { PosProvider, usePos } from './store/PosContext';

function Root() {
  const pos = usePos();

  // The accent is a runtime theme choice, so it lives on the document root
  // rather than being threaded through every component's inline styles.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', pos.accent);
  }, [pos.accent]);

  useEffect(() => {
    document.documentElement.lang = pos.lang;
  }, [pos.lang]);

  // Avoid flashing the login screen while the initial Supabase session check
  // (whether a saved session exists) is still in flight.
  if (pos.authLoading) return null;
  if (!pos.currentUser) return <Login />;

  // Once signed in, wait for the first load of master data (products,
  // materials, roles, ...) so the sidebar/permissions don't flash an
  // empty/wrong state before the queries resolve.
  if (pos.dataLoading) return null;

  return <Shell />;
}

export function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />;

  return (
    <PosProvider>
      <Root />
    </PosProvider>
  );
}
