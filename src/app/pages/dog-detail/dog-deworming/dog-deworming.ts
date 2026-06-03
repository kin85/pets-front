import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CoverageStatus,
  DewormerType,
  DewormingDto,
  DewormingOverviewDto,
  DewormingOverviewItemDto,
  DewormingService,
  DewormingViewDto,
} from '../../../services/deworming.service';

type DewormingCard = {
  type: DewormerType;
  title: string;
  current: DewormingViewDto | null;
  status: CoverageStatus;
  statusLabel: string;
  statusText: string;
  daysUntilExpiration: number | null;
  canCreate: boolean;
  actionLabel: string;
};

@Component({
  selector: 'app-dog-deworming',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dog-deworming.html',
  styleUrl: './dog-deworming.scss',
})
export class DogDeworming implements OnChanges {
  @Input() dogId: number | null = null;

  loading = false;
  saving = false;
  error = '';
  cards: DewormingCard[] = [];
  creatingType: DewormerType | null = null;
  deleting = false;
  deletingRecord: { id: number; title: string } | null = null;

  readonly createForm;

  constructor(
    private dewormingService: DewormingService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      administrationDate: ['', Validators.required],
      expirationDate: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dogId']) {
      this.creatingType = null;
      this.deletingRecord = null;
      this.loadDeworming();
    }
  }

  startCreate(type: DewormerType): void {
    this.creatingType = type;
    this.error = '';
    this.createForm.reset({
      name: '',
      administrationDate: this.today(),
      expirationDate: '',
    });
  }

  cancelCreate(): void {
    if (this.saving) return;
    this.creatingType = null;
    this.createForm.reset();
  }

  openDeleteModal(card: DewormingCard): void {
    if (!card.current) return;

    this.deletingRecord = {
      id: card.current.id,
      title: card.title,
    };
    this.error = '';
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.deletingRecord = null;
  }

  confirmDelete(): void {
    if (!this.deletingRecord || this.deleting) return;

    this.deleting = true;
    this.error = '';

    this.dewormingService.delete(this.deletingRecord.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deletingRecord = null;
        this.loadDeworming();
      },
      error: (err) => {
        this.deleting = false;
        this.error = this.getErrorMessage(err, 'No se pudo eliminar la desparasitacion');
        this.cdr.detectChanges();
      },
    });
  }

  saveCreate(type: DewormerType): void {
    if (!this.dogId) return;

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const rawValue = this.createForm.getRawValue();
    const body: DewormingDto = {
      dogId: this.dogId,
      name: rawValue.name ?? '',
      administrationDate: rawValue.administrationDate ?? '',
      expirationDate: rawValue.expirationDate || null,
      type,
    };

    this.saving = true;
    this.error = '';

    this.dewormingService.create(body).subscribe({
      next: () => {
        this.saving = false;
        this.creatingType = null;
        this.loadDeworming();
      },
      error: (err) => {
        this.saving = false;
        this.error = this.getErrorMessage(err, 'No se pudo registrar la desparasitacion');
        this.cdr.detectChanges();
      },
    });
  }

  private loadDeworming(): void {
    if (!this.dogId) return;

    this.loading = true;
    this.error = '';

    this.dewormingService
      .getDewormingOverview(this.dogId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (overview: DewormingOverviewDto) => {
          this.cards = [
            this.mapCard('', overview.internalDeworming),
            this.mapCard('Desparasitacion externa', overview.externalDeworming),
          ];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cards = [];
          this.error = this.getErrorMessage(err, 'No se pudo cargar la desparasitacion');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private mapCard(title: string, item: DewormingOverviewItemDto): DewormingCard {
    const expirationDate = item.current?.expirationDate;
    const statusLabel = this.getStatusLabel(item.status);
    const statusText = this.getStatusText(item.status, expirationDate, item.daysUntilExpiration);
    const actionLabel = item.status === 'WARNING' || item.status === 'EXPIRED'
      ? 'Renovar desparasitacion'
      : 'Anadir desparasitacion';

    return {
      type: item.type,
      title,
      current: item.current,
      status: item.status,
      statusLabel,
      statusText,
      daysUntilExpiration: item.daysUntilExpiration,
      canCreate: item.canCreate,
      actionLabel,
    };
  }

  private getStatusLabel(status: CoverageStatus): string {
    if (status === 'ACTIVE') return 'Activa';
    if (status === 'WARNING') return 'Caduca pronto';
    if (status === 'EXPIRED') return 'Caducada';
    return 'Sin cobertura';
  }

  private getStatusText(
    status: CoverageStatus,
    expirationDate: string | null | undefined,
    daysUntilExpiration: number | null
  ): string {
    if (status === 'ACTIVE') {
      return expirationDate
        ? 'La desparasitacion esta vigente.'
        : 'Sin fecha de caducidad registrada.';
    }
    if (status === 'WARNING') {
      return 'La desparasitacion esta proxima a vencer.';
    }
    if (status === 'EXPIRED') {
      return 'La desparasitacion ha caducado.';
    }
    if (daysUntilExpiration !== null && daysUntilExpiration <= 30) {
      return 'La desparasitacion necesita renovarse pronto.';
    }
    return 'Todavia no hay ninguna desparasitacion registrada.';
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
