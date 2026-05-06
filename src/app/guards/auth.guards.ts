import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session';

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  return session.isAuthenticated() ? router.parseUrl(session.getDefaultRoute()) : true;
};

export const ownerGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  return session.isAdmin() ? router.parseUrl('/admin') : true;
};

export const adminGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  return session.isAdmin() ? true : router.parseUrl('/home');
};
