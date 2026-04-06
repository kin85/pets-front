import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  address: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Ajusta si tu back usa otra ruta
  private readonly baseUrl = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) {}

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, body);
  }

  register(body: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/register`, body);
  }
}
