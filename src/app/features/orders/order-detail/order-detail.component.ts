import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { OrderResponse, OrderStatus } from '../../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, HlmCardImports, HlmBadgeImports, HlmButtonImports, NgIcon],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  protected readonly order = signal<OrderResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isUpdating = signal(false);

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

  loadOrder(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.isLoading.set(true);
    this.orderService.getOrderById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  changeStatus(status: OrderStatus): void {
    const ord = this.order();
    if (!ord) return;
    this.isUpdating.set(true);
    this.orderService.updateOrderStatus(ord.id, status).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.isUpdating.set(false);
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
      CREATED: 'Pedido Criado',
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
