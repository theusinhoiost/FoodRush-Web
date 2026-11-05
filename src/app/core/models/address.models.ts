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
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  openStreetMapUrl?: string;
}

export function getFormattedAddress(address?: AddressResponse | null): string {
  if (!address) return '';
  if (address.formattedAddress) {
    return address.formattedAddress;
  }
  const comp = address.complement ? ` - ${address.complement}` : '';
  const cepPart = address.cep ? `, CEP: ${address.cep}` : '';
  return `${address.street}, ${address.number}${comp}, ${address.neighborhood}, ${address.city} - ${address.state}${cepPart}`;
}

export function getGoogleMapsUrl(address?: AddressResponse | null): string | null {
  if (!address) return null;
  if (address.mapUrl) return address.mapUrl;
  if (address.latitude != null && address.longitude != null) {
    return `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
  }
  return null;
}

export function getOpenStreetMapUrl(address?: AddressResponse | null): string | null {
  if (!address) return null;
  if (address.openStreetMapUrl) return address.openStreetMapUrl;
  if (address.latitude != null && address.longitude != null) {
    return `https://www.openstreetmap.org/?mlat=${address.latitude}&mlon=${address.longitude}#map=17/${address.latitude}/${address.longitude}`;
  }
  return null;
}
