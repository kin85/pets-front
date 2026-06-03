import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';
import {
  VeterinaryVisitService,
  VeterinaryVisitViewDto,
} from '../../services/veterinary-visit.service';
import {
  VeterinaryTreatmentService,
  VeterinaryTreatmentViewDto,
} from '../../services/veterinary-treatment.service';

@Component({
  selector: 'app-veterinary-visit-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, OwnerShell],
  templateUrl: './veterinary-visit-detail.html',
  styleUrl: './veterinary-visit-detail.scss',
})
export class VeterinaryVisitDetail implements OnInit {
  loading = true;
  loadingTreatments = false;
  deletingTreatment = false;
  deletingTreatmentId: number | null = null;
  error = '';
  dogId: number | null = null;
  visit?: VeterinaryVisitViewDto;
  treatments: VeterinaryTreatmentViewDto[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private visitService: VeterinaryVisitService,
    private treatmentService: VeterinaryTreatmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const dogIdParam = this.route.snapshot.queryParamMap.get('dogId');
    const dogId = dogIdParam ? Number(dogIdParam) : NaN;

    this.dogId = Number.isFinite(dogId) ? dogId : null;

    if (!Number.isFinite(id)) {
      this.error = 'Visita no valida';
      this.loading = false;
      return;
    }

    this.visitService.getById(id).subscribe({
      next: (res) => {
        this.visit = res;
        this.dogId = this.dogId ?? res.dogId;
        this.loading = false;
        this.loadTreatments(id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'No se pudo cargar la visita');
        this.cdr.detectChanges();
      },
    });
  }

  goBack(): void {
    if (this.dogId) {
      this.router.navigate(['/dogs', this.dogId], { queryParams: { tab: 'visits' } });
      return;
    }

    this.router.navigate(['/home']);
  }

  private loadTreatments(visitId: number): void {
    this.loadingTreatments = true;
    this.treatmentService.getByVisitId(visitId).subscribe({
      next: (res) => {
        this.treatments = res;
        this.loadingTreatments = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.treatments = [];
        this.loadingTreatments = false;
        this.cdr.detectChanges();
      },
    });
  }

  openDeleteTreatmentModal(treatmentId: number): void {
    this.error = '';
    this.deletingTreatmentId = treatmentId;
  }

  closeDeleteTreatmentModal(): void {
    if (this.deletingTreatment) {
      return;
    }
    this.deletingTreatmentId = null;
  }

  confirmDeleteTreatment(): void {
    if (!this.deletingTreatmentId || this.deletingTreatment || !this.visit) {
      return;
    }

    this.deletingTreatment = true;
    this.error = '';

    this.treatmentService.delete(this.deletingTreatmentId).subscribe({
      next: () => {
        this.deletingTreatment = false;
        this.deletingTreatmentId = null;
        this.loadTreatments(this.visit!.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingTreatment = false;
        this.error = this.getErrorMessage(err, 'No se pudo eliminar el tratamiento');
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
