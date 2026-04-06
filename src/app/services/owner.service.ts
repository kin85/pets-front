import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OwnerProfileResponse {
  username: string;
  email: string;
  name: string;
  address: string;
  phone: string;
}

export interface UpdateOwnerProfileRequest {
  email: string;
  name: string;
  address: string;
  phone: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private readonly baseUrl = 'https://pets-x11k.onrender.com/api/owners/me';

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<OwnerProfileResponse> {
    return this.http.get<OwnerProfileResponse>(this.baseUrl);
  }

  updateMyProfile(body: UpdateOwnerProfileRequest): Observable<OwnerProfileResponse> {
    return this.http.put<OwnerProfileResponse>(this.baseUrl, body);
  }
}
