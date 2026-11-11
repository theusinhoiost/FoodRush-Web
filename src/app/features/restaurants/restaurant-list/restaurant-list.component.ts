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
  templateUrl: './restaurant-list.component.html',
})
export class RestaurantListComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  private readonly addressService = inject(AddressService);
  protected readonly authService = inject(AuthService);

  protected readonly canManageRestaurant = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'RESTAURANT' || role === 'ADMIN';
  });

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
    if (!this.canManageRestaurant()) return;
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
