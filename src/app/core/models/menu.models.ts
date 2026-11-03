export interface ComplementItemRequest {
  name: string;
  price: number;
  available?: boolean;
}

export interface ComplementGroupRequest {
  name: string;
  required?: boolean;
  minQuantity?: number;
  maxQuantity: number;
  items?: ComplementItemRequest[];
}

export interface MenuItemSizeRequest {
  name: string;
  price: number;
  stockQuantity: number;
  available?: boolean;
}

export interface MenuItemRequest {
  name: string;
  description?: string;
  basePrice: number;
  available?: boolean;
  sizes?: MenuItemSizeRequest[];
  complementGroups?: ComplementGroupRequest[];
}

export interface ComplementItemDetail {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface ComplementGroupDetail {
  id: string;
  name: string;
  required: boolean;
  minQuantity: number;
  maxQuantity: number;
  items: ComplementItemDetail[];
}

export interface MenuItemSizeDetail {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  available: boolean;
}

export interface MenuItemResponse {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  basePrice: number;
  available: boolean;
  sizes: MenuItemSizeDetail[];
  complementGroups: ComplementGroupDetail[];
}

