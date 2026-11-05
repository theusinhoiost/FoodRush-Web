import { AddressRequest, AddressResponse } from './address.models';

export type UserRole = 'CLIENT' | 'RESTAURANT' | 'COURIER' | 'ADMIN';

export interface UserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf?: string;
  role: UserRole;
  address?: AddressRequest;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  role: UserRole;
  active: boolean;
  address?: AddressResponse;
  createdAt?: string;
}

export interface UserPatchRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: AddressRequest;
}
