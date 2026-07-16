import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthCallback {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const token = new URLSearchParams(window.location.search).get('token');

    if (token) {
      window.history.replaceState({}, document.title, '/login');
    }

    if (!token) {
      this.authService.logout();
      return;
    }

    this.authService.startSession(token).subscribe({
      next: (user) => {
        console.log('Sesión validada:', user);
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        console.error('Error validando sesión:', error);
        //this.authService.logout();
      },
    });
  }
}
