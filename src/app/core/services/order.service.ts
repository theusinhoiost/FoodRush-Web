import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OrderCreateRequest,
  OrderResponse,
  OrderStatus,
  OrderStatusUpdateRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  createOrder(dto: OrderCreateRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, dto);
  }

  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/${id}`);
  }

  getOrdersByCustomer(customerId: string): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  getOrdersByRestaurant(restaurantId: string, status: OrderStatus): Observable<OrderResponse[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/restaurant/${restaurantId}`, {
      params,
    });
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<OrderResponse> {
    const payload: OrderStatusUpdateRequest = { status };
    return this.http.patch<OrderResponse>(`${this.baseUrl}/${id}/status`, payload);
  }
}

