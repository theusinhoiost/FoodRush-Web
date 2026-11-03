import { AddressRequest, AddressResponse } from './address.models';

export interface RestaurantRequest {
  ownerId: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  baseDeliveryFee: number;
  address: AddressRequest;
}

export interface RestaurantResponse {
  id: string;
  ownerId: string;
  tradeName: string;
  cnpj: string;
  baseDeliveryFee: number;
  latitude?: number;
  longitude?: number;
  address?: AddressResponse;
  isOpen: boolean;
}

export interface RestaurantPatchRequest {
  ownerId?: string;
  tradeName?: string;
  cnpj?: string;
  phone?: string;
  baseDeliveryFee?: number;
  address?: AddressRequest;
  isOpen?: boolean;
}

export interface DeliveryFeeEstimateResponse {
  restaurantId: string;
  restaurantName: string;
  distanceKm: number;
  baseFee: number;
  feePerKm: number;
  totalDeliveryFee: number;
  estimatedMinutes: number;
}
