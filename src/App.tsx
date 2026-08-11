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

  return pos.currentUser ? <Shell /> : <Login />;
}

export function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />;

  return (
    <PosProvider>
      <Root />
    </PosProvider>
  );
}
