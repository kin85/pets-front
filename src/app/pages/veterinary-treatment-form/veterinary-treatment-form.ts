import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';
import {
  AdministrationRoute,
  VeterinaryTreatmentService,
  VeterinaryTreatmentViewDto,
} from '../../services/veterinary-treatment.service';

@Component({
  selector: 'app-veterinary-treatment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OwnerShell],
  templateUrl: './veterinary-treatment-form.html',
  styleUrl: './veterinary-treatment-form.scss',
})
export class VeterinaryTreatmentForm implements OnInit {
  readonly administrationRoutes: Array<{ value: AdministrationRoute; label: string }> = [
    { value: 'ORAL', label: 'Oral' },
    { value: 'TOPICA', label: 'Topica' },
    { value: 'INYECTABLE', label: 'Inyectable' },
  ];

  visitId: number | null = null;
  treatmentId: number | null = null;
  dogId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  readonly form;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private treatmentService: VeterinaryTreatmentService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      medicineName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(2)]],
      startDate: ['', Validators.required],
      endDate: [''],
      dose: [''],
      frequency: [''],
      administrationRoute: [''],
      instructions: [''],
    });
  }

  ngOnInit(): void {
    const visitId = Number(this.route.snapshot.paramMap.get('visitId'));
    const dogIdParam = this.route.snapshot.queryParamMap.get('dogId');
    const dogId = dogIdParam ? Number(dogIdParam) : NaN;

    if (!Number.isFinite(visitId)) {
      this.router.navigate(['/home']);
      return;
    }

    this.visitId = visitId;
    this.dogId = Number.isFinite(dogId) ? dogId : null;
    const treatmentIdParam = this.route.snapshot.paramMap.get('treatmentId');
    const treatmentId = treatmentIdParam ? Number(treatmentIdParam) : null;
    this.treatmentId = treatmentId !== null && Number.isFinite(treatmentId) ? treatmentId : null;

    this.form.reset({
      medicineName: '',
      description: '',
      startDate: this.today(),
      endDate: '',
      dose: '',
      frequency: '',
      administrationRoute: '',
      instructions: '',
    });

    if (this.treatmentId) {
      this.loadTreatment(this.treatmentId);
    }
  }

  save(): void {
    if (!this.visitId) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const payload = {
      veterinaryVisitId: this.visitId,
      medicineName: rawValue.medicineName ?? '',
      description: rawValue.description ?? '',
      startDate: rawValue.startDate ?? '',
      endDate: rawValue.endDate || null,
      dose: rawValue.dose ?? '',
      frequency: rawValue.frequency ?? '',
      administrationRoute: (rawValue.administrationRoute as AdministrationRoute | '') || null,
      instructions: rawValue.instructions ?? '',
    };

    this.saving = true;
    this.error = '';

    if (this.treatmentId) {
      this.treatmentService.update(this.treatmentId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.backToVisit();
        },
        error: (err: unknown) => {
          this.saving = false;
          this.error = this.getErrorMessage(err, 'No se pudo actualizar el tratamiento');
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.treatmentService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.backToVisit();
      },
      error: (err: unknown) => {
        this.saving = false;
        this.error = this.getErrorMessage(err, 'No se pudo crear el tratamiento');
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.backToVisit();
  }

  private loadTreatment(treatmentId: number): void {
    this.loading = true;
    this.treatmentService.getById(treatmentId).subscribe({
      next: (res) => {
        this.patchForm(res);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'No se pudo cargar el tratamiento');
        this.cdr.detectChanges();
      },
    });
  }

  private patchForm(treatment: VeterinaryTreatmentViewDto): void {
    this.form.reset({
      medicineName: treatment.medicineName,
      description: treatment.description,
      startDate: treatment.startDate,
      endDate: treatment.endDate ?? '',
      dose: treatment.dose ?? '',
      frequency: treatment.frequency ?? '',
      administrationRoute: treatment.administrationRoute ?? '',
      instructions: treatment.instructions ?? '',
    });
  }

  private backToVisit(): void {
    if (!this.visitId) {
      this.router.navigate(['/home']);
      return;
    }
    this.router.navigate(['/veterinary-visits', this.visitId], {
      queryParams: this.dogId ? { dogId: this.dogId } : undefined,
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
