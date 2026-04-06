import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';
import {
  OwnerProfileResponse,
  OwnerService,
  UpdateOwnerProfileRequest,
} from '../../services/owner.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value ?? '';
  const confirmPassword = control.get('confirmPassword')?.value ?? '';

  if (!password && !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OwnerShell],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  loading = true;
  saving = false;
  error = '';
  success = '';
  private currentProfile: OwnerProfileResponse | null = null;

  readonly form;

  constructor(
    private ownerService: OwnerService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group(
      {
        username: [{ value: '', disabled: true }],
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required, Validators.minLength(2)]],
        address: ['', [Validators.required, Validators.minLength(5)]],
        phone: ['', [Validators.required, Validators.minLength(5)]],
        password: ['', [Validators.minLength(6)]],
        confirmPassword: [''],
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  submit(): void {
    this.error = '';
    this.success = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const { email, name, address, phone, password } = this.form.getRawValue();
    const body: UpdateOwnerProfileRequest = {
      email: email!,
      name: name!,
      address: address!,
      phone: phone!,
      ...(password ? { password } : {}),
    };

    this.saving = true;
    this.cdr.detectChanges();

    this.ownerService
      .updateMyProfile(body)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (profile) => {
          this.success = 'Perfil actualizado correctamente.';
          this.applyProfile(profile);
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err?.status === 401) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
            return;
          }
          this.error = this.getErrorMessage(err, 'No se pudo actualizar el perfil');
          this.cdr.detectChanges();
        },
      });
  }

  resetForm(): void {
    if (!this.currentProfile) {
      return;
    }

    this.error = '';
    this.success = '';
    this.applyProfile(this.currentProfile);
  }

  private loadProfile(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.ownerService
      .getMyProfile()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err?.status === 401) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
            return;
          }
          this.error = this.getErrorMessage(err, 'No se pudo cargar el perfil');
          this.cdr.detectChanges();
        },
      });
  }

  private applyProfile(profile: OwnerProfileResponse): void {
    this.currentProfile = profile;
    this.form.reset({
      username: profile.username,
      email: profile.email,
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      password: '',
      confirmPassword: '',
    });
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err !== null) {
      const httpError = err as { error?: unknown };

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

      if (typeof httpError.error === 'string' && httpError.error.trim()) {
        return httpError.error;
      }
    }

    return fallback;
  }
}
