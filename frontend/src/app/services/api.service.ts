import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RequestPayload {
  text: string;
}

export interface RequestResponse {
  id: string;
  text: string;
  result: string;
  status: string;
  createdAt: string;
}

export interface MockLoginResponse {
  accessToken: string;
  expiresIn: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000';
  private accessToken = '';

  constructor(private http: HttpClient) {}

  mockLogin(email = 'demo@imix.com'): Observable<MockLoginResponse> {
    return this.http.post<MockLoginResponse>(`${this.baseUrl}/auth/mock-login`, { email });
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  hasToken(): boolean {
    return Boolean(this.accessToken);
  }

  sendRequest(text: string): Observable<RequestResponse> {
    return this.http.post<RequestResponse>(`${this.baseUrl}/requests`, { text }, {
      headers: this.buildAuthHeaders(),
    });
  }

  getRequests(): Observable<RequestResponse[]> {
    return this.http.get<RequestResponse[]>(`${this.baseUrl}/requests`, {
      headers: this.buildAuthHeaders(),
    });
  }

  private buildAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });
  }
}
