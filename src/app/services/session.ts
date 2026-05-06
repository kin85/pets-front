import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenKey = 'token';

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clear(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const payload = this.getPayload(token);
    if (!payload) {
      return true;
    }

    const exp = payload['exp'];
    if (typeof exp !== 'number') {
      return true;
    }

    return Date.now() < exp * 1000;
  }

  getRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }

    const payload = this.getPayload(token);
    const roles = payload?.['roles'];
    return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : [];
  }

  hasRole(role: string): boolean {
    const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return this.getRoles().includes(normalizedRole);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  getDefaultRoute(): string {
    return this.isAdmin() ? '/admin' : '/home';
  }

  private getPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='));
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
