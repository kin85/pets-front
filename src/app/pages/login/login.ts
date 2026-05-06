import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';
import { SessionService } from '../../services/session';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username = '';
  password = '';

  loading = false;
  error = '';

  year = new Date().getFullYear();

  constructor(
    private auth: AuthService,
    private router: Router,
    private session: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  submit(): void {
    if (this.loading) {
      return;
    }

    this.error = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.auth
      .login({ username: this.username, password: this.password })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.error = '';

          this.session.saveToken(res.token);

          this.router.navigate([res.roles.includes('ROLE_ADMIN') ? '/admin' : '/home']);
        },
        error: (err) => {
          this.error = this.getErrorMessage(err);
          this.cdr.detectChanges();
        },
      });
  }

  private getErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null) {
      const httpError = err as { status?: number; error?: unknown };

      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }

      if (
        typeof httpError.error === 'object' &&
        httpError.error !== null &&
        'message' in httpError.error
      ) {
        const message = (httpError.error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }

      if (httpError.status === 401) {
        return 'Usuario o contraseña incorrectos';
      }
    }

    return 'No se pudo iniciar sesion. Revisa el usuario y la contraseña.';
  }
}
