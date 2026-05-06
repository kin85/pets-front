import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VaccineDogDto {
  dogId: number;
  vaccineId: number;
  applicationDate: string;
}

export interface VaccineSummaryItemDto {
  id: number;
  applicationId: number | null;
  name: string;
  optional: boolean;
  lastApplicationDate: string | null;
  nextDueDate: string | null;
  daysUntilDue: number | null;
}

export interface VaccineOverviewDto {
  dogName: string;
  currentVaccines: VaccineSummaryItemDto[];
  upcomingVaccines: VaccineSummaryItemDto[];
  pendingVaccines: VaccineSummaryItemDto[];
}

@Injectable({ providedIn: 'root' })
export class VaccineService {
  private readonly dogsUrl = 'https://pets-x11k.onrender.com/api/dogs';

  constructor(private http: HttpClient) {}

  getVaccineOverview(dogId: number): Observable<VaccineOverviewDto> {
    return this.http.get<VaccineOverviewDto>(`${this.dogsUrl}/${dogId}/vaccines/overview`);
  }

  applyVaccine(body: VaccineDogDto): Observable<number> {
    return this.http.post<number>(`${this.dogsUrl}/vaccine`, body);
  }

  deleteVaccineApplication(dogId: number, applicationId: number): Observable<void> {
    return this.http.delete<void>(`${this.dogsUrl}/${dogId}/vaccines/${applicationId}`);
  }
}
