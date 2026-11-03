import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AuthService } from '../../../core/services/auth.service';
import { RestaurantResponse } from '../../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-restaurant-list',
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    NgIcon,
  ],
  template: `
    <!-- Modern Hero Banner -->
    <section class="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-red-600/10 via-orange-500/5 to-background">
      <div class="container mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div class="lg:col-span-7 space-y-4">
            <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <ng-icon name="lucideZap" class="text-sm" />
              <span>Entrega ultra-rápida na sua região</span>
            </div>
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Seus pratos favoritos, <span class="text-primary">quentinhos</span> na sua porta.
            </h1>
            <p class="text-muted-foreground text-sm sm:text-base max-w-xl">
              Explore restaurantes parceiros com cardápio em tempo real, cálculo dinâmico de frete por geolocalização e rastreamento de pedidos.
            </p>

            <!-- Search Bar + Nearby Trigger -->
            <div class="flex flex-col sm:flex-row gap-2.5 pt-2 max-w-xl">
              <div class="relative flex-1">
                <ng-icon name="lucideSearch" class="absolute left-3 top-3 text-muted-foreground text-base pointer-events-none" />
                <input
                  hlmInput
                  type="text"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Buscar restaurante, bairro ou cidade..."
                  class="w-full h-10 pl-9 bg-background/90 shadow-sm"
                />
              </div>
              <button
                hlmBtn
                variant="outline"
                class="h-10 gap-2 bg-background/90"
                (click)="toggleNearbyMode()"
              >
                <ng-icon name="lucideMapPin" class="text-sm text-primary" />
                <span>{{ showNearbyPanel() ? 'Ocultar Raio' : 'Buscar Próximos' }}</span>
              </button>
            </div>

            <!-- Nearby Geolocation Panel (/restaurants/nearby) -->
            @if (showNearbyPanel()) {
              <div class="rounded-xl border border-border bg-card/90 p-4 shadow-sm space-y-3 max-w-xl">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Busca Geográfica (Fórmula de Haversine)
                  </span>
                  @if (isNearbyActive()) {
                    <button
                      type="button"
                      class="text-xs text-primary hover:underline font-medium"
                      (click)="resetNearby()"
                    >
                      Limpar filtro geográfico
                    </button>
                  }
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label class="text-[11px] font-medium text-muted-foreground">Latitude</label>
                    <input hlmInput type="number" step="0.0001" [(ngModel)]="nearbyLat" class="w-full mt-0.5" />
                  </div>
                  <div>
                    <label class="text-[11px] font-medium text-muted-foreground">Longitude</label>
                    <input hlmInput type="number" step="0.0001" [(ngModel)]="nearbyLon" class="w-full mt-0.5" />
                  </div>
                  <div>
                    <label class="text-[11px] font-medium text-muted-foreground">Raio (km)</label>
                    <input hlmInput type="number" min="1" max="100" [(ngModel)]="nearbyRadius" class="w-full mt-0.5" />
                  </div>
                </div>
                <div class="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    class="text-xs text-muted-foreground hover:text-foreground underline"
                    (click)="usePaulistaCoords()"
                  >
                    Usar Av. Paulista (-23.5648, -46.6519)
                  </button>
                  <button hlmBtn size="sm" class="gap-1.5" (click)="searchNearby()">
                    <ng-icon name="lucideMapPin" class="text-xs" />
                    <span>Filtrar no Raio de {{ nearbyRadius }}km</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Quick Stats / Promo Card -->
          <div class="lg:col-span-5 hidden lg:grid grid-cols-2 gap-3.5">
            <div class="rounded-2xl border border-border/80 bg-card/80 backdrop-blur p-4 shadow-sm space-y-2">
              <ng-icon name="lucideUtensils" class="text-2xl text-primary" />
              <div class="text-xl font-bold">{{ restaurants().length }}</div>
              <p class="text-xs text-muted-foreground">Restaurantes parceiros prontos para atender</p>
            </div>
            <div class="rounded-2xl border border-border/80 bg-card/80 backdrop-blur p-4 shadow-sm space-y-2">
              <ng-icon name="lucideCheckCircle2" class="text-2xl text-emerald-500" />
              <div class="text-xl font-bold">{{ openCount() }} Abertos</div>
              <p class="text-xs text-muted-foreground">Aceitando pedidos agora mesmo</p>
            </div>
            <div class="col-span-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-5 text-white shadow-md flex items-center justify-between">
              <div class="space-y-1">
                <span class="text-[11px] font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Restaurante Parceiro
                </span>
                <h3 class="font-bold text-base">Tem um restaurante?</h3>
                <p class="text-xs text-white/85">Cadastre sua loja com geolocalização via CEP.</p>
              </div>
              <a
                routerLink="/register/restaurant"
                class="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-red-600 shadow hover:bg-white/90 transition"
              >
                <span>Cadastrar</span>
                <ng-icon name="lucideArrowRight" class="text-xs" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <!-- Category & Status Filter Pills -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          @for (cat of categories; track cat.id) {
            <button
              type="button"
              (click)="selectedCategory.set(cat.id)"
              class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border"
              [class]="
                selectedCategory() === cat.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
              "
            >
              <ng-icon [name]="cat.icon" class="text-sm" />
              <span>{{ cat.label }}</span>
            </button>
          }
        </div>

        <div class="flex items-center gap-2">
          @if (isNearbyActive()) {
            <span hlmBadge variant="secondary" class="text-xs gap-1.5">
              <ng-icon name="lucideMapPin" class="text-xs text-primary" />
              <span>Raio {{ nearbyRadius }}km ativo</span>
            </span>
          }
          <span class="text-xs text-muted-foreground">
            Exibindo <strong>{{ filteredRestaurants().length }}</strong> estabelecimento(s)
          </span>
          <button hlmBtn variant="ghost" size="xs" class="gap-1.5" (click)="loadRestaurants()" [disabled]="isLoading()">
            <ng-icon name="lucideRefreshCw" class="text-xs" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center mb-8">
          <p class="text-destructive font-semibold mb-1">{{ errorMessage() }}</p>
          <p class="text-xs text-muted-foreground mb-4">
            Verifique se a API Spring Boot está ativa em <code>http://localhost:8080/api/v1</code>.
          </p>
          <button hlmBtn variant="outline" size="sm" class="gap-1.5" (click)="loadRestaurants()">
            <ng-icon name="lucideRefreshCw" class="text-xs" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      }

      <!-- Loading Skeletons -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div hlmCard class="h-64 animate-pulse bg-muted/40 rounded-2xl"></div>
          }
        </div>
      } @else if (filteredRestaurants().length === 0 && !errorMessage()) {
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/50">
          <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-3xl mb-3">
            <ng-icon name="lucideUtensils" />
          </div>
          <h3 class="text-lg font-bold">Nenhum restaurante encontrado</h3>
          <p class="text-sm text-muted-foreground mt-1 max-w-sm mb-5">
            Tente ajustar seus filtros de busca ou cadastre um novo restaurante parceiro.
          </p>
          <div class="flex gap-2">
            <button hlmBtn variant="outline" size="sm" (click)="resetFilters()">
              Limpar Filtros
            </button>
            <a routerLink="/register/restaurant" hlmBtn size="sm" class="gap-1.5">
              <ng-icon name="lucidePlus" class="text-sm" />
              <span>Novo Restaurante</span>
            </a>
          </div>
        </div>
      } @else {
        <!-- Restaurant Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (restaurant of filteredRestaurants(); track restaurant.id) {
            <div
              hlmCard
              class="group overflow-hidden rounded-2xl border-border/80 bg-card hover:shadow-xl hover:border-primary/30 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <!-- Visual Cover Header -->
                <div class="relative h-28 bg-gradient-to-br from-orange-500/20 via-red-500/15 to-amber-500/10 flex items-center justify-between px-5">
                  <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-md border border-border text-primary group-hover:scale-105 transition-transform">
                    <ng-icon [name]="getRestaurantIcon(restaurant.tradeName)" class="text-2xl" />
                  </div>

                  <div class="flex items-center gap-2">
                    @if (restaurant.isOpen) {
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 backdrop-blur">
                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Aberto
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-muted/90 border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                        Fechado
                      </span>
                    }
                  </div>
                </div>

                <!-- Card Body -->
                <div hlmCardHeader class="pt-4 pb-2">
                  <div class="flex items-start justify-between gap-2">
                    <a
                      [routerLink]="['/restaurants', restaurant.id]"
                      class="hover:text-primary transition-colors"
                    >
                      <h3 hlmCardTitle class="text-lg font-bold leading-snug line-clamp-1">
                        {{ restaurant.tradeName }}
                      </h3>
                    </a>
                    <div class="flex items-center gap-1 text-xs font-semibold text-amber-500 shrink-0">
                      <ng-icon name="lucideStar" class="text-xs fill-amber-500" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <p hlmCardDescription class="text-xs text-muted-foreground">
                    CNPJ: {{ formatCnpj(restaurant.cnpj) }}
                  </p>
                </div>

                <div hlmCardContent class="space-y-3 text-sm pt-1">
                  <!-- Info Chips -->
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-1 text-xs font-medium">
                      <ng-icon name="lucideBike" class="text-xs text-muted-foreground" />
                      <span>Frete base:</span>
                      <strong class="text-foreground">
                        {{ restaurant.baseDeliveryFee | currency:'BRL':'symbol':'1.2-2' }}
                      </strong>
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
                      <ng-icon name="lucideClock" class="text-xs" />
                      <span>25-40 min</span>
                    </span>
                  </div>

                  <!-- Address Details -->
                  @if (restaurant.address) {
                    <div class="rounded-xl bg-muted/35 p-2.5 text-xs text-muted-foreground space-y-0.5 border border-border/50">
                      <p class="font-medium text-foreground/90 truncate flex items-center gap-1.5">
                        <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0" />
                        <span class="truncate">{{ restaurant.address.street }}, {{ restaurant.address.number }}</span>
                        @if (restaurant.address.complement) {
                          <span class="text-muted-foreground">({{ restaurant.address.complement }})</span>
                        }
                      </p>
                      <p class="truncate pl-4">
                        {{ restaurant.address.neighborhood }} • {{ restaurant.address.city }}/{{ restaurant.address.state }}
                      </p>
                    </div>
                  }
                </div>
              </div>

              <!-- Card Footer -->
              <div hlmCardFooter class="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                @if (authService.isAuthenticated()) {
                  <button
                    hlmBtn
                    variant="ghost"
                    size="xs"
                    class="text-xs text-muted-foreground hover:text-foreground"
                    (click)="onToggleStatus(restaurant)"
                    title="Alternar Aberto/Fechado"
                  >
                    {{ restaurant.isOpen ? 'Fechar Loja' : 'Abrir Loja' }}
                  </button>
                }
                <a
                  [routerLink]="['/restaurants', restaurant.id]"
                  hlmBtn
                  size="sm"
                  class="ml-auto inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>Ver Cardápio</span>
                  <ng-icon name="lucideChevronRight" class="text-sm" />
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class RestaurantListComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  protected readonly authService = inject(AuthService);

  protected readonly restaurants = signal<RestaurantResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<'ALL' | 'OPEN' | 'BURGER' | 'PIZZA'>('ALL');

  protected readonly showNearbyPanel = signal(false);
  protected readonly isNearbyActive = signal(false);
  protected nearbyLat = -23.564886;
  protected nearbyLon = -46.651918;
  protected nearbyRadius = 10;

  protected readonly categories = [
    { id: 'ALL' as const, label: 'Todos', icon: 'lucideUtensils' },
    { id: 'OPEN' as const, label: 'Abertos Agora', icon: 'lucideCheckCircle2' },
    { id: 'BURGER' as const, label: 'Hambúrgueres', icon: 'lucideFlame' },
    { id: 'PIZZA' as const, label: 'Pizzarias', icon: 'lucidePizza' },
  ];

  protected readonly openCount = computed(
    () => this.restaurants().filter((r) => r.isOpen).length
  );

  protected readonly filteredRestaurants = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    let list = this.restaurants();

    if (category === 'OPEN') {
      list = list.filter((r) => r.isOpen);
    } else if (category === 'BURGER') {
      list = list.filter((r) => r.tradeName.toLowerCase().includes('burger'));
    } else if (category === 'PIZZA') {
      list = list.filter((r) => r.tradeName.toLowerCase().includes('pizza'));
    }

    if (!query) return list;

    return list.filter((r) => {
      const matchName = r.tradeName.toLowerCase().includes(query);
      const matchCity = r.address?.city.toLowerCase().includes(query) ?? false;
      const matchNeighborhood = r.address?.neighborhood.toLowerCase().includes(query) ?? false;
      return matchName || matchCity || matchNeighborhood;
    });
  });

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.isNearbyActive.set(false);

    this.restaurantService.findAll().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(
          'Não foi possível conectar ao servidor de restaurantes.'
        );
      },
    });
  }

  toggleNearbyMode(): void {
    this.showNearbyPanel.update((v) => !v);
  }

  usePaulistaCoords(): void {
    this.nearbyLat = -23.564886;
    this.nearbyLon = -46.651918;
    this.nearbyRadius = 10;
  }

  searchNearby(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.restaurantService
      .findNearby(this.nearbyLat, this.nearbyLon, this.nearbyRadius)
      .subscribe({
        next: (data) => {
          this.restaurants.set(data);
          this.isNearbyActive.set(true);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Erro ao buscar restaurantes próximos.');
        },
      });
  }

  resetNearby(): void {
    this.loadRestaurants();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('ALL');
    if (this.isNearbyActive()) {
      this.loadRestaurants();
    }
  }

  onToggleStatus(restaurant: RestaurantResponse): void {
    this.restaurantService.toggleOpenStatus(restaurant.id).subscribe({
      next: (updated) => {
        this.restaurants.update((list) =>
          list.map((r) => (r.id === updated.id ? updated : r))
        );
      },
    });
  }

  getRestaurantIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('pizza')) return 'lucidePizza';
    if (lower.includes('burger') || lower.includes('hamb')) return 'lucideFlame';
    return 'lucideUtensils';
  }

  formatCnpj(cnpj: string): string {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}
