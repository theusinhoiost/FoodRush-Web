export type OrderStatus =
  | 'CREATED'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'IN_ROUTE'
  | 'DELIVERED'
  | 'CANCELED';

export interface OrderItemComplementRequest {
  complementItemId: string;
  quantity?: number;
}

export interface OrderItemRequest {
  menuItemId: string;
  sizeId?: string;
  quantity: number;
  complements?: OrderItemComplementRequest[];
}

export interface OrderCreateRequest {
  customerId: string;
  restaurantId: string;
  deliveryAddress?: string;
  idempotencyKey?: string;
  items: OrderItemRequest[];
}

export interface OrderStatusUpdateRequest {
  status: OrderStatus;
}

export interface OrderItemComplementResponse {
  id: string;
  complementItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderItemResponse {
  id: string;
  menuItemId: string;
  menuItemName: string;
  sizeId?: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  complements: OrderItemComplementResponse[];
}

export interface OrderResponse {
  id: string;
  customerId: string;
  customerName: string;
  restaurantId: string;
  restaurantName: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
}

