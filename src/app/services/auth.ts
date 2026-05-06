import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  ownerId: number | null;
  roles: string[];
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  address: string;
  phone: string;
}

export interface EmailRequest {
  email: string;
}

export interface TokenRequest {
  token: string;
}

export interface PasswordResetRequest {
  token: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'https://pets-x11k.onrender.com/auth';

  constructor(private http: HttpClient) {}

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, body);
  }

  register(body: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/register`, body);
  }

  confirmEmail(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/confirm-email`, { token } satisfies TokenRequest);
  }

  resendConfirmationEmail(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/confirm-email/resend`,
      { email } satisfies EmailRequest
    );
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/password-reset/request`,
      { email } satisfies EmailRequest
    );
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/password-reset/confirm`,
      { token, password } satisfies PasswordResetRequest
    );
  }
}
