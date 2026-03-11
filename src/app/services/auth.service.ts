import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload): Observable<unknown> {
    return this.http.post(`${environment.apiBaseUrl}/auth/login`, payload);
  }

  cadastrar(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(`${environment.apiBaseUrl}/usuarios`, payload);
  }
}
