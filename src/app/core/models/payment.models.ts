export type PaymentMethod = 'PIX' | 'CREDIT_CARD';

export type PaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface PaymentResponse {
  id: string;
  orderId: string;
  externalId: string | null;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  installments?: number;
  cardLastFour?: string;
  cardBrand?: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  createdAt: string;
}

export interface CardPaymentRequest {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
}

export interface PaymentConfigResponse {
  publicKey: string;
}
