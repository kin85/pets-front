import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VeterinaryViewDto {
  id: number;
  name: string;
  address: string;
  phone: string;
  schedule: string | null;
  emergencies: boolean;
  url: string | null;
}

@Injectable({ providedIn: 'root' })
export class VeterinaryService {
  private readonly baseUrl = 'https://pets-x11k.onrender.com/api/veterinaries';

  constructor(private http: HttpClient) {}

  getAll(): Observable<VeterinaryViewDto[]> {
    return this.http.get<VeterinaryViewDto[]>(this.baseUrl);
  }
}
