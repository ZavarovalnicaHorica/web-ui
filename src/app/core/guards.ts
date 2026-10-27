import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session';

/** Only logged-in users. */
export const authGuard: CanActivateFn = () =>
  inject(SessionStore).isLoggedIn() || inject(Router).createUrlTree(['/login']);

/** Only managers. Employees are sent to their reviews. */
export const managerGuard: CanActivateFn = () =>
  inject(SessionStore).isManager() || inject(Router).createUrlTree(['/reviews']);

/** Login page only when logged out. */
export const guestGuard: CanActivateFn = () =>
  !inject(SessionStore).isLoggedIn() || inject(Router).createUrlTree(['/']);

/** Where "/" goes after login. */
export const homeRedirect = () => (inject(SessionStore).isManager() ? 'dashboard' : 'reviews');

/** Sends the login token to the services. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessionStore).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
