import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AddressService } from '../../../core/services/address.service';
import { MenuService } from '../../../core/services/menu.service';
import { OrderService } from '../../../core/services/order.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ComplementGroupDetail,
  ComplementItemDetail,
  DeliveryFeeEstimateResponse,
  MenuItemRequest,
  MenuItemResponse,
  MenuItemSizeDetail,
  OrderCreateRequest,
  ProblemDetail,
  RestaurantResponse,
  getFormattedAddress,
  getGoogleMapsUrl,
  getOpenStreetMapUrl,
} from '../../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-restaurant-detail',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DecimalPipe,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    NgIcon,
  ],
  templateUrl: './restaurant-detail.component.html',
})
export class RestaurantDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly restaurantService = inject(RestaurantService);
  private readonly addressService = inject(AddressService);
  private readonly menuService = inject(MenuService);
  private readonly orderService = inject(OrderService);
  protected readonly cartService = inject(CartService);
  protected readonly authService = inject(AuthService);

  protected readonly canManageMenu = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'RESTAURANT' || role === 'ADMIN';
  });

  protected readonly canOrder = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role !== 'RESTAURANT';
  });

  protected readonly restaurantId = signal<string>('');
  protected readonly restaurant = signal<RestaurantResponse | null>(null);
  protected readonly menuItems = signal<MenuItemResponse[]>([]);
  protected readonly isLoadingRestaurant = signal(false);
  protected readonly deliveryEstimate = signal<DeliveryFeeEstimateResponse | null>(null);

  protected readonly formatAddress = getFormattedAddress;
  protected readonly googleMapsUrl = getGoogleMapsUrl;
  protected readonly openStreetMapUrl = getOpenStreetMapUrl;

  protected customerCep = '01310-100';
  protected customerNumber = '1000';

  // Item Customization State
  protected readonly activeCustomizingItem = signal<MenuItemResponse | null>(null);
  protected readonly selectedSize = signal<MenuItemSizeDetail | undefined>(undefined);
  protected readonly selectedComplements = signal<Map<string, { item: ComplementItemDetail; quantity: number }>>(
    new Map()
  );
  protected readonly itemQuantity = signal(1);
  protected readonly customizationError = signal<string | null>(null);

  // Checkout State
  protected deliveryAddress = 'Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, CEP: 01310-100';
  protected readonly selectedPaymentMethod = signal<'PIX' | 'CREDIT_CARD'>('PIX');
  protected readonly selectedInstallments = signal<number>(1);
  protected readonly isPlacingOrder = signal(false);
  protected readonly checkoutError = signal<string | null>(null);

  protected readonly cartInstallmentOptions = computed(() => {
    const total = this.cartService.total();
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => ({
      number: num,
      amount: total / num,
      label: `${num}x de R$ ${(total / num).toFixed(2).replace('.', ',')} sem juros`,
    }));
  });

  // New Menu Item Form State
  protected readonly showNewItemModal = signal(false);
  protected readonly isSavingDish = signal(false);
  protected readonly newDishForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    basePrice: [29.9, [Validators.required, Validators.min(0)]],
    sizeName: ['Tradicional'],
    sizePrice: [29.9],
    stockQuantity: [30],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.restaurantId.set(id);

    const user = this.authService.currentUser();
    if (user?.address) {
      const a = user.address;
      this.deliveryAddress = getFormattedAddress(a);
      if (a.cep) this.customerCep = a.cep;
      if (a.number) this.customerNumber = a.number;
    }

    if (id) {
      this.loadRestaurantDetails();
      this.loadMenu();
    }
  }

  loadRestaurantDetails(): void {
    this.isLoadingRestaurant.set(true);
    this.restaurantService.findById(this.restaurantId()).subscribe({
      next: (data) => {
        this.restaurant.set(data);
        this.isLoadingRestaurant.set(false);
      },
      error: () => {
        this.isLoadingRestaurant.set(false);
      },
    });
  }

  loadMenu(): void {
    this.menuService.getMenuByRestaurant(this.restaurantId()).subscribe({
      next: (items) => {
        this.menuItems.set(items);
      },
    });
  }

  estimateDeliveryFee(): void {
    const id = this.restaurantId();
    const cep = this.customerCep.trim();
    const number = this.customerNumber.trim();
    if (!id || !cep || !number) return;

    this.addressService.geocodePreview({ cep, number }).subscribe({
      next: (resolved) => {
        this.deliveryAddress = getFormattedAddress(resolved);
        if (resolved.latitude == null || resolved.longitude == null) return;
        this.restaurantService
          .estimateDelivery(id, Number(resolved.latitude), Number(resolved.longitude))
          .subscribe({
            next: (est) => {
              this.deliveryEstimate.set(est);
              if (this.cartService.restaurantId() === id) {
                this.cartService.setDeliveryFee(Number(est.totalDeliveryFee));
              }
            },
          });
      },
    });
  }

  selectItemForCustomization(item: MenuItemResponse): void {
    if (this.activeCustomizingItem()?.id === item.id) {
      this.activeCustomizingItem.set(null);
      this.customizationError.set(null);
      return;
    }
    this.activeCustomizingItem.set(item);
    this.itemQuantity.set(1);
    this.selectedComplements.set(new Map());
    this.customizationError.set(null);

    const firstAvailableSize = item.sizes?.find((s) => s.available && s.stockQuantity > 0);
    this.selectedSize.set(firstAvailableSize);
  }

  getComplementQty(compId: string): number {
    return this.selectedComplements().get(compId)?.quantity ?? 0;
  }

  getGroupTotalSelected(group: ComplementGroupDetail): number {
    if (!group.items) return 0;
    return group.items.reduce((sum, comp) => sum + this.getComplementQty(comp.id), 0);
  }

  isGroupFulfilled(group: ComplementGroupDetail): boolean {
    const total = this.getGroupTotalSelected(group);
    const min = group.required
      ? Math.max(1, group.minQuantity != null ? group.minQuantity : 1)
      : (group.minQuantity != null ? group.minQuantity : 0);
    return total >= min;
  }

  isCustomizationValid(item: MenuItemResponse): boolean {
    if (!item.complementGroups || item.complementGroups.length === 0) return true;
    return item.complementGroups.every((g) => this.isGroupFulfilled(g));
  }

  getCustomizationErrorMessage(item: MenuItemResponse): string | null {
    if (!item.complementGroups) return null;
    for (const group of item.complementGroups) {
      const total = this.getGroupTotalSelected(group);
      const min = group.required
        ? Math.max(1, group.minQuantity != null ? group.minQuantity : 1)
        : (group.minQuantity != null ? group.minQuantity : 0);
      if (total < min) {
        return `Escolha pelo menos ${min} opção(ões) em "${group.name}".`;
      }
      if (group.maxQuantity != null && group.maxQuantity > 0 && total > group.maxQuantity) {
        return `Você só pode escolher até ${group.maxQuantity} opção(ões) em "${group.name}".`;
      }
    }
    return null;
  }

  updateComplementQty(group: ComplementGroupDetail, comp: ComplementItemDetail, delta: number): void {
    const map = new Map(this.selectedComplements());
    const current = map.get(comp.id)?.quantity ?? 0;
    const next = Math.max(0, current + delta);

    if (delta > 0) {
      const groupTotal = this.getGroupTotalSelected(group);
      if (group.maxQuantity != null && group.maxQuantity > 0 && groupTotal >= group.maxQuantity) {
        return;
      }
    }

    if (next === 0) {
      map.delete(comp.id);
    } else {
      map.set(comp.id, { item: comp, quantity: next });
    }
    this.selectedComplements.set(map);
    this.customizationError.set(null);
  }

  confirmAddToCart(item: MenuItemResponse): void {
    const rest = this.restaurant();
    if (!rest) return;

    const error = this.getCustomizationErrorMessage(item);
    if (error) {
      this.customizationError.set(error);
      return;
    }

    const fee = this.deliveryEstimate()
      ? Number(this.deliveryEstimate()!.totalDeliveryFee)
      : Number(rest.baseDeliveryFee);

    this.cartService.addItem(
      { id: rest.id, tradeName: rest.tradeName, baseDeliveryFee: fee },
      item,
      this.itemQuantity(),
      this.selectedSize(),
      Array.from(this.selectedComplements().values())
    );

    this.activeCustomizingItem.set(null);
    this.customizationError.set(null);
  }

  onCreateMenuItem(): void {
    if (!this.canManageMenu()) return;
    if (this.newDishForm.invalid) return;
    this.isSavingDish.set(true);
    const val = this.newDishForm.getRawValue();

    const payload: MenuItemRequest = {
      name: val.name!,
      description: val.description || undefined,
      basePrice: Number(val.basePrice),
      available: true,
      sizes: val.sizeName
        ? [
            {
              name: val.sizeName,
              price: Number(val.sizePrice || val.basePrice),
              stockQuantity: Number(val.stockQuantity ?? 20),
              available: true,
            },
          ]
        : [],
    };

    this.menuService.createMenuItem(this.restaurantId(), payload).subscribe({
      next: (created) => {
        this.menuItems.update((list) => [...list, created]);
        this.isSavingDish.set(false);
        this.showNewItemModal.set(false);
        this.newDishForm.reset({ basePrice: 29.9, sizeName: 'Tradicional', sizePrice: 29.9, stockQuantity: 30 });
      },
      error: () => {
        this.isSavingDish.set(false);
      },
    });
  }

  onToggleItemAvailable(item: MenuItemResponse): void {
    if (!this.canManageMenu()) return;
    this.menuService.toggleAvailable(item.id).subscribe({
      next: (updated) => {
        this.menuItems.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      },
    });
  }

  onDeleteMenuItem(id: string): void {
    if (!this.canManageMenu()) return;
    this.menuService.deleteMenuItem(id).subscribe({
      next: () => {
        this.menuItems.update((list) => list.filter((i) => i.id !== id));
      },
    });
  }

  placeOrder(): void {
    const user = this.authService.currentUser();
    const restId = this.cartService.restaurantId();
    if (!restId || this.cartService.items().length === 0) return;

    const customerId = user?.id || '11111111-1111-1111-1111-111111111111';

    this.isPlacingOrder.set(true);
    this.checkoutError.set(null);

    const payload: OrderCreateRequest = {
      customerId,
      restaurantId: restId,
      deliveryAddress: this.deliveryAddress,
      idempotencyKey: `foodrush-ord-${Date.now()}`,
      items: this.cartService.items().map((i) => ({
        menuItemId: i.menuItemId,
        sizeId: i.sizeId,
        quantity: i.quantity,
        complements: i.complements.map((c) => ({
          complementItemId: c.complementItemId,
          quantity: c.quantity,
        })),
      })),
    };

    this.orderService.createOrder(payload).subscribe({
      next: (order) => {
        this.isPlacingOrder.set(false);
        this.cartService.clearCart();
        this.router.navigate(['/orders', order.id], {
          queryParams: {
            method: this.selectedPaymentMethod(),
            installments: this.selectedInstallments(),
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isPlacingOrder.set(false);
        const problem = err.error as ProblemDetail | undefined;
        this.checkoutError.set(
          problem?.detail || 'Não foi possível finalizar o pedido. Verifique o estoque ou login.'
        );
      },
    });
  }
}
