import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { OrderResponse, OrderStatus, PaymentResponse, ProblemDetail } from '../../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, HlmCardImports, HlmBadgeImports, HlmButtonImports, NgIcon],
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
  protected readonly payment = signal<PaymentResponse | null>(null);
  protected readonly isPaymentLoading = signal(false);
  protected readonly isGeneratingPix = signal(false);
  protected readonly copiedPix = signal(false);
  protected readonly paymentError = signal<string | null>(null);

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
            // Refetch payment to update payment badge
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
