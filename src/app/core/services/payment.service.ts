import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CardPaymentRequest, PaymentConfigResponse, PaymentResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  createPixPayment(orderId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/orders/${orderId}/pix`, {});
  }

  createCardPayment(orderId: string, req: CardPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/orders/${orderId}/card`, req);
  }

  getPaymentByOrderId(orderId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/orders/${orderId}`);
  }

  getPaymentConfig(): Observable<PaymentConfigResponse> {
    return this.http.get<PaymentConfigResponse>(`${this.baseUrl}/config`);
  }
}
