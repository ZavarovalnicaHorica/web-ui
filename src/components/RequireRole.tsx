import { Navigate, Outlet } from 'react-router';
import type { Role, User } from '../core/models';
import { useSession } from '../core/session';

/** First page after signing in. */
export function homeFor(user: User): string {
  if (user.role === 'CUSTOMER') return '/my/claims';
  if (user.role === 'MANAGER') return '/dashboard';
  return '/reviews';
}

/** Shows the nested routes only to signed-in users with one of these roles. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useSession()?.user;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}

/** "/" goes to the user's home page, or to login. */
export function HomeRedirect() {
  const user = useSession()?.user;
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
}
