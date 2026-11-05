import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddressRequest, AddressResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/addresses`;

  /**
   * GET /api/v1/addresses
   * Lista todos os endereços com endereço completo formatado, coordenadas e links de mapa.
   */
  findAll(): Observable<AddressResponse[]> {
    return this.http.get<AddressResponse[]>(this.baseUrl);
  }

  /**
   * GET /api/v1/addresses/{id}
   * Busca um endereço por UUID.
   */
  findById(id: string): Observable<AddressResponse> {
    return this.http.get<AddressResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * POST /api/v1/addresses
   * Resolve o CEP + número via OpenCage Geocoder, persiste no banco e retorna o AddressResponseDTO.
   */
  create(dto: AddressRequest): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(this.baseUrl, dto);
  }

  /**
   * POST /api/v1/addresses/geocode
   * Faz a resolução e retorna o endereço completo, coordenadas e links do mapa em modo preview (sem salvar no banco).
   */
  geocodePreview(dto: AddressRequest): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(`${this.baseUrl}/geocode`, dto);
  }
}

