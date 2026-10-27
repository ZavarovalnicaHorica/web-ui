import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { homeFor } from '../components/RequireRole';
import { api } from '../core/client';
import { DEMO_PASSWORD, USERS } from '../core/mock/mock-data';
import { APP_NAME } from '../core/models';
import { startSession, useSession } from '../core/session';
import { settings } from '../core/settings';
import { errorText } from '../core/use-async';

export function Login() {
  const session = useSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (session) return <Navigate to={homeFor(session.user)} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const s = await api.login(username, password);
      startSession(s);
      navigate(homeFor(s.user), { replace: true });
    } catch (err) {
      setError(errorText(err, 'Sign in failed.'));
      setBusy(false);
    }
  }

  function pick(name: string) {
    setUsername(name);
    setPassword(DEMO_PASSWORD);
  }

  const customers = USERS.filter((u) => u.role === 'CUSTOMER');
  const staff = USERS.filter((u) => u.role !== 'CUSTOMER');

  return (
    <div className="login">
      <div className="login-brand">
        <span className="logo" aria-hidden="true">
          H
        </span>
        <h1>{APP_NAME}</h1>
        <p className="muted">Report damage, follow your claim, and for staff: review claims</p>
      </div>

      <form className="card form" onSubmit={submit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {!settings.useMockApi && (
          <p className="muted small">In production this page hands over to Keycloak (OpenID Connect).</p>
        )}
      </form>

      {settings.useMockApi && (
        <aside className="card demo">
          <strong>Demo accounts</strong> (mock mode only, fictional people)
          <p className="muted">
            Password for every account: <code>{DEMO_PASSWORD}</code>. Click a name to fill in the form.
          </p>
          <div className="demo-cols">
            <div>
              <h3>Customers</h3>
              <ul>
                {customers.map((u) => (
                  <li key={u.id}>
                    <button type="button" className="link" onClick={() => pick(u.username)}>
                      {u.username}
                    </button>{' '}
                    · {u.name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Staff</h3>
              <ul>
                {staff.map((u) => (
                  <li key={u.id}>
                    <button type="button" className="link" onClick={() => pick(u.username)}>
                      {u.username}
                    </button>{' '}
                    · {u.name}
                    {u.role === 'MANAGER' && <span className="badge badge-neutral">Manager</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
