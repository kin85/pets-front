import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VaccineViewDto {
  id: number;
  name: string;
  optional: boolean;
}

export interface VaccineListDto {
  id: number;
  name: string;
  optional: boolean;
  lastApplicationDate: string;
}

export interface VaccineDogViewDto {
  name: string;
  vaccines: VaccineListDto[];
}

export interface VaccineDogDto {
  dogId: number;
  vaccineId: number;
  applicationDate: string;
}

export interface VaccineSummaryItemDto {
  id: number;
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
  private readonly vaccinesUrl = 'http://localhost:8080/api/vaccines';
  private readonly dogsUrl = 'http://localhost:8080/api/dogs';

  constructor(private http: HttpClient) {}

  getAllVaccines(): Observable<VaccineViewDto[]> {
    return this.http.get<VaccineViewDto[]>(this.vaccinesUrl);
  }

  getDogVaccines(dogId: number): Observable<VaccineDogViewDto> {
    return this.http.get<VaccineDogViewDto>(`${this.dogsUrl}/${dogId}/vaccines`);
  }

  getVaccineOverview(dogId: number): Observable<VaccineOverviewDto> {
    return this.http.get<VaccineOverviewDto>(`${this.dogsUrl}/${dogId}/vaccines/overview`);
  }

  applyVaccine(body: VaccineDogDto): Observable<number> {
    return this.http.post<number>(`${this.dogsUrl}/vaccine`, body);
  }
}
