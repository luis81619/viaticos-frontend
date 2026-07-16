import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SessionService } from './session.service';
import { environment } from '../../../../environments/environments';
import { AuthUser } from '../interfaces/auth-user';
import { map, Observable, tap } from 'rxjs';
import { Role } from '../interfaces/role';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  validateSession(): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${environment.global.apiUrl}/auth/check`, {}).pipe(
      map((user) => this.mapGlobalUserToAuthUser(user)),
      tap((authUser) => {
        this.session.setUser(authUser);
      })
    );
  }

  private mapGlobalUserToAuthUser(user: any): AuthUser {
    return {
      userId: user.user_id,
      nombres: user.nombres,
      apellidoPaterno: user.apell_Paterno,
      apellidoMaterno: user.apell_Materno,
      nombreCompleto: `${user.nombres} ${user.apell_Paterno} ${user.apell_Materno}`.trim(),
      email: user.email,
      numeroTrabajador: String(user.numeroTrabajador ?? ''),
      roles: user.roles,
      plantel: {
        id: user.plantel?.plantel_id,
        nombre: user.plantel?.plantel_nombre,
        cct: user.plantel?.cct,
        clave: user.plantel?.clave,
        tipo: user.plantel?.tipo,
      },
    };
  }

  startSession(token: string): Observable<AuthUser> {
    this.session.setToken(token);

    return this.validateSession();
  }

  //CERRAR SESION
  logout(): void {
    this.session.clearSession();
    window.location.href = environment.global.loginRedirect;
  }

  hasAccess(): boolean {
    return this.session.hasRole(Role.ACCESO);
  }
}
