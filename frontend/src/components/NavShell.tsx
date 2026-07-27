import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthSession } from '../lib/AuthContext';
import { applyTheme, getStoredTheme } from '../lib/theme';
import type { Theme } from '../lib/theme';
import './NavShell.css';

const TABS = [
  { to: '/exam', label: 'Take exam' },
  { to: '/history', label: 'History' },
  { to: '/weak-areas', label: 'Weak areas' },
];

export function NavShell() {
  const session = useAuthSession();
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  function toggleTheme() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className="nav-shell">
      <header className="nav-shell__header">
        <span className="nav-shell__brand">Architect &middot; Foundations</span>
        <nav className="nav-shell__tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `nav-shell__tab${isActive ? ' nav-shell__tab--active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-shell__account">
          <button type="button" className="nav-shell__theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <span className="nav-shell__email">{session.user.email}</span>
          <button type="button" className="nav-shell__signout" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="nav-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
