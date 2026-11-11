import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderResponse, OrderStatus, RestaurantResponse } from '../../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-order-list',
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    NgIcon,
  ],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);

  protected readonly canAccessKds = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'RESTAURANT' || role === 'COURIER' || role === 'ADMIN';
  });

  protected readonly isAdmin = computed(() => {
    return this.authService.currentUser()?.role === 'ADMIN';
  });

  protected readonly activeTab = signal<'CUSTOMER' | 'RESTAURANT'>('CUSTOMER');
  protected readonly orders = signal<OrderResponse[]>([]);
  protected readonly restaurants = signal<RestaurantResponse[]>([]);
  protected readonly isLoading = signal(false);

  protected customerIdInput = '';
  protected readonly selectedRestaurantId = signal<string>('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1');
  protected readonly selectedStatus = signal<OrderStatus>('PAID');

  protected readonly allStatuses: { value: OrderStatus; label: string; icon: string }[] = [
    { value: 'CREATED', label: 'Criado', icon: 'lucideFileText' },
    { value: 'PAID', label: 'Pago', icon: 'lucideCreditCard' },
    { value: 'PREPARING', label: 'Preparando', icon: 'lucideFlame' },
    { value: 'READY', label: 'Pronto', icon: 'lucideCheckCircle2' },
    { value: 'IN_ROUTE', label: 'Em Rota', icon: 'lucideBike' },
    { value: 'DELIVERED', label: 'Entregue', icon: 'lucidePackageCheck' },
    { value: 'CANCELED', label: 'Cancelado', icon: 'lucideXCircle' },
  ];

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.id) {
      this.customerIdInput = user.id;
    }

    const isKdsRoute = this.route.snapshot.routeConfig?.path === 'kds';
    if (isKdsRoute && this.canAccessKds()) {
      this.activeTab.set('RESTAURANT');
    } else {
      this.activeTab.set('CUSTOMER');
    }

    this.restaurantService.findAll().subscribe({
      next: (list) => {
        this.restaurants.set(list);
        if (list.length > 0 && !this.selectedRestaurantId()) {
          this.selectedRestaurantId.set(list[0].id);
        }
      },
    });

    if (this.authService.isAuthenticated()) {
      if (this.activeTab() === 'CUSTOMER') {
        this.loadCustomerOrders();
      } else {
        this.loadRestaurantOrders();
      }
    }
  }

  switchTab(tab: 'CUSTOMER' | 'RESTAURANT'): void {
    this.activeTab.set(tab);
    if (tab === 'CUSTOMER') {
      this.loadCustomerOrders();
    } else {
      this.loadRestaurantOrders();
    }
  }

  loadCustomerOrders(): void {
    const user = this.authService.currentUser();
    const customerId = this.customerIdInput.trim() || user?.id;
    if (!customerId) return;
    this.isLoading.set(true);
    this.orderService.getOrdersByCustomer(customerId).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.isLoading.set(false);
      },
    });
  }

  selectRestaurantForKds(restaurantId: string): void {
    this.selectedRestaurantId.set(restaurantId);
    this.loadRestaurantOrders();
  }

  selectKdsStatus(status: OrderStatus): void {
    this.selectedStatus.set(status);
    this.loadRestaurantOrders();
  }

  loadRestaurantOrders(): void {
    const restId = this.selectedRestaurantId();
    if (!restId) return;
    this.isLoading.set(true);
    this.orderService.getOrdersByRestaurant(restId, this.selectedStatus()).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.isLoading.set(false);
      },
    });
  }

  advanceStatus(order: OrderResponse, nextStatus: OrderStatus): void {
    this.orderService.updateOrderStatus(order.id, nextStatus).subscribe({
      next: (updated) => {
        if (this.activeTab() === 'CUSTOMER') {
          this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        } else {
          this.loadRestaurantOrders();
        }
      },
    });
  }

  getNextStatus(current: OrderStatus): OrderStatus | null {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      CREATED: 'PAID',
      PAID: 'PREPARING',
      PREPARING: 'READY',
      READY: 'IN_ROUTE',
      IN_ROUTE: 'DELIVERED',
      DELIVERED: null,
      CANCELED: null,
    };
    return flow[current] ?? null;
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      CREATED: 'Criado',
      PAID: 'Pago',
      PREPARING: 'Em Preparo',
      READY: 'Pronto p/ Coleta',
      IN_ROUTE: 'Saiu p/ Entrega',
      DELIVERED: 'Entregue',
      CANCELED: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  getStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'CANCELED':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'PREPARING':
      case 'READY':
      case 'IN_ROUTE':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-primary/15 text-primary border-primary/30';
    }
  }
}
