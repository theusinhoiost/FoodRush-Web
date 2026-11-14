import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { OrderResponse, OrderStatus, PaymentResponse, ProblemDetail } from '../../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { NgIcon } from '@ng-icons/core';

declare const MercadoPago: any;

@Component({
  selector: 'app-order-detail',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    UpperCasePipe,
    FormsModule,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    NgIcon,
  ],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);

  protected readonly order = signal<OrderResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isUpdating = signal(false);

  // Payment State
  protected readonly selectedPaymentMethod = signal<'PIX' | 'CREDIT_CARD'>('PIX');
  protected readonly payment = signal<PaymentResponse | null>(null);
  protected readonly isPaymentLoading = signal(false);
  protected readonly isGeneratingPix = signal(false);
  protected readonly isProcessingCard = signal(false);
  protected readonly copiedPix = signal(false);
  protected readonly paymentError = signal<string | null>(null);

  // Card Form State
  protected cardNumber = '';
  protected cardholderName = '';
  protected cardExpiration = '';
  protected securityCode = '';
  protected cardCpf = '';
  protected cardInstallments = 1;

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly steps: { status: OrderStatus; label: string; icon: string }[] = [
    { status: 'CREATED', label: 'Criado', icon: 'lucideFileText' },
    { status: 'PAID', label: 'Pago', icon: 'lucideCreditCard' },
    { status: 'PREPARING', label: 'Preparando', icon: 'lucideFlame' },
    { status: 'READY', label: 'Pronto', icon: 'lucideCheckCircle2' },
    { status: 'IN_ROUTE', label: 'Em Rota', icon: 'lucideBike' },
    { status: 'DELIVERED', label: 'Entregue', icon: 'lucidePackageCheck' },
  ];

  ngOnInit(): void {
    this.loadOrder();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadOrder(silent = false): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (!silent) this.isLoading.set(true);

    this.orderService.getOrderById(id).subscribe({
      next: (data) => {
        const previousStatus = this.order()?.status;
        this.order.set(data);
        if (!silent) this.isLoading.set(false);

        if (data.status === 'CREATED') {
          this.loadPayment(data.id);
          this.startPolling(data.id);
        } else {
          this.stopPolling();
          if (previousStatus === 'CREATED' && data.status === 'PAID') {
            this.loadPayment(data.id);
          }
        }
      },
      error: () => {
        if (!silent) this.isLoading.set(false);
      },
    });
  }

  loadPayment(orderId: string): void {
    this.isPaymentLoading.set(true);
    this.paymentService.getPaymentByOrderId(orderId).subscribe({
      next: (pay) => {
        this.payment.set(pay);
        this.isPaymentLoading.set(false);
      },
      error: () => {
        this.isPaymentLoading.set(false);
      },
    });
  }

  generatePix(): void {
    const ord = this.order();
    if (!ord) return;

    this.isGeneratingPix.set(true);
    this.paymentError.set(null);

    this.paymentService.createPixPayment(ord.id).subscribe({
      next: (pay) => {
        this.payment.set(pay);
        this.isGeneratingPix.set(false);
        this.startPolling(ord.id);
      },
      error: (err: HttpErrorResponse) => {
        this.isGeneratingPix.set(false);
        const problem = err.error as ProblemDetail | undefined;
        this.paymentError.set(
          problem?.detail || 'Não foi possível gerar a chave Pix. Tente novamente em instantes.'
        );
      },
    });
  }

  copyPixCode(): void {
    const code = this.payment()?.qrCode;
    if (!code || !this.isBrowser) return;

    navigator.clipboard.writeText(code).then(() => {
      this.copiedPix.set(true);
      setTimeout(() => this.copiedPix.set(false), 3000);
    });
  }

  async payWithCreditCard(): Promise<void> {
    const ord = this.order();
    if (!ord || !this.isBrowser) return;

    if (!this.cardNumber.trim() || !this.cardholderName.trim() || !this.cardExpiration.trim() || !this.securityCode.trim()) {
      this.paymentError.set('Por favor, preencha todos os dados do cartão.');
      return;
    }

    this.isProcessingCard.set(true);
    this.paymentError.set(null);

    try {
      const config = await this.paymentService.getPaymentConfig().toPromise();
      const publicKey = config?.publicKey;
      if (!publicKey) {
        throw new Error('Chave pública do Mercado Pago não configurada no servidor.');
      }

      if (typeof MercadoPago === 'undefined') {
        throw new Error('SDK do Mercado Pago não carregou no navegador. Verifique sua conexão.');
      }

      const mp = new MercadoPago(publicKey, { locale: 'pt-BR' });

      // Clean expiration MM/YY
      const expParts = this.cardExpiration.split('/');
      const month = expParts[0]?.trim();
      let year = expParts[1]?.trim() || '';
      if (year.length === 2) {
        year = `20${year}`;
      }

      const cleanCard = this.cardNumber.replace(/\D/g, '');
      const cleanCpf = (this.cardCpf || '12345678909').replace(/\D/g, '');

      // Detect card brand
      const cardBrand = this.detectCardBrand(cleanCard);

      const cardTokenResponse = await mp.createCardToken({
        cardNumber: cleanCard,
        cardholderName: this.cardholderName.trim(),
        cardExpirationMonth: month,
        cardExpirationYear: year,
        securityCode: this.securityCode.trim(),
        identificationType: 'CPF',
        identificationNumber: cleanCpf,
      });

      if (!cardTokenResponse?.id) {
        throw new Error('Não foi possível validar os dados do cartão com o Mercado Pago.');
      }

      this.paymentService.createCardPayment(ord.id, {
        token: cardTokenResponse.id,
        installments: Number(this.cardInstallments) || 1,
        paymentMethodId: cardBrand,
      }).subscribe({
        next: (pay) => {
          this.payment.set(pay);
          this.isProcessingCard.set(false);
          this.loadOrder(true);
        },
        error: (err: HttpErrorResponse) => {
          this.isProcessingCard.set(false);
          const problem = err.error as ProblemDetail | undefined;
          this.paymentError.set(
            problem?.detail || 'Pagamento recusado pelo Mercado Pago. Verifique os dados do cartão.'
          );
        },
      });
    } catch (err: any) {
      this.isProcessingCard.set(false);
      this.paymentError.set(err?.message || 'Erro ao processar pagamento com cartão.');
    }
  }

  private detectCardBrand(cardNumber: string): string {
    if (cardNumber.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) return 'master';
    if (/^3[47]/.test(cardNumber)) return 'amex';
    if (/^(4011|4389|4514|4576|5041|5066|5090|6277|6362|6363)/.test(cardNumber)) return 'elo';
    if (/^(606282|3841)/.test(cardNumber)) return 'hipercard';
    return 'master';
  }

  private startPolling(orderId: string): void {
    if (!this.isBrowser || this.pollInterval) return;

    this.pollInterval = setInterval(() => {
      this.orderService.getOrderById(orderId).subscribe({
        next: (data) => {
          this.order.set(data);
          if (data.status !== 'CREATED') {
            this.stopPolling();
            this.loadPayment(orderId);
          }
        },
      });
    }, 4000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  changeStatus(status: OrderStatus): void {
    const ord = this.order();
    if (!ord) return;
    this.isUpdating.set(true);
    this.orderService.updateOrderStatus(ord.id, status).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.isUpdating.set(false);
        if (updated.status !== 'CREATED') {
          this.stopPolling();
        }
      },
      error: () => {
        this.isUpdating.set(false);
      },
    });
  }

  isStepCompleted(current: OrderStatus, target: OrderStatus): boolean {
    const orderIdx = this.steps.findIndex((s) => s.status === current);
    const targetIdx = this.steps.findIndex((s) => s.status === target);
    return orderIdx >= targetIdx && orderIdx !== -1;
  }

  getStatusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      CREATED: 'Aguardando Pagamento',
      PAID: 'Pagamento Confirmado',
      PREPARING: 'Em Preparo na Cozinha',
      READY: 'Pronto para Coleta',
      IN_ROUTE: 'Saiu para Entrega',
      DELIVERED: 'Pedido Entregue',
      CANCELED: 'Pedido Cancelado',
    };
    return map[status] ?? status;
  }
}
