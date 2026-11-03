import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserPatchRequest, UserRequest, UserResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  findAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }

  findById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  update(id: string, dto: UserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, dto);
  }

  patch(id: string, dto: UserPatchRequest): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}`, dto);
  }

  toggleActive(id: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}/toggle-active`, {});
  }
}

