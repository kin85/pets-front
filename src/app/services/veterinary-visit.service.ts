import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VeterinaryVisitDto {
  dogId: number;
  veterinaryId: number | null;
  visitDate: string;
  reason: string;
  diagnosis: string;
  observations: string;
}

export interface VeterinaryVisitViewDto {
  id: number;
  dogId: number;
  dogName: string;
  veterinaryId: number;
  veterinaryName: string;
  visitDate: string;
  reason: string;
  diagnosis: string;
  observations: string;
}

export interface VeterinaryVisitSearchDto {
  draw: number;
  start: number;
  length: number;
  searchValue: string;
  order: Array<{ column: number; dir: 'asc' | 'desc' }>;
  columns: Array<{
    data: string;
    name: string;
    searchable: boolean;
    orderable: boolean;
    search: { value: string; regex: boolean };
  }>;
  dogId: number;
}

export interface DatatablesResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class VeterinaryVisitService {
  private readonly baseUrl = 'http://localhost:8080/api/veterinary-visits';

  constructor(private http: HttpClient) {}

  search(body: VeterinaryVisitSearchDto): Observable<DatatablesResponse<Record<string, string>>> {
    return this.http.post<DatatablesResponse<Record<string, string>>>(`${this.baseUrl}/datatables`, body);
  }

  getById(id: number): Observable<VeterinaryVisitViewDto> {
    return this.http.get<VeterinaryVisitViewDto>(`${this.baseUrl}/${id}`);
  }

  create(body: VeterinaryVisitDto): Observable<number> {
    return this.http.post<number>(this.baseUrl, body);
  }

  update(id: number, body: VeterinaryVisitDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
