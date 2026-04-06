import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DogService, DogDetailResponse } from '../../services/dog.service';
import { DogNotes } from './dog-notes/dog-notes';
import { DogVaccines } from './dog-vaccines/dog-vaccines';
import { DogVisits } from './dog-visits/dog-visits';
import { DogDeworming } from './dog-deworming/dog-deworming';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE_MESSAGE = 'La imagen supera el tamano maximo permitido de 5 MB.';

@Component({
  selector: 'app-dog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    DogNotes,
    DogVaccines,
    DogVisits,
    DogDeworming,
    OwnerShell,
  ],
  templateUrl: './dog-detail.html',
  styleUrl: './dog-detail.scss',
})
export class DogDetail implements OnInit, OnDestroy {
  loading = true;
  error = '';
  photoError = '';
  dog?: DogDetailResponse;
  photoUrl: string | null = null;
  dogId: number | null = null;
  activeTab: 'basic' | 'notes' | 'vaccines' | 'deworming' | 'visits' = 'basic';
  saving = false;
  deleting = false;
  editing = false;
  showDeleteModal = false;
  selectedFile: File | null = null;
  private photoRefreshKey = Date.now();

  readonly editForm;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dogService: DogService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      breed: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', Validators.required],
      microchip: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!Number.isFinite(id)) {
      this.router.navigate(['/home']);
      return;
    }
    this.dogId = id;
    this.activeTab = this.getInitialTab();

    this.fetchDog();
  }

  private loadPhoto(): void {
    if (!this.dogId) return;
    this.dogService.getDogPhoto(this.dogId, this.photoRefreshKey).subscribe({
      next: (blob) => {
        if (this.photoUrl) {
          URL.revokeObjectURL(this.photoUrl);
        }
        this.photoUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      error: () => {
        // Sin foto o error -> dejamos placeholder
      },
    });
  }

  ngOnDestroy(): void {
    this.clearPhotoUrl();
  }

  setTab(tab: 'basic' | 'notes' | 'vaccines' | 'deworming' | 'visits'): void {
    this.activeTab = tab;
  }

  startEdit(): void {
    if (!this.dog) return;
    this.editing = true;
    this.error = '';
    this.photoError = '';
    this.selectedFile = null;
    this.editForm.reset({
      name: this.dog.name,
      breed: this.dog.breed,
      birthDate: this.dog.birthDate,
      microchip: this.dog.microchip,
    });
  }

  cancelEdit(): void {
    this.editing = false;
    this.selectedFile = null;
    this.photoError = '';
    if (this.dogId) {
      this.loadPhoto();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error = '';
    this.photoError = '';
    this.selectedFile = null;

    if (!file) {
      this.clearPhotoUrl();
      if (this.dogId) {
        this.loadPhoto();
      }
      this.cdr.detectChanges();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      input.value = '';
      this.photoError = MAX_IMAGE_SIZE_MESSAGE;
      this.clearPhotoUrl();
      if (this.dogId) {
        this.loadPhoto();
      }
      this.cdr.detectChanges();
      return;
    }

    this.selectedFile = file;
    this.clearPhotoUrl();
    this.photoUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();
  }

  saveDog(): void {
    if (!this.dogId) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const { name, breed, birthDate, microchip } = this.editForm.getRawValue();
    const formData = new FormData();
    formData.append('name', name!);
    formData.append('breed', breed!);
    formData.append('birthDate', birthDate!);
    formData.append('microchip', microchip!);

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile, this.selectedFile.name);
    }

    this.saving = true;
    this.error = '';

    this.dogService.updateDog(this.dogId, formData).subscribe({
      next: () => {
        this.editing = false;
        this.saving = false;
        this.selectedFile = null;
        this.photoRefreshKey = Date.now();
        this.fetchDog();
      },
      error: (err) => {
        this.saving = false;
        this.error = this.getErrorMessage(err, 'No se pudo actualizar el perro');
        this.cdr.detectChanges();
      },
    });
  }

  deleteDog(): void {
    if (!this.dogId || this.deleting) return;

    this.deleting = true;
    this.error = '';

    this.dogService.deleteDog(this.dogId).subscribe({
      next: () => {
        this.deleting = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.deleting = false;
        this.error = this.getErrorMessage(err, 'No se pudo eliminar el perro');
        this.cdr.detectChanges();
      },
    });
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.deleting) return;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    this.showDeleteModal = false;
    this.deleteDog();
  }

  private setDog(dog: DogDetailResponse): void {
    this.dog = dog;
    this.editForm.patchValue({
      name: dog.name,
      breed: dog.breed,
      birthDate: dog.birthDate,
      microchip: dog.microchip,
    });
  }

  private clearPhotoUrl(): void {
    if (!this.photoUrl) return;
    URL.revokeObjectURL(this.photoUrl);
    this.photoUrl = null;
  }

  private fetchDog(): void {
    if (!this.dogId) return;

    this.loading = true;
    this.error = '';

    this.dogService.getDogById(this.dogId).subscribe({
      next: (res) => {
        this.setDog(res);
        this.loading = false;
        this.cdr.detectChanges();
        this.loadPhoto();
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          return;
        }
        this.error = this.getErrorMessage(err, 'No se pudo cargar el perro');
        this.cdr.detectChanges();
      },
    });
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

  private getInitialTab(): 'basic' | 'notes' | 'vaccines' | 'deworming' | 'visits' {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'notes' || tab === 'vaccines' || tab === 'deworming' || tab === 'visits') {
      return tab;
    }
    return 'basic';
  }
}
