import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  VaccineDogDto,
  VaccineOverviewDto,
  VaccineService,
  VaccineSummaryItemDto,
} from '../../../services/vaccine.service';

type VaccineCard = VaccineSummaryItemDto;

@Component({
  selector: 'app-dog-vaccines',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dog-vaccines.html',
  styleUrl: './dog-vaccines.scss',
})
export class DogVaccines implements OnChanges {
  @Input() dogId: number | null = null;

  loading = false;
  error = '';
  applied: VaccineCard[] = [];
  upcoming: VaccineCard[] = [];
  pending: VaccineCard[] = [];
  applyingId: number | null = null;
  applying = false;

  readonly applyForm;

  constructor(
    private vaccineService: VaccineService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.applyForm = this.fb.group({
      applicationDate: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dogId']) {
      this.applyingId = null;
      this.loadVaccines();
    }
  }

  startApply(vaccineId: number): void {
    this.applyingId = this.applyingId === vaccineId ? null : vaccineId;
    this.error = '';

    if (this.applyingId !== null) {
      this.applyForm.reset({
        applicationDate: this.today(),
      });
    }
  }

  cancelApply(): void {
    if (this.applying) return;
    this.applyingId = null;
  }

  saveApply(vaccineId: number): void {
    if (!this.dogId) return;

    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      return;
    }

    const rawDate = this.applyForm.getRawValue().applicationDate;
    if (!rawDate) return;

    const body: VaccineDogDto = {
      dogId: this.dogId,
      vaccineId,
      applicationDate: rawDate,
    };

    this.applying = true;
    this.error = '';

    this.vaccineService.applyVaccine(body).subscribe({
      next: () => {
        this.applying = false;
        this.applyingId = null;
        this.loadVaccines();
      },
      error: (err) => {
        this.applying = false;
        this.error = this.getErrorMessage(err, 'No se pudo aplicar la vacuna');
        this.cdr.detectChanges();
      },
    });
  }

  private loadVaccines(): void {
    if (!this.dogId) return;

    this.loading = true;
    this.error = '';

    this.vaccineService
      .getVaccineOverview(this.dogId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (overview: VaccineOverviewDto) => {
          this.applied = overview.currentVaccines ?? [];
          this.upcoming = overview.upcomingVaccines ?? [];
          this.pending = overview.pendingVaccines ?? [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudieron cargar las vacunas');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private today(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
