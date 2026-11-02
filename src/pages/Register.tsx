import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { homeFor } from '../components/RequireRole';
import { ApiError } from '../core/api';
import { api } from '../core/client';
import { APP_NAME, PASSWORD_RULES } from '../core/models';
import { startSession, useSession } from '../core/session';
import { errorText } from '../core/use-async';

type FieldErrors = { email?: string; password?: string; confirm?: string };

/**
 * Create a customer account, then sign in with it straight away.
 * Calls auth-service: POST /auth/register, then POST /auth/login and GET /auth/me.
 */
export function Register() {
  const session = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');

  if (session) return <Navigate to={homeFor(session.user)} replace />;

  /** Checks done in the browser, so the user does not wait for the server for simple mistakes. */
  function check(): FieldErrors {
    const errors: FieldErrors = {};
    if (password.length < PASSWORD_RULES.min || password.length > PASSWORD_RULES.max) {
      errors.password = `Use ${PASSWORD_RULES.min} to ${PASSWORD_RULES.max} characters.`;
    }
    if (confirm !== password) errors.confirm = 'Passwords do not match.';
    return errors;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const errors = check();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    try {
      await api.register(email, password);
      const s = await api.login(email, password);
      startSession(s);
      navigate(homeFor(s.user), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ email: 'An account with this email already exists.' });
      } else if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        // 400 from auth-service: { errors: { email: "...", password: "..." } }
        setFieldErrors({ email: err.fieldErrors.email, password: err.fieldErrors.password });
      } else {
        setError(errorText(err, 'Could not create the account.'));
      }
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-brand">
        <span className="logo" aria-hidden="true">
          H
        </span>
        <h1>Create an account</h1>
        <p className="muted">{APP_NAME}: report damage and follow your claims</p>
      </div>

      <form className="card form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
            required
          />
          {fieldErrors.email && <span className="hint error">{fieldErrors.email}</span>}
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.password}
            required
          />
          <span className={`hint${fieldErrors.password ? ' error' : ''}`}>
            {fieldErrors.password ?? `${PASSWORD_RULES.min} to ${PASSWORD_RULES.max} characters.`}
          </span>
        </label>
        <label>
          Repeat password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.confirm}
            required
          />
          {fieldErrors.confirm && <span className="hint error">{fieldErrors.confirm}</span>}
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="muted small">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
