import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DogDetailResponse {
  id: number;
  name: string;
  breed: string;
  birthDate: string;
  microchip: string;
  ownerName: string;
}

export interface DogUpdateResponse {
  id: number;
  name: string;
  breed: string;
  birthDate: string;
  microchip: string;
  ownerName: string;
}

@Injectable({ providedIn: 'root' })
export class DogService {
  private readonly baseUrl = 'https://pets-x11k.onrender.com/api/dogs';

  constructor(private http: HttpClient) {}

  createDog(formData: FormData): Observable<unknown> {
    return this.http.post(this.baseUrl, formData, {
      responseType: 'text' as 'json',
    });
  }

  getDogById(id: number): Observable<DogDetailResponse> {
    return this.http.get<DogDetailResponse>(`${this.baseUrl}/${id}`);
  }

  getDogPhoto(id: number, refreshKey?: number): Observable<Blob> {
    const params = refreshKey ? new HttpParams().set('_ts', String(refreshKey)) : undefined;
    return this.http.get(`${this.baseUrl}/${id}/photo`, { responseType: 'blob', params });
  }

  updateDog(id: number, formData: FormData): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/${id}`, formData, {
      responseType: 'text' as 'json',
    });
  }

  deleteDog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
