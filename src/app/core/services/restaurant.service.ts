import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DeliveryFeeEstimateResponse,
  RestaurantPatchRequest,
  RestaurantRequest,
  RestaurantResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/restaurants`;

  findAll(): Observable<RestaurantResponse[]> {
    return this.http.get<RestaurantResponse[]>(this.baseUrl);
  }

  findById(id: string): Observable<RestaurantResponse> {
    return this.http.get<RestaurantResponse>(`${this.baseUrl}/${id}`);
  }

  findNearby(lat: number, lon: number, radiusKm = 10): Observable<RestaurantResponse[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('radiusKm', radiusKm.toString());
    return this.http.get<RestaurantResponse[]>(`${this.baseUrl}/nearby`, { params });
  }

  estimateDelivery(id: string, lat: number, lon: number): Observable<DeliveryFeeEstimateResponse> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());
    return this.http.get<DeliveryFeeEstimateResponse>(`${this.baseUrl}/${id}/delivery-estimate`, {
      params,
    });
  }

  create(dto: RestaurantRequest): Observable<RestaurantResponse> {
    return this.http.post<RestaurantResponse>(this.baseUrl, dto);
  }

  update(id: string, dto: RestaurantRequest): Observable<RestaurantResponse> {
    return this.http.put<RestaurantResponse>(`${this.baseUrl}/${id}`, dto);
  }

  patch(id: string, dto: RestaurantPatchRequest): Observable<RestaurantResponse> {
    return this.http.patch<RestaurantResponse>(`${this.baseUrl}/${id}`, dto);
  }

  toggleOpenStatus(id: string): Observable<RestaurantResponse> {
    return this.http.patch<RestaurantResponse>(`${this.baseUrl}/${id}/toggle-open`, {});
  }
}
