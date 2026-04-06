import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';
import { VeterinaryService, VeterinaryViewDto } from '../../services/veterinary.service';

@Component({
  selector: 'app-veterinarians',
  standalone: true,
  imports: [CommonModule, OwnerShell],
  templateUrl: './veterinarians.html',
  styleUrl: './veterinarians.scss',
})
export class Veterinarians implements OnInit {
  loading = true;
  error = '';
  veterinaries: VeterinaryViewDto[] = [];

  constructor(
    private veterinaryService: VeterinaryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = '';

    this.veterinaryService.getAll().subscribe({
      next: (res) => {
        this.veterinaries = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'No se pudieron cargar los veterinarios');
        this.cdr.detectChanges();
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
