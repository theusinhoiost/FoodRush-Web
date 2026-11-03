import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuItemRequest, MenuItemResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMenuByRestaurant(restaurantId: string): Observable<MenuItemResponse[]> {
    return this.http.get<MenuItemResponse[]>(`${this.apiUrl}/restaurants/${restaurantId}/menu`);
  }

  getMenuItemById(id: string): Observable<MenuItemResponse> {
    return this.http.get<MenuItemResponse>(`${this.apiUrl}/menu-items/${id}`);
  }

  createMenuItem(restaurantId: string, dto: MenuItemRequest): Observable<MenuItemResponse> {
    return this.http.post<MenuItemResponse>(
      `${this.apiUrl}/restaurants/${restaurantId}/menu-items`,
      dto
    );
  }

  toggleAvailable(id: string): Observable<MenuItemResponse> {
    return this.http.patch<MenuItemResponse>(
      `${this.apiUrl}/menu-items/${id}/toggle-available`,
      {}
    );
  }

  deleteMenuItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/menu-items/${id}`);
  }
}

