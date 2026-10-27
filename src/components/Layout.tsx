import { NavLink, Outlet, useNavigate } from 'react-router';
import { APP_NAME, type Role } from '../core/models';
import { endSession, useSession } from '../core/session';
import { settings } from '../core/settings';

const NAV: Record<Role, { to: string; label: string; end?: boolean }[]> = {
  CUSTOMER: [
    { to: '/my/claims', label: 'My claims', end: true },
    { to: '/my/claims/new', label: 'Report a claim' },
    { to: '/my/policies', label: 'My policies' },
  ],
  EMPLOYEE: [
    { to: '/reviews', label: 'My reviews' },
    { to: '/claims', label: 'All claims' },
  ],
  MANAGER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/reviews', label: 'My reviews' },
    { to: '/claims', label: 'All claims' },
    { to: '/team', label: 'Team' },
    { to: '/history', label: 'History' },
  ],
};

export function Layout() {
  const session = useSession();
  const navigate = useNavigate();
  const user = session?.user;

  function signOut() {
    endSession();
    navigate('/login');
  }

  return (
    <>
      {user && (
        <header className="topbar">
          <div className="topbar-inner">
            <NavLink className="brand" to="/">
              <span className="logo logo-sm" aria-hidden="true">
                H
              </span>
              {APP_NAME}
            </NavLink>
            <nav>
              {NAV[user.role].map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="who">
              <div className="who-text">
                <strong>{user.name}</strong>
                <span className="muted">{user.role === 'CUSTOMER' ? 'Customer' : user.title}</span>
              </div>
              <button className="btn btn-sm" type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </header>
      )}

      {settings.useMockApi && (
        <div className="banner">
          Prototype with fictional data only. Not for real claims.
          <span className="banner-tag">Mock data</span>
        </div>
      )}

      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
