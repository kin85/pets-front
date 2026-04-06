import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';
import { VeterinaryService, VeterinaryViewDto } from '../../services/veterinary.service';
import { VeterinaryVisitService, VeterinaryVisitViewDto } from '../../services/veterinary-visit.service';

@Component({
  selector: 'app-veterinary-visit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OwnerShell],
  templateUrl: './veterinary-visit-form.html',
  styleUrl: './veterinary-visit-form.scss',
})
export class VeterinaryVisitForm implements OnInit {
  dogId: number | null = null;
  visitId: number | null = null;
  loadingVeterinaries = false;
  saving = false;
  loadingVisit = false;
  error = '';
  veterinaries: VeterinaryViewDto[] = [];

  readonly form;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private veterinaryService: VeterinaryService,
    private visitService: VeterinaryVisitService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      visitDate: ['', Validators.required],
      veterinaryId: [''],
      reason: ['', [Validators.required, Validators.minLength(2)]],
      diagnosis: [''],
      observations: [''],
    });
  }

  ngOnInit(): void {
    const dogId = Number(this.route.snapshot.paramMap.get('dogId'));
    if (!Number.isFinite(dogId)) {
      this.router.navigate(['/home']);
      return;
    }

    this.dogId = dogId;
    const visitIdParam = this.route.snapshot.paramMap.get('visitId');
    const visitId = visitIdParam ? Number(visitIdParam) : null;
    this.visitId = visitId !== null && Number.isFinite(visitId) ? visitId : null;

    this.form.reset({
      visitDate: this.today(),
      veterinaryId: '',
      reason: '',
      diagnosis: '',
      observations: '',
    });
    this.loadVeterinaries();

    if (this.visitId) {
      this.loadVisit(this.visitId);
    }
  }

  save(): void {
    if (!this.dogId) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    this.saving = true;
    this.error = '';

    const payload = {
      dogId: this.dogId,
      veterinaryId: rawValue.veterinaryId ? Number(rawValue.veterinaryId) : null,
      visitDate: rawValue.visitDate ?? '',
      reason: rawValue.reason ?? '',
      diagnosis: rawValue.diagnosis ?? '',
      observations: rawValue.observations ?? '',
    };

    if (this.visitId) {
      this.visitService.update(this.visitId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.backToVisits();
        },
        error: (err: unknown) => {
          this.saving = false;
          this.error = this.getErrorMessage(err, 'No se pudo actualizar la visita');
          this.cdr.detectChanges();
        },
      });
      return;
    }

    this.visitService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.backToVisits();
      },
      error: (err: unknown) => {
        this.saving = false;
        this.error = this.getErrorMessage(err, 'No se pudo crear la visita');
        this.cdr.detectChanges();
      },
    });
  }

  cancel(): void {
    this.backToVisits();
  }

  private backToVisits(): void {
    if (!this.dogId) {
      this.router.navigate(['/home']);
      return;
    }

    this.router.navigate(['/dogs', this.dogId], {
      queryParams: { tab: 'visits' },
    });
  }

  private loadVeterinaries(): void {
    this.loadingVeterinaries = true;
    this.veterinaryService.getAll().subscribe({
      next: (res) => {
        this.veterinaries = res;
        this.loadingVeterinaries = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.veterinaries = [];
        this.loadingVeterinaries = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadVisit(visitId: number): void {
    this.loadingVisit = true;
    this.visitService.getById(visitId).subscribe({
      next: (visit) => {
        this.patchForm(visit);
        this.loadingVisit = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingVisit = false;
        this.error = this.getErrorMessage(err, 'No se pudo cargar la visita');
        this.cdr.detectChanges();
      },
    });
  }

  private patchForm(visit: VeterinaryVisitViewDto): void {
    this.form.reset({
      visitDate: visit.visitDate,
      veterinaryId: visit.veterinaryId ? String(visit.veterinaryId) : '',
      reason: visit.reason,
      diagnosis: visit.diagnosis ?? '',
      observations: visit.observations ?? '',
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
