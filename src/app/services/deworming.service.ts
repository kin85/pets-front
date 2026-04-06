import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DewormerType = 'INTERNA' | 'EXTERNA';
export type CoverageStatus = 'MISSING' | 'ACTIVE' | 'WARNING' | 'EXPIRED';

export interface DewormingDto {
  dogId: number;
  name: string;
  administrationDate: string;
  expirationDate: string | null;
  type: DewormerType;
}

export interface DewormingViewDto {
  id: number;
  name: string;
  administrationDate: string;
  expirationDate: string | null;
  type: DewormerType;
}

export interface DewormingOverviewItemDto {
  type: DewormerType;
  current: DewormingViewDto | null;
  status: CoverageStatus;
  daysUntilExpiration: number | null;
  canCreate: boolean;
}

export interface DewormingOverviewDto {
  internalDeworming: DewormingOverviewItemDto;
  externalDeworming: DewormingOverviewItemDto;
}

@Injectable({ providedIn: 'root' })
export class DewormingService {
  private readonly dogsUrl = 'http://localhost:8080/api/dogs';
  private readonly dewormingUrl = 'http://localhost:8080/api/deworming';

  constructor(private http: HttpClient) {}

  getDogDeworming(dogId: number): Observable<DewormingViewDto[]> {
    return this.http.get<DewormingViewDto[]>(`${this.dogsUrl}/${dogId}/deworming`);
  }

  getDewormingOverview(dogId: number): Observable<DewormingOverviewDto> {
    return this.http.get<DewormingOverviewDto>(`${this.dogsUrl}/${dogId}/deworming/overview`);
  }

  create(body: DewormingDto): Observable<number> {
    return this.http.post<number>(`${this.dogsUrl}/deworming`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.dewormingUrl}/${id}`);
  }
}
