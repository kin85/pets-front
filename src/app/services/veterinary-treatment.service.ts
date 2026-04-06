import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AdministrationRoute = 'ORAL' | 'TOPICA' | 'INYECTABLE';

export interface VeterinaryTreatmentDto {
  veterinaryVisitId: number;
  medicineName: string;
  description: string;
  startDate: string;
  endDate: string | null;
  dose: string;
  frequency: string;
  administrationRoute: AdministrationRoute | null;
  instructions: string;
}

export interface VeterinaryTreatmentViewDto {
  id: number;
  veterinaryVisitId: number;
  medicineName: string;
  description: string;
  startDate: string;
  endDate: string | null;
  dose: string;
  frequency: string;
  administrationRoute: AdministrationRoute | null;
  instructions: string;
}

@Injectable({ providedIn: 'root' })
export class VeterinaryTreatmentService {
  private readonly baseUrl = 'https://pets-x11k.onrender.com/api/veterinary-treatments';

  constructor(private http: HttpClient) {}

  create(body: VeterinaryTreatmentDto): Observable<number> {
    return this.http.post<number>(this.baseUrl, body);
  }

  getById(id: number): Observable<VeterinaryTreatmentViewDto> {
    return this.http.get<VeterinaryTreatmentViewDto>(`${this.baseUrl}/${id}`);
  }

  getByVisitId(visitId: number): Observable<VeterinaryTreatmentViewDto[]> {
    return this.http.get<VeterinaryTreatmentViewDto[]>(`${this.baseUrl}/visit/${visitId}`);
  }

  update(id: number, body: VeterinaryTreatmentDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
