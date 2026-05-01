import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OwnerShell } from '../../shared/owner-shell/owner-shell';

type DogHomeDto = { id: number; name: string; hasPhoto: boolean; photoUrl?: string | null };

type OwnerHomeDto = {
  name: string;
  dogs: DogHomeDto[];
};

type DogVm = DogHomeDto & { photoUrl?: string | null };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, OwnerShell],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  loading = true;
  error = '';

  data?: { name: string; dogs: DogVm[] };

  private readonly homeUrl = 'https://pets-x11k.onrender.com/api/owners/me/home';
  private readonly dogsUrl = 'https://pets-x11k.onrender.com/api/dogs';

  private objectUrls: string[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.get<OwnerHomeDto>(this.homeUrl).subscribe({
        next: (res) => {
          this.data = {
            name: res.name,
            dogs: res.dogs.map((d) => ({ ...d })),
          };

          this.loading = false;
          this.cdr.detectChanges();

          this.loadDogsPhotos(this.data.dogs);
        },
        error: (err) => {
          this.loading = false;

          if (err?.status === 401) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
            return;
          }

          this.error = err?.error?.message ?? 'No se pudo cargar tu información';
          this.cdr.detectChanges();
        },
      });
  }

  private loadDogsPhotos(dogs: DogVm[]): void {
    for (const dog of dogs) {
      if (!dog.hasPhoto || dog.photoUrl) {
        continue;
      }

      this.http
        .get(`${this.dogsUrl}/${dog.id}/photo`, { responseType: 'blob' })
        .subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            dog.photoUrl = url;
            this.objectUrls.push(url);

            this.cdr.detectChanges();
          },
          error: () => {},
        });
    }
  }

  ngOnDestroy(): void {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls = [];
  }

  addDog(): void {
    this.router.navigate(['/dogs/new']);
  }

  openDog(id: number): void {
    this.router.navigate(['/dogs', id]);
  }
}
