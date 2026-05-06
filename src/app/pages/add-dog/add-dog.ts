import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DogService } from '../../services/dog.service';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE_MESSAGE = 'La imagen supera el tamano maximo permitido de 5 MB.';

@Component({
  selector: 'app-add-dog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OwnerShell],
  templateUrl: './add-dog.html',
  styleUrl: './add-dog.scss',
})
export class AddDog {
  loading = false;
  error = '';
  photoError = '';
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    breed: ['', [Validators.required, Validators.minLength(2)]],
    birthDate: ['', [Validators.required]],
    microchip: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor(
    private dogService: DogService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.error = '';
    this.photoError = '';
    this.selectedFile = null;

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }

    if (!file) {
      this.cdr.detectChanges();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      input.value = '';
      this.photoError = MAX_IMAGE_SIZE_MESSAGE;
      this.cdr.detectChanges();
      return;
    }

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();
  }

  submit(): void {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const { name, breed, birthDate, microchip } = this.form.getRawValue();

    const fd = new FormData();
    fd.append('name', name!);
    fd.append('breed', breed!);
    fd.append('birthDate', birthDate!);
    fd.append('microchip', microchip!);

    if (this.selectedFile) {
      fd.append('photo', this.selectedFile, this.selectedFile.name);
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.dogService.createDog(fd).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          return;
        }
        this.error = this.getErrorMessage(err, 'No se pudo crear el perro');
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/home']);
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err !== null) {
      const httpError = err as { error?: unknown; status?: number };
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
      if (httpError.status === 413) {
        return MAX_IMAGE_SIZE_MESSAGE;
      }
    }
    return fallback;
  }
}
