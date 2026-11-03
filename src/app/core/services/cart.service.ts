import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ComplementItemDetail, MenuItemResponse, MenuItemSizeDetail } from '../models';

export interface CartComplement {
  complementItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  menuItemName: string;
  sizeId?: string;
  sizeName?: string;
  unitPrice: number;
  quantity: number;
  complements: CartComplement[];
  totalPrice: number;
}

export interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  deliveryFee: number;
  items: CartItem[];
}

const CART_STORAGE_KEY = 'foodrush_cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _state = signal<CartState>(this.loadCart());

  readonly state = this._state.asReadonly();
  readonly items = computed(() => this._state().items);
  readonly restaurantId = computed(() => this._state().restaurantId);
  readonly restaurantName = computed(() => this._state().restaurantName);
  readonly deliveryFee = computed(() => this._state().deliveryFee);

  readonly totalItems = computed(() =>
    this._state().items.reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this._state().items.reduce((acc, item) => acc + item.totalPrice, 0)
  );

  readonly total = computed(() => {
    const sub = this.subtotal();
    return sub > 0 ? sub + this._state().deliveryFee : 0;
  });

  addItem(
    restaurant: { id: string; tradeName: string; baseDeliveryFee: number },
    menuItem: MenuItemResponse,
    quantity: number,
    selectedSize?: MenuItemSizeDetail,
    selectedComplements: { item: ComplementItemDetail; quantity: number }[] = []
  ): void {
    const current = this._state();

    // If switching restaurants, replace cart
    const isSameRestaurant = !current.restaurantId || current.restaurantId === restaurant.id;
    const baseItems = isSameRestaurant ? [...current.items] : [];

    const unitPrice = selectedSize ? Number(selectedSize.price) : Number(menuItem.basePrice);
    const complements: CartComplement[] = selectedComplements
      .filter((c) => c.quantity > 0)
      .map((c) => ({
        complementItemId: c.item.id,
        name: c.item.name,
        price: Number(c.item.price),
        quantity: c.quantity,
      }));

    const complementsTotalPerUnit = complements.reduce(
      (sum, c) => sum + c.price * c.quantity,
      0
    );
    const itemTotalPrice = (unitPrice + complementsTotalPerUnit) * quantity;

    const newItem: CartItem = {
      cartItemId: `${menuItem.id}-${selectedSize?.id ?? 'base'}-${Date.now()}`,
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      sizeId: selectedSize?.id,
      sizeName: selectedSize?.name,
      unitPrice,
      quantity,
      complements,
      totalPrice: itemTotalPrice,
    };

    const nextState: CartState = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.tradeName,
      deliveryFee: Number(restaurant.baseDeliveryFee ?? 0),
      items: [...baseItems, newItem],
    };

    this.updateState(nextState);
  }

  updateQuantity(cartItemId: string, delta: number): void {
    const current = this._state();
    const updatedItems = current.items
      .map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const complementsPerUnit = item.complements.reduce(
          (sum, c) => sum + c.price * c.quantity,
          0
        );
        return {
          ...item,
          quantity: newQty,
          totalPrice: (item.unitPrice + complementsPerUnit) * newQty,
        };
      })
      .filter((item): item is CartItem => item !== null);

    if (updatedItems.length === 0) {
      this.clearCart();
    } else {
      this.updateState({ ...current, items: updatedItems });
    }
  }

  removeItem(cartItemId: string): void {
    const current = this._state();
    const updatedItems = current.items.filter((i) => i.cartItemId !== cartItemId);
    if (updatedItems.length === 0) {
      this.clearCart();
    } else {
      this.updateState({ ...current, items: updatedItems });
    }
  }

  setDeliveryFee(fee: number): void {
    const current = this._state();
    this.updateState({ ...current, deliveryFee: fee });
  }

  clearCart(): void {
    const empty: CartState = {
      restaurantId: null,
      restaurantName: null,
      deliveryFee: 0,
      items: [],
    };
    this.updateState(empty);
  }

  private updateState(state: CartState): void {
    this._state.set(state);
    if (this.isBrowser) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    }
  }

  private loadCart(): CartState {
    if (this.isBrowser) {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as CartState;
        } catch {
          // fallback
        }
      }
    }
    return {
      restaurantId: null,
      restaurantName: null,
      deliveryFee: 0,
      items: [],
    };
  }
}

