import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { VeterinaryVisitService } from '../../../services/veterinary-visit.service';

type VisitRow = {
  id: number;
  visitDate: string;
  reason: string;
  diagnosis: string;
  veterinaryName: string;
};

@Component({
  selector: 'app-dog-visits',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dog-visits.html',
  styleUrl: './dog-visits.scss',
})
export class DogVisits implements OnChanges, OnDestroy {
  @Input() dogId: number | null = null;

  loading = false;
  error = '';
  visitRows: VisitRow[] = [];
  totalFiltered = 0;
  pageSize = 10;
  pageIndex = 0;
  searchTerm = '';

  deletingId: number | null = null;
  deletingVisit = false;

  private search$ = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    private visitService: VeterinaryVisitService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.subscriptions.add(
      this.search$
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((value) => {
          this.searchTerm = value;
          this.pageIndex = 0;
          this.loadVisits();
        })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dogId']) {
      this.pageIndex = 0;
      this.loadVisits();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  previousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
      this.loadVisits();
    }
  }

  nextPage(): void {
    if (this.pageIndex + 1 < this.totalPages) {
      this.pageIndex += 1;
      this.loadVisits();
    }
  }

  goToCreateVisit(): void {
    if (!this.dogId) {
      this.error = 'No se pudo abrir la pantalla de creacion de visitas';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/dogs', this.dogId, 'visits', 'new']);
  }

  goToEditVisit(visitId: number): void {
    if (!this.dogId) {
      this.error = 'No se pudo abrir la pantalla de modificacion de visitas';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate(['/dogs', this.dogId, 'visits', visitId, 'edit']);
  }

  deleteVisit(id: number): void {
    this.deletingId = id;
  }

  closeDeleteModal(): void {
    if (this.deletingVisit) return;
    this.deletingId = null;
  }

  confirmDelete(): void {
    if (!this.deletingId || this.deletingVisit) return;

    const visitId = this.deletingId;
    this.deletingVisit = true;
    this.visitService.delete(visitId).subscribe({
      next: () => {
        this.deletingVisit = false;
        this.deletingId = null;
        this.loadVisits();
      },
      error: (err) => {
        this.deletingVisit = false;
        this.error = this.getErrorMessage(err, 'No se pudo borrar la visita');
        this.cdr.detectChanges();
      },
    });
  }

  private loadVisits(): void {
    if (!this.dogId) return;

    this.loading = true;
    this.error = '';

    const start = this.pageIndex * this.pageSize;
    const body = {
      draw: 1,
      start,
      length: this.pageSize,
      searchValue: this.searchTerm,
      order: [{ column: 0, dir: 'desc' as const }],
      columns: [
        {
          data: 'visitDate',
          name: 'visitDate',
          searchable: true,
          orderable: true,
          search: { value: '', regex: false },
        },
        {
          data: 'reason',
          name: 'reason',
          searchable: true,
          orderable: true,
          search: { value: '', regex: false },
        },
      ],
      dogId: this.dogId,
    };

    this.visitService
      .search(body)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.totalFiltered = Number(res.recordsFiltered ?? res.recordsTotal ?? 0);
          const rows = Array.isArray(res.data) ? res.data : [];
          this.visitRows = rows.map((row) => ({
            id: Number(row['id']),
            visitDate: row['visitDate'] ?? '',
            reason: row['reason'] ?? row['subject'] ?? '',
            diagnosis: row['diagnosis'] ?? '',
            veterinaryName: row['veterinaryName'] ?? '',
          }));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = this.getErrorMessage(err, 'No se pudieron cargar las visitas');
          this.visitRows = [];
          this.totalFiltered = 0;
          this.loading = false;
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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }
}
