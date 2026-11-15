import { UserRole } from './user.models';

export interface AdminRestaurantResponse {
  id: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  commissionRate: number;
  mpConnected: boolean;
  mpCollectorId?: string;
  mpConnectedAt?: string;
  isOpen: boolean;
  baseDeliveryFee: number;
}

export interface AdminUserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  role: UserRole;
  active: boolean;
}

export interface AdminMetricsResponse {
  totalRestaurants: number;
  connectedRestaurants: number;
  totalUsers: number;
  totalOrders: number;
  totalGrossVolume: number;
  totalPlatformFees: number;
}

export interface AdminUpdateCommissionRequest {
  commissionRate: number;
}
