import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  UserRequest,
  UserResponse,
} from '../models';

const ACCESS_TOKEN_KEY = 'foodrush_access_token';
const REFRESH_TOKEN_KEY = 'foodrush_refresh_token';
const USER_KEY = 'foodrush_user';

const SEED_FALLBACK_USERS: Record<string, UserResponse> = {
  'cliente@foodrush.com': {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Matheus Cliente',
    email: 'cliente@foodrush.com',
    phone: '11991112222',
    cpf: '52998224725',
    role: 'CLIENT',
    active: true,
    address: {
      id: 'a0000000-0000-0000-0000-000000000001',
      cep: '01310100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Apto 101',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.564886,
      longitude: -46.651918,
    },
  },
  'restaurante@foodrush.com': {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Carlos Proprietário',
    email: 'restaurante@foodrush.com',
    phone: '11993334444',
    cpf: '11144477735',
    role: 'RESTAURANT',
    active: true,
  },
  'entregador@foodrush.com': {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Lucas Entregador',
    email: 'entregador@foodrush.com',
    phone: '11995556666',
    cpf: '12345678909',
    role: 'COURIER',
    active: true,
  },
  'admin@foodrush.com': {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Admin FoodRush',
    email: 'admin@foodrush.com',
    phone: '11997778888',
    cpf: '98765432100',
    role: 'ADMIN',
    active: true,
  },
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  private readonly _accessToken = signal<string | null>(this.getStoredToken(ACCESS_TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(this.getStoredToken(REFRESH_TOKEN_KEY));
  private readonly _currentUser = signal<UserResponse | null>(this.getStoredUser());

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => {
        this.setTokens(res.accessToken, res.refreshToken);
      }),
      switchMap((res) =>
        this.http.get<UserResponse[]>(this.usersUrl).pipe(
          tap((users) => {
            const matched = users.find(
              (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
            );
            if (matched) {
              this.setCurrentUser(matched);
            } else if (SEED_FALLBACK_USERS[credentials.email.toLowerCase()]) {
              this.setCurrentUser(SEED_FALLBACK_USERS[credentials.email.toLowerCase()]);
            }
          }),
          map(() => res),
          catchError(() => {
            const fallback = SEED_FALLBACK_USERS[credentials.email.toLowerCase()];
            if (fallback) {
              this.setCurrentUser(fallback);
            }
            return of(res);
          })
        )
      )
    );
  }

  register(user: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/register`, user).pipe(
      tap((createdUser) => {
        this.setCurrentUser(createdUser);
      })
    );
  }

  refresh(): Observable<AuthResponse> {
    const currentRefresh = this._refreshToken();
    const payload: RefreshTokenRequest = { refreshToken: currentRefresh ?? '' };
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, payload).pipe(
      tap((res) => {
        this.setTokens(res.accessToken, res.refreshToken);
      })
    );
  }

  setCurrentUser(user: UserResponse | null): void {
    this._currentUser.set(user);
    if (this.isBrowser) {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  logout(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._currentUser.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    if (this.isBrowser) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private getStoredToken(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private getStoredUser(): UserResponse | null {
    if (this.isBrowser) {
      const data = localStorage.getItem(USER_KEY);
      if (data) {
        try {
          return JSON.parse(data) as UserResponse;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
