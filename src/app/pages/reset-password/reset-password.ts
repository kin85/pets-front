import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  readonly passwordMinLength = 8;

  token = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  success = false;
  error = '';
  message = '';
  year = new Date().getFullYear();

  get isConfirmationMode(): boolean {
    return !!this.token;
  }

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  }

  submitRequest(): void {
    if (!this.email || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth
      .requestPasswordReset(this.email)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.success = true;
          this.message = 'Si el correo existe, te hemos enviado un enlace para restablecer la contraseña.';
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudo solicitar el cambio de contraseña');
        },
      });
  }

  submitReset(): void {
    if (this.loading) {
      return;
    }

    this.error = '';

    if (this.password.length < this.passwordMinLength) {
      this.error = `La contraseña debe tener al menos ${this.passwordMinLength} caracteres`;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;

    this.auth
      .resetPassword(this.token, this.password)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.success = true;
          this.message = 'Contraseña actualizada. Ya puedes iniciar sesion con la nueva clave.';
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudo restablecer la contraseña');
        },
      });
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err !== null) {
      const httpError = err as { error?: unknown };

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
    }

    return fallback;
  }
}
