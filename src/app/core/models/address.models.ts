export interface AddressRequest {
  cep: string;
  number: string;
  complement?: string;
}

export interface AddressResponse {
  id: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

