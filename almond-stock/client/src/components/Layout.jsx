import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { MetaProvider } from '../meta.jsx';
import { fmtDate, today } from '../utils.js';
import Logo from './Logo.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/auth/meta')
      .then(setMeta)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <Logo />
          <h1>Almond Stock</h1>
        </div>
        <div className="who">
          <span className="date-label num">
            {fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="user-chip">
            {user.name} <span className="role">({user.role})</span>
          </span>
          <button className="btn sm" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Sections">
        <NavLink to="/" end>Stock overview</NavLink>
        <NavLink to="/production">Daily production</NavLink>
        <NavLink to="/sales">Sales</NavLink>
        <NavLink to="/report">Day-wise report</NavLink>
        {user.role === 'admin' && <NavLink to="/users">Users</NavLink>}
      </nav>

      {error && <p className="err">{error}</p>}
      {!meta && !error && <p className="sub">Loading…</p>}
      {meta && (
        <MetaProvider value={meta}>
          <Outlet />
        </MetaProvider>
      )}
    </div>
  );
}
