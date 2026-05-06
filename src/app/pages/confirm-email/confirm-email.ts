import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
})
export class ConfirmEmail implements OnInit {
  email = '';
  token = '';
  loading = false;
  resending = false;
  error = '';
  message = '';
  status: 'pending' | 'success' | 'error' = 'pending';
  year = new Date().getFullYear();

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    this.email = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';

    if (this.token) {
      this.confirm();
      return;
    }

    this.message = this.email
      ? `Te hemos enviado un correo de confirmacion a ${this.email}.`
      : 'Introduce tu correo para recibir un nuevo enlace de confirmacion.';
  }

  resend(): void {
    if (!this.email || this.resending) {
      return;
    }

    this.resending = true;
    this.error = '';

    this.auth
      .resendConfirmationEmail(this.email)
      .pipe(
        finalize(() => {
          this.resending = false;
        })
      )
      .subscribe({
        next: () => {
          this.status = 'pending';
          this.message = 'Si el correo existe y aun no esta confirmado, te hemos enviado un nuevo enlace.';
        },
        error: (err) => {
          this.status = 'error';
          this.error = this.getErrorMessage(err, 'No se pudo reenviar el correo de confirmacion');
        },
      });
  }

  private confirm(): void {
    this.loading = true;
    this.error = '';

    this.auth
      .confirmEmail(this.token)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.status = 'success';
          this.message = 'Correo confirmado. Ya puedes iniciar sesion.';
        },
        error: (err) => {
          this.status = 'error';
          this.error = this.getErrorMessage(err, 'No se pudo confirmar el correo');
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
