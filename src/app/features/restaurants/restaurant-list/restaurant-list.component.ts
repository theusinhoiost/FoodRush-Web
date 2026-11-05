import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AddressService } from '../../../core/services/address.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  AddressResponse,
  RestaurantResponse,
  getFormattedAddress,
  getGoogleMapsUrl,
  getOpenStreetMapUrl,
} from '../../../core/models';
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

            <!-- Nearby Geolocation Panel (/restaurants/nearby via CEP) -->
            @if (showNearbyPanel()) {
              <div class="rounded-xl border border-border bg-card/90 p-4 shadow-sm space-y-3 max-w-xl">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Buscar Restaurantes Próximos por CEP
                  </span>
                  @if (isNearbyActive()) {
                    <button
                      type="button"
                      class="text-xs text-primary hover:underline font-medium"
                      (click)="resetNearby()"
                    >
                      Limpar filtro de proximidade
                    </button>
                  }
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label class="text-[11px] font-medium text-muted-foreground">Seu CEP</label>
                    <input
                      hlmInput
                      type="text"
                      placeholder="01310-100"
                      [(ngModel)]="nearbyCep"
                      class="w-full mt-0.5"
                    />
                  </div>
                  <div>
                    <label class="text-[11px] font-medium text-muted-foreground">Número</label>
                    <input
                      hlmInput
                      type="text"
                      placeholder="1000"
                      [(ngModel)]="nearbyNumber"
                      class="w-full mt-0.5"
                    />
                  </div>
                  <div>
                    <label class="text-[11px] font-medium text-muted-foreground">Raio (km)</label>
                    <input
                      hlmInput
                      type="number"
                      min="1"
                      max="100"
                      [(ngModel)]="nearbyRadius"
                      class="w-full mt-0.5"
                    />
                  </div>
                </div>

                @if (nearbyResolvedAddress(); as resolved) {
                  <div class="rounded-lg border border-primary/25 bg-primary/5 p-2.5 text-xs space-y-1.5">
                    <p class="font-medium text-foreground flex items-start gap-1.5">
                      <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0 mt-0.5" />
                      <span>{{ formatAddress(resolved) }}</span>
                    </p>
                    <div class="flex flex-wrap items-center gap-2 pl-4">
                      @if (googleMapsUrl(resolved); as gUrl) {
                        <a
                          [href]="gUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 rounded bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-semibold transition-colors"
                        >
                          <ng-icon name="lucideMap" class="text-[10px]" />
                          <span>Ver no Google Maps</span>
                          <ng-icon name="lucideExternalLink" class="text-[9px]" />
                        </a>
                      }
                      @if (openStreetMapUrl(resolved); as osmUrl) {
                        <a
                          [href]="osmUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 rounded bg-background hover:bg-muted text-foreground px-2 py-0.5 text-[10px] font-medium border border-border transition-colors"
                        >
                          <ng-icon name="lucideCompass" class="text-[10px]" />
                          <span>OpenStreetMap</span>
                          <ng-icon name="lucideExternalLink" class="text-[9px]" />
                        </a>
                      }
                    </div>
                  </div>
                }

                <div class="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    class="text-xs text-muted-foreground hover:text-foreground underline"
                    (click)="usePaulistaAddress()"
                  >
                    Usar Av. Paulista (CEP 01310-100, Nº 1000)
                  </button>
                  <button
                    hlmBtn
                    size="sm"
                    class="gap-1.5"
                    [disabled]="isLoading()"
                    (click)="searchNearby()"
                  >
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
                    <div class="rounded-xl bg-muted/35 p-2.5 text-xs text-muted-foreground space-y-1.5 border border-border/50">
                      <p class="font-medium text-foreground/90 leading-snug flex items-start gap-1.5">
                        <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0 mt-0.5" />
                        <span>{{ formatAddress(restaurant.address) }}</span>
                      </p>
                      @if (googleMapsUrl(restaurant.address) || openStreetMapUrl(restaurant.address)) {
                        <div class="flex flex-wrap items-center gap-2 pl-4 pt-0.5">
                          @if (googleMapsUrl(restaurant.address); as gUrl) {
                            <a
                              [href]="gUrl"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-semibold transition-colors"
                            >
                              <ng-icon name="lucideMap" class="text-[11px]" />
                              <span>Google Maps</span>
                              <ng-icon name="lucideExternalLink" class="text-[10px]" />
                            </a>
                          }
                          @if (openStreetMapUrl(restaurant.address); as osmUrl) {
                            <a
                              [href]="osmUrl"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 rounded-md bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 text-[10px] font-medium border border-border transition-colors"
                            >
                              <ng-icon name="lucideCompass" class="text-[11px]" />
                              <span>OpenStreetMap</span>
                              <ng-icon name="lucideExternalLink" class="text-[10px]" />
                            </a>
                          }
                        </div>
                      }
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
  private readonly addressService = inject(AddressService);
  protected readonly authService = inject(AuthService);

  protected readonly restaurants = signal<RestaurantResponse[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<'ALL' | 'OPEN' | 'BURGER' | 'PIZZA'>('ALL');

  protected readonly showNearbyPanel = signal(false);
  protected readonly isNearbyActive = signal(false);
  protected readonly nearbyResolvedAddress = signal<AddressResponse | null>(null);
  protected nearbyCep = '01310-100';
  protected nearbyNumber = '1000';
  protected nearbyRadius = 10;

  protected readonly categories = [
    { id: 'ALL' as const, label: 'Todos', icon: 'lucideUtensils' },
    { id: 'OPEN' as const, label: 'Abertos Agora', icon: 'lucideCheckCircle2' },
    { id: 'BURGER' as const, label: 'Hambúrgueres', icon: 'lucideFlame' },
    { id: 'PIZZA' as const, label: 'Pizzarias', icon: 'lucidePizza' },
  ];

  protected readonly formatAddress = getFormattedAddress;
  protected readonly googleMapsUrl = getGoogleMapsUrl;
  protected readonly openStreetMapUrl = getOpenStreetMapUrl;

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
      const matchFormatted = r.address?.formattedAddress?.toLowerCase().includes(query) ?? false;
      return matchName || matchCity || matchNeighborhood || matchFormatted;
    });
  });

  ngOnInit(): void {
    const userAddr = this.authService.currentUser()?.address;
    if (userAddr?.cep && userAddr?.number) {
      this.nearbyCep = userAddr.cep;
      this.nearbyNumber = userAddr.number;
      this.nearbyResolvedAddress.set(userAddr);
    }
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

  usePaulistaAddress(): void {
    this.nearbyCep = '01310-100';
    this.nearbyNumber = '1000';
    this.nearbyRadius = 10;
  }

  searchNearby(): void {
    const cep = this.nearbyCep.trim();
    const number = this.nearbyNumber.trim();
    if (!cep || !number) {
      this.errorMessage.set('Informe o CEP e o número para buscar restaurantes próximos.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.addressService.geocodePreview({ cep, number }).subscribe({
      next: (resolved) => {
        this.nearbyResolvedAddress.set(resolved);
        if (resolved.latitude == null || resolved.longitude == null) {
          this.isLoading.set(false);
          this.errorMessage.set('Não foi possível resolver a localização do CEP informado.');
          return;
        }
        this.restaurantService
          .findNearby(Number(resolved.latitude), Number(resolved.longitude), this.nearbyRadius)
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
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Não foi possível resolver o CEP informado.');
      },
    });
  }

  resetNearby(): void {
    this.nearbyResolvedAddress.set(null);
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
