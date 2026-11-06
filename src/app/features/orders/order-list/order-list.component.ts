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
  template: `
    <div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <!-- Header + Mode Switcher -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight">
            {{ activeTab() === 'CUSTOMER' ? 'Meus Pedidos' : 'Painel KDS (Cozinha & Entregas)' }}
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{
              activeTab() === 'CUSTOMER'
                ? 'Acompanhe o status e histórico das suas refeições em tempo real'
                : 'Gerencie a fila de preparo e despacho de pedidos em tempo real (RabbitMQ Events)'
            }}
          </p>
        </div>

        @if (canAccessKds()) {
          <div class="inline-flex rounded-xl border border-border bg-muted/50 p-1">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              [class]="
                activeTab() === 'CUSTOMER'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              "
              (click)="switchTab('CUSTOMER')"
            >
              <ng-icon name="lucideShoppingBag" class="text-sm" />
              <span>Meus Pedidos</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              [class]="
                activeTab() === 'RESTAURANT'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              "
              (click)="switchTab('RESTAURANT')"
            >
              <ng-icon name="lucideChefHat" class="text-sm" />
              <span>Painel KDS</span>
            </button>
          </div>
        }
      </div>

      @if (!authService.isAuthenticated()) {
        <div hlmCard class="rounded-2xl p-10 text-center max-w-lg mx-auto my-8">
          <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl mx-auto mb-3">
            <ng-icon name="lucideLock" />
          </div>
          <h3 class="text-lg font-bold">Autenticação Necessária</h3>
          <p class="text-xs text-muted-foreground mt-1 mb-5">
            Faça login para consultar seu histórico de pedidos ou operar o painel KDS de restaurantes.
          </p>
          <a routerLink="/login" hlmBtn size="sm" class="gap-1.5">
            <ng-icon name="lucideLogIn" class="text-sm" />
            <span>Fazer Login Agora</span>
          </a>
        </div>
      } @else {
        <!-- TAB 1: CUSTOMER ORDERS -->
        @if (activeTab() === 'CUSTOMER') {
          <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div class="flex items-center gap-3">
              @if (isAdmin()) {
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-muted-foreground shrink-0">Filtrar por ID:</span>
                  <input
                    hlmInput
                    type="text"
                    [(ngModel)]="customerIdInput"
                    class="max-w-xs text-xs h-8"
                    placeholder="UUID do cliente"
                  />
                  <button hlmBtn size="xs" variant="outline" class="gap-1.5" (click)="loadCustomerOrders()">
                    <ng-icon name="lucideSearch" class="text-xs" />
                    <span>Buscar</span>
                  </button>
                </div>
              } @else {
                <button hlmBtn size="xs" variant="outline" class="gap-1.5" (click)="loadCustomerOrders()">
                  <ng-icon name="lucideRefreshCw" class="text-xs" />
                  <span>Atualizar Pedidos</span>
                </button>
              }
            </div>
            <span class="text-xs text-muted-foreground">
              Total: <strong>{{ orders().length }}</strong> pedido(s)
            </span>
          </div>
        }

        <!-- TAB 2: RESTAURANT KDS -->
        @if (activeTab() === 'RESTAURANT') {
          <div class="mb-6 rounded-2xl border border-border bg-card p-4 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-semibold text-muted-foreground">Restaurante:</span>
                @for (rest of restaurants(); track rest.id) {
                  <button
                    type="button"
                    (click)="selectRestaurantForKds(rest.id)"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    [class]="
                      selectedRestaurantId() === rest.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:text-foreground'
                    "
                  >
                    {{ rest.tradeName }}
                  </button>
                }
              </div>
              <button hlmBtn size="xs" variant="outline" class="gap-1.5" (click)="loadRestaurantOrders()">
                <ng-icon name="lucideRefreshCw" class="text-xs" />
                <span>Atualizar Fila KDS</span>
              </button>
            </div>

            <!-- Status Filter Pills -->
            <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
              <span class="text-xs font-medium text-muted-foreground mr-2">Status:</span>
              @for (st of allStatuses; track st.value) {
                <button
                  type="button"
                  (click)="selectKdsStatus(st.value)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border"
                  [class]="
                    selectedStatus() === st.value
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground'
                  "
                >
                  <ng-icon [name]="st.icon" class="text-xs" />
                  <span>{{ st.label }}</span>
                </button>
              }
            </div>
          </div>
        }

        <!-- Orders List -->
        @if (isLoading()) {
          <div class="space-y-4">
            @for (i of [1, 2, 3]; track i) {
              <div hlmCard class="h-36 animate-pulse bg-muted/40 rounded-2xl"></div>
            }
          </div>
        } @else if (orders().length === 0) {
          <div class="rounded-2xl border border-dashed border-border p-14 text-center bg-card/50">
            <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl mx-auto mb-2">
              <ng-icon name="lucidePackage" />
            </div>
            <h3 class="text-base font-bold">Nenhum pedido encontrado</h3>
            <p class="text-xs text-muted-foreground mt-1 mb-4">
              @if (activeTab() === 'CUSTOMER') {
                Você ainda não realizou pedidos com este usuário.
              } @else {
                Não há pedidos com o status "{{ selectedStatus() }}" para este restaurante no momento.
              }
            </p>
            <a routerLink="/restaurants" hlmBtn size="sm" class="gap-1.5">
              <span>Explorar Restaurantes</span>
              <ng-icon name="lucideChevronRight" class="text-xs" />
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            @for (order of orders(); track order.id) {
              <div hlmCard class="rounded-2xl border-border/80 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <!-- Order Top Bar -->
                  <div class="flex items-start justify-between gap-2 pb-3 border-b border-border/60">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-base text-foreground">
                          {{ order.restaurantName }}
                        </span>
                        <span class="text-xs text-muted-foreground">
                          #{{ order.id.slice(0, 8) }}
                        </span>
                      </div>
                      <p class="text-xs text-muted-foreground mt-0.5">
                        Cliente: <strong>{{ order.customerName }}</strong> •
                        {{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}
                      </p>
                    </div>

                    <span
                      class="rounded-full px-3 py-1 text-xs font-bold border"
                      [class]="getStatusBadgeClass(order.status)"
                    >
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </div>

                  <!-- Order Items Summary -->
                  <div class="py-3 space-y-1.5 text-xs">
                    @for (item of order.items; track item.id) {
                      <div class="flex justify-between">
                        <span>
                          <strong>{{ item.quantity }}x</strong> {{ item.menuItemName }}
                          @if (item.sizeName) { ({{ item.sizeName }}) }
                        </span>
                        <span class="font-medium">
                          {{ item.totalPrice | currency:'BRL':'symbol':'1.2-2' }}
                        </span>
                      </div>
                    }
                    @if (order.deliveryAddress) {
                      <p class="text-[11px] text-muted-foreground pt-1 truncate flex items-center gap-1">
                        <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0" />
                        <span class="truncate">{{ order.deliveryAddress }}</span>
                      </p>
                    }
                  </div>
                </div>

                <!-- Order Footer & Status Actions -->
                <div class="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <div class="text-xs">
                    Total:
                    <strong class="text-sm font-extrabold text-primary">
                      {{ order.total | currency:'BRL':'symbol':'1.2-2' }}
                    </strong>
                  </div>

                  <div class="flex items-center gap-1.5">
                    @if (activeTab() === 'RESTAURANT' && getNextStatus(order.status); as nextSt) {
                      <button
                        hlmBtn
                        size="xs"
                        variant="outline"
                        class="gap-1.5"
                        (click)="advanceStatus(order, nextSt)"
                      >
                        <span>Avançar para {{ getStatusLabel(nextSt) }}</span>
                        <ng-icon name="lucideArrowRight" class="text-xs" />
                      </button>
                    }
                    <a [routerLink]="['/orders', order.id]" hlmBtn size="xs" class="gap-1">
                      <span>Rastrear Pedido</span>
                      <ng-icon name="lucideChevronRight" class="text-xs" />
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
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

