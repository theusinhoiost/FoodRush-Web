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

  getConnectAuthorizeUrl(restaurantId: string): Observable<{ authorizeUrl: string }> {
    return this.http.get<{ authorizeUrl: string }>(`${this.baseUrl}/connect/authorize-url`, {
      params: { restaurantId },
    });
  }

  connectMpAccount(restaurantId: string, code?: string, collectorId?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/connect/callback`, {
      restaurantId,
      code,
      collectorId,
    });
  }

  disconnectMpAccount(restaurantId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/connect/disconnect/${restaurantId}`);
  }
}
