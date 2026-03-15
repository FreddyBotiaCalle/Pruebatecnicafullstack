import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, RequestResponse } from '../../services/api.service';

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.css'],
})
export class RequestComponent {
  text = '';
  loading = false;
  result: RequestResponse | null = null;
  errorMessage = '';
  authReady = false;

  constructor(private apiService: ApiService) {}

  send(): void {
    if (!this.text.trim()) return;

    this.loading = true;
    this.result = null;
    this.errorMessage = '';

    if (!this.apiService.hasToken()) {
      this.apiService.mockLogin().subscribe({
        next: (auth) => {
          this.apiService.setAccessToken(auth.accessToken);
          this.authReady = true;
          this.sendRequest();
        },
        error: () => {
          this.errorMessage = 'No fue posible autenticarse para enviar la solicitud.';
          this.loading = false;
        },
      });
      return;
    }

    this.authReady = true;
    this.sendRequest();
  }

  private sendRequest(): void {

    this.apiService.sendRequest(this.text).subscribe({
      next: (response) => {
        this.result = response;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Error al procesar la solicitud. Intente nuevamente.';
        this.loading = false;
      },
    });
  }

  reset(): void {
    this.text = '';
    this.result = null;
    this.errorMessage = '';
  }
}
