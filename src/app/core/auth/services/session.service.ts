import { computed, Injectable, signal } from '@angular/core';
import { AuthUser } from '../interfaces/auth-user';
import { Role } from '../interfaces/role';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly tokenKey = environment.storage.tokenKey;
  private readonly userKey = environment.storage.userKey;

  private readonly _token = signal<string | null>(this.loadToken());
  private readonly _currentUser = signal<AuthUser | null>(this.loadUser());

  readonly token = this._token.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = computed(() => {
    return !!this._token() && !!this._currentUser();
  });

  readonly fullName = computed(() => {
    return this._currentUser()?.nombreCompleto ?? '';
  });

  readonly roles = computed(() => {
    return this._currentUser()?.roles ?? [];
  });

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this._token.set(token);
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this._currentUser.set(user);
  }

  hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this._token.set(null);
    this._currentUser.set(null);
  }

  private loadToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private loadUser(): AuthUser | null {
    const user = localStorage.getItem(this.userKey);

    if (!user) return null;

    try {
      return JSON.parse(user) as AuthUser;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
