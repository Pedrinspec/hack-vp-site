import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface TokenResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${environment.apiBaseUrl}/api/auth/login`, payload).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.token))
    );
  }

  cadastrar(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(`${environment.apiBaseUrl}/api/auth/register`, payload);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserId(): string {
    const token = this.getToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? payload.userId ?? '';
    } catch {
      return '';
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
