export type PaymentMethod = 'PIX';

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
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  createdAt: string;
}
