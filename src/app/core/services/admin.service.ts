import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminRestaurantResponse,
  AdminUserResponse,
  AdminMetricsResponse,
  AdminUpdateCommissionRequest,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://foodrush-backend-production-b263bc5d.up.railway.app/api/v1/admin';

  getRestaurants(): Observable<AdminRestaurantResponse[]> {
    return this.http.get<AdminRestaurantResponse[]>(`${this.baseUrl}/restaurants`);
  }

  updateCommission(restaurantId: string, commissionRate: number): Observable<AdminRestaurantResponse> {
    const payload: AdminUpdateCommissionRequest = { commissionRate };
    return this.http.patch<AdminRestaurantResponse>(`${this.baseUrl}/restaurants/${restaurantId}/commission`, payload);
  }

  getUsers(): Observable<AdminUserResponse[]> {
    return this.http.get<AdminUserResponse[]>(`${this.baseUrl}/users`);
  }

  toggleUserStatus(userId: string): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.baseUrl}/users/${userId}/toggle-status`, {});
  }

  getMetrics(): Observable<AdminMetricsResponse> {
    return this.http.get<AdminMetricsResponse>(`${this.baseUrl}/metrics`);
  }
}
