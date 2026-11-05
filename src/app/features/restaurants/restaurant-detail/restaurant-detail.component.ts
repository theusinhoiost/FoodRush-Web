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
  template: `
    <div class="container mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <!-- Back Breadcrumb -->
      <div class="mb-4 flex items-center justify-between">
        <a
          routerLink="/restaurants"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ng-icon name="lucideArrowLeft" class="text-sm transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar para Restaurantes</span>
        </a>

        @if (authService.isAuthenticated()) {
          <button
            hlmBtn
            variant="outline"
            size="sm"
            class="gap-1.5"
            (click)="showNewItemModal.set(!showNewItemModal())"
          >
            <ng-icon [name]="showNewItemModal() ? 'lucideX' : 'lucidePlus'" class="text-xs" />
            <span>{{ showNewItemModal() ? 'Fechar Cadastro de Prato' : 'Adicionar Prato ao Cardápio' }}</span>
          </button>
        }
      </div>

      @if (isLoadingRestaurant()) {
        <div hlmCard class="h-44 animate-pulse bg-muted/40 rounded-2xl mb-8"></div>
      } @else if (restaurant(); as rest) {
        <!-- Restaurant Hero Header -->
        <div class="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-red-600/10 via-orange-500/5 to-card p-6 sm:p-8 mb-8 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-start gap-4">
              <div class="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-background border border-border shadow-md text-primary">
                <ng-icon name="lucideUtensils" class="text-3xl sm:text-4xl" />
              </div>
              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2.5">
                  <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {{ rest.tradeName }}
                  </h1>
                  @if (rest.isOpen) {
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Aberto para Pedidos
                    </span>
                  } @else {
                    <span hlmBadge variant="secondary" class="text-xs">Fechado</span>
                  }
                </div>

                @if (rest.address) {
                  <div class="space-y-1.5">
                    <p class="text-xs sm:text-sm text-muted-foreground flex items-start gap-1.5">
                      <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0 mt-1" />
                      <span>{{ formatAddress(rest.address) }}</span>
                    </p>
                    <div class="flex flex-wrap items-center gap-2 pl-4">
                      @if (googleMapsUrl(rest.address); as gUrl) {
                        <a
                          [href]="gUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-0.5 text-xs font-semibold transition-colors"
                        >
                          <ng-icon name="lucideMap" class="text-xs" />
                          <span>Ver no Google Maps</span>
                          <ng-icon name="lucideExternalLink" class="text-[10px]" />
                        </a>
                      }
                      @if (openStreetMapUrl(rest.address); as osmUrl) {
                        <a
                          [href]="osmUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1 rounded-md bg-background/90 hover:bg-muted text-foreground px-2.5 py-0.5 text-xs font-medium border border-border transition-colors"
                        >
                          <ng-icon name="lucideCompass" class="text-xs" />
                          <span>OpenStreetMap</span>
                          <ng-icon name="lucideExternalLink" class="text-[10px]" />
                        </a>
                      }
                    </div>
                  </div>
                }

                <div class="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span class="inline-flex items-center gap-1.5 rounded-lg bg-background/80 border border-border px-2.5 py-1 font-medium">
                    <ng-icon name="lucideBike" class="text-xs text-muted-foreground" />
                    <span>Taxa Base: <strong>{{ rest.baseDeliveryFee | currency:'BRL':'symbol':'1.2-2' }}</strong></span>
                  </span>
                  @if (deliveryEstimate(); as est) {
                    <span class="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/25 text-primary px-2.5 py-1 font-semibold">
                      <ng-icon name="lucideZap" class="text-xs" />
                      <span>
                        Frete Calculado ({{ est.distanceKm | number:'1.1-2' }}km):
                        {{ est.totalDeliveryFee | currency:'BRL':'symbol':'1.2-2' }} • ~{{ est.estimatedMinutes }} min
                      </span>
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Dynamic Delivery Estimate Box (by CEP + Number) -->
            <div class="rounded-xl border border-border bg-background/85 p-3.5 space-y-2 md:w-72 shrink-0">
              <div class="text-xs font-semibold text-foreground flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5">
                  <ng-icon name="lucideMapPin" class="text-xs text-primary" />
                  <span>Simular Frete por CEP</span>
                </span>
                <button
                  type="button"
                  class="text-[11px] text-primary hover:underline font-semibold"
                  (click)="estimateDeliveryFee()"
                >
                  Calcular
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] text-muted-foreground">Seu CEP</label>
                  <input hlmInput type="text" placeholder="01310-100" [(ngModel)]="customerCep" class="h-7 text-xs w-full" />
                </div>
                <div>
                  <label class="text-[10px] text-muted-foreground">Número</label>
                  <input hlmInput type="text" placeholder="1000" [(ngModel)]="customerNumber" class="h-7 text-xs w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- New Menu Item Form Panel (Restaurant Owner / Admin) -->
        @if (showNewItemModal()) {
          <div hlmCard class="mb-8 border-primary/30 bg-card shadow-lg rounded-2xl">
            <div hlmCardHeader>
              <h3 hlmCardTitle class="text-lg font-bold">Cadastrar Novo Prato no Cardápio</h3>
              <p hlmCardDescription class="text-xs text-muted-foreground">
                Adicione um novo item com variações de tamanho, estoque e grupos de complementos.
              </p>
            </div>
            <div hlmCardContent>
              <form [formGroup]="newDishForm" (ngSubmit)="onCreateMenuItem()" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-2 space-y-1">
                    <label hlmLabel class="text-xs">Nome do Prato *</label>
                    <input hlmInput formControlName="name" placeholder="Ex: Smash Bacon Duplo" class="w-full" />
                  </div>
                  <div class="space-y-1">
                    <label hlmLabel class="text-xs">Preço Base (R$) *</label>
                    <input hlmInput type="number" step="0.50" formControlName="basePrice" class="w-full" />
                  </div>
                </div>

                <div class="space-y-1">
                  <label hlmLabel class="text-xs">Descrição e Ingredientes</label>
                  <input
                    hlmInput
                    formControlName="description"
                    placeholder="Pão brioche, 2x carnes 90g, queijo cheddar e bacon crocante"
                    class="w-full"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                  <div class="space-y-1">
                    <label hlmLabel class="text-xs">Tamanho Padrão (Opcional)</label>
                    <input hlmInput formControlName="sizeName" placeholder="Ex: Tradicional 180g" class="w-full" />
                  </div>
                  <div class="space-y-1">
                    <label hlmLabel class="text-xs">Preço do Tamanho (R$)</label>
                    <input hlmInput type="number" step="0.50" formControlName="sizePrice" class="w-full" />
                  </div>
                  <div class="space-y-1">
                    <label hlmLabel class="text-xs">Estoque Inicial</label>
                    <input hlmInput type="number" formControlName="stockQuantity" class="w-full" />
                  </div>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                  <button hlmBtn variant="ghost" size="sm" type="button" (click)="showNewItemModal.set(false)">
                    Cancelar
                  </button>
                  <button hlmBtn size="sm" type="submit" [disabled]="newDishForm.invalid || isSavingDish()">
                    {{ isSavingDish() ? 'Salvando...' : 'Salvar Prato no Cardápio' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        <!-- Main 2-Column Layout: Menu Catalog (Left) + Shopping Cart (Right) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Left Column: Menu Items -->
          <div class="lg:col-span-8 space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold tracking-tight">Cardápio ({{ menuItems().length }})</h2>
              <button hlmBtn variant="ghost" size="xs" class="gap-1.5" (click)="loadMenu()">
                <ng-icon name="lucideRefreshCw" class="text-xs" />
                <span>Atualizar Cardápio</span>
              </button>
            </div>

            @if (menuItems().length === 0) {
              <div class="rounded-2xl border border-dashed border-border p-12 text-center bg-card/50">
                <div class="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl mx-auto mb-2">
                  <ng-icon name="lucideUtensils" />
                </div>
                <h3 class="font-semibold text-base">Este restaurante ainda não possui itens no cardápio</h3>
                <p class="text-xs text-muted-foreground mt-1">
                  Clique em "Adicionar Prato ao Cardápio" acima para cadastrar o primeiro item.
                </p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (item of menuItems(); track item.id) {
                  <div
                    hlmCard
                    class="rounded-2xl border-border/80 p-5 hover:border-primary/30 transition-all shadow-xs"
                    [class.opacity-60]="!item.available"
                  >
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div class="space-y-1.5 flex-1">
                        <div class="flex items-center gap-2">
                          <h3 class="font-bold text-base text-foreground">{{ item.name }}</h3>
                          @if (!item.available) {
                            <span hlmBadge variant="secondary" class="text-[10px]">Indisponível</span>
                          }
                        </div>

                        @if (item.description) {
                          <p class="text-xs text-muted-foreground leading-relaxed">
                            {{ item.description }}
                          </p>
                        }

                        <div class="pt-1 flex flex-wrap items-center gap-2">
                          <span class="text-sm font-extrabold text-primary">
                            A partir de {{ item.basePrice | currency:'BRL':'symbol':'1.2-2' }}
                          </span>

                          @if (item.sizes && item.sizes.length > 0) {
                            <span class="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              {{ item.sizes.length }} opção(ões) de tamanho
                            </span>
                          }
                          @if (item.complementGroups && item.complementGroups.length > 0) {
                            <span class="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              {{ item.complementGroups.length }} grupo(s) de adicionais
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Dish Actions -->
                      <div class="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                        <button
                          hlmBtn
                          size="sm"
                          class="gap-1.5"
                          [disabled]="!item.available || !rest.isOpen"
                          (click)="selectItemForCustomization(item)"
                        >
                          <ng-icon [name]="activeCustomizingItem()?.id === item.id ? 'lucideX' : 'lucidePlus'" class="text-xs" />
                          <span>{{ activeCustomizingItem()?.id === item.id ? 'Fechar Opções' : 'Adicionar' }}</span>
                        </button>

                        @if (authService.isAuthenticated()) {
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              class="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded"
                              (click)="onToggleItemAvailable(item)"
                            >
                              {{ item.available ? 'Pausar' : 'Ativar' }}
                            </button>
                            <button
                              type="button"
                              class="text-[11px] text-destructive hover:underline px-1.5 py-0.5 rounded"
                              (click)="onDeleteMenuItem(item.id)"
                            >
                              Excluir
                            </button>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Inline Customization Drawer when Selected -->
                    @if (activeCustomizingItem()?.id === item.id) {
                      <div class="mt-4 pt-4 border-t border-border space-y-4 bg-muted/25 -mx-5 -mb-5 p-5 rounded-b-2xl">
                        <!-- 1. Sizes Selection -->
                        @if (item.sizes && item.sizes.length > 0) {
                          <div class="space-y-2">
                            <div class="flex items-center justify-between">
                              <span class="text-xs font-bold uppercase tracking-wider text-foreground">
                                Escolha o Tamanho
                              </span>
                              <span hlmBadge variant="secondary" class="text-[10px]">Obrigatório</span>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              @for (size of item.sizes; track size.id) {
                                <label
                                  class="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all text-xs"
                                  [class]="
                                    selectedSize()?.id === size.id
                                      ? 'border-primary bg-primary/5 font-semibold'
                                      : 'border-border bg-card hover:bg-muted/40'
                                  "
                                >
                                  <div class="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="size-{{ item.id }}"
                                      [checked]="selectedSize()?.id === size.id"
                                      [disabled]="!size.available || size.stockQuantity <= 0"
                                      (change)="selectedSize.set(size)"
                                    />
                                    <div>
                                      <div>{{ size.name }}</div>
                                      <div class="text-[10px] text-muted-foreground">
                                        Estoque: {{ size.stockQuantity }} un.
                                      </div>
                                    </div>
                                  </div>
                                  <span class="font-bold text-primary">
                                    {{ size.price | currency:'BRL':'symbol':'1.2-2' }}
                                  </span>
                                </label>
                              }
                            </div>
                          </div>
                        }

                        <!-- 2. Complement Groups -->
                        @if (item.complementGroups && item.complementGroups.length > 0) {
                          @for (group of item.complementGroups; track group.id) {
                            <div class="space-y-2">
                              <div class="flex items-center justify-between">
                                <div>
                                  <span class="text-xs font-bold uppercase tracking-wider text-foreground">
                                    {{ group.name }}
                                  </span>
                                  <span class="text-[11px] text-muted-foreground ml-2">
                                    (Máx: {{ group.maxQuantity }})
                                  </span>
                                </div>
                                @if (group.required) {
                                  <span hlmBadge class="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                                    Obrigatório (Mín {{ group.minQuantity }})
                                  </span>
                                }
                              </div>

                              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                @for (comp of group.items; track comp.id) {
                                  <div class="flex items-center justify-between rounded-xl border border-border bg-card p-2.5 text-xs">
                                    <div>
                                      <div class="font-medium">{{ comp.name }}</div>
                                      <div class="text-primary font-semibold">
                                        + {{ comp.price | currency:'BRL':'symbol':'1.2-2' }}
                                      </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                      <button
                                        hlmBtn
                                        variant="outline"
                                        size="icon-xs"
                                        type="button"
                                        (click)="updateComplementQty(comp, -1)"
                                      >
                                        <ng-icon name="lucideMinus" class="text-xs" />
                                      </button>
                                      <span class="w-4 text-center font-bold">
                                        {{ getComplementQty(comp.id) }}
                                      </span>
                                      <button
                                        hlmBtn
                                        variant="outline"
                                        size="icon-xs"
                                        type="button"
                                        (click)="updateComplementQty(comp, 1)"
                                      >
                                        <ng-icon name="lucidePlus" class="text-xs" />
                                      </button>
                                    </div>
                                  </div>
                                }
                              </div>
                            </div>
                          }
                        }

                        <!-- 3. Quantity & Confirm Add to Cart -->
                        <div class="flex items-center justify-between pt-2">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-medium">Quantidade:</span>
                            <button
                              hlmBtn
                              variant="outline"
                              size="icon-xs"
                              type="button"
                              (click)="itemQuantity.set(itemQuantity() > 1 ? itemQuantity() - 1 : 1)"
                            >
                              <ng-icon name="lucideMinus" class="text-xs" />
                            </button>
                            <span class="w-6 text-center font-bold text-sm">{{ itemQuantity() }}</span>
                            <button
                              hlmBtn
                              variant="outline"
                              size="icon-xs"
                              type="button"
                              (click)="itemQuantity.set(itemQuantity() + 1)"
                            >
                              <ng-icon name="lucidePlus" class="text-xs" />
                            </button>
                          </div>

                          <button hlmBtn size="sm" type="button" class="gap-1.5" (click)="confirmAddToCart(item)">
                            <ng-icon name="lucideShoppingCart" class="text-xs" />
                            <span>Confirmar e Adicionar à Sacola</span>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Right Column: Sticky Shopping Cart & Checkout -->
          <div class="lg:col-span-4 lg:sticky lg:top-20">
            <div hlmCard class="rounded-2xl border-border shadow-md overflow-hidden">
              <div class=" px-5 py-4  flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <ng-icon name="lucideShoppingCart" class="text-lg" />
                  <h3 class="font-bold text-base">Sua Sacola</h3>
                </div>
                @if (cartService.totalItems() > 0) {
                  <button
                    type="button"
                    class="text-xs text-white/80 hover:text-white underline"
                    (click)="cartService.clearCart()"
                  >
                    Limpar
                  </button>
                }
              </div>

              <div hlmCardContent class="p-5 space-y-4">
                @if (checkoutError()) {
                  <div class="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {{ checkoutError() }}
                  </div>
                }

                @if (cartService.items().length === 0) {
                  <div class="py-10 text-center space-y-2">
                    <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl mx-auto">
                      <ng-icon name="lucideShoppingBag" />
                    </div>
                    <p class="text-sm font-medium text-foreground">Sua sacola está vazia</p>
                    <p class="text-xs text-muted-foreground">
                      Adicione itens deliciosos do cardápio ao lado para fazer seu pedido.
                    </p>
                  </div>
                } @else {
                  @if (cartService.restaurantName()) {
                    <div class="text-xs text-muted-foreground pb-2 border-b border-border">
                      Pedido em: <strong class="text-foreground">{{ cartService.restaurantName() }}</strong>
                    </div>
                  }

                  <!-- Cart Line Items -->
                  <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
                    @for (cartItem of cartService.items(); track cartItem.cartItemId) {
                      <div class="flex items-start justify-between gap-2 pb-3 border-b border-border/60 text-xs">
                        <div class="space-y-0.5 flex-1">
                          <div class="font-bold text-foreground">
                            {{ cartItem.quantity }}x {{ cartItem.menuItemName }}
                          </div>
                          @if (cartItem.sizeName) {
                            <div class="text-[11px] text-muted-foreground">
                              Tamanho: {{ cartItem.sizeName }}
                            </div>
                          }
                          @for (comp of cartItem.complements; track comp.complementItemId) {
                            <div class="text-[11px] text-muted-foreground">
                              + {{ comp.quantity }}x {{ comp.name }}
                            </div>
                          }
                          <div class="font-semibold text-primary pt-0.5">
                            {{ cartItem.totalPrice | currency:'BRL':'symbol':'1.2-2' }}
                          </div>
                        </div>

                        <div class="flex items-center gap-1">
                          <button
                            hlmBtn
                            variant="outline"
                            size="icon-xs"
                            (click)="cartService.updateQuantity(cartItem.cartItemId, -1)"
                          >
                            <ng-icon name="lucideMinus" class="text-xs" />
                          </button>
                          <span class="w-4 text-center font-semibold">{{ cartItem.quantity }}</span>
                          <button
                            hlmBtn
                            variant="outline"
                            size="icon-xs"
                            (click)="cartService.updateQuantity(cartItem.cartItemId, 1)"
                          >
                            <ng-icon name="lucidePlus" class="text-xs" />
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Delivery Address Input -->
                  <div class="space-y-1.5 pt-1">
                    <label hlmLabel class="text-xs">Endereço de Entrega *</label>
                    <input
                      hlmInput
                      type="text"
                      [(ngModel)]="deliveryAddress"
                      placeholder="Rua, Número, Bairro - Cidade/UF"
                      class="w-full text-xs"
                    />
                  </div>

                  <!-- Totals Summary -->
                  <div class="rounded-xl bg-muted/50 p-3.5 space-y-1.5 text-xs">
                    <div class="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{{ cartService.subtotal() | currency:'BRL':'symbol':'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between text-muted-foreground">
                      <span>Taxa de Entrega</span>
                      <span>{{ cartService.deliveryFee() | currency:'BRL':'symbol':'1.2-2' }}</span>
                    </div>
                    <div class="flex justify-between text-sm font-extrabold text-foreground pt-1.5 border-t border-border">
                      <span>Total</span>
                      <span class="text-primary">{{ cartService.total() | currency:'BRL':'symbol':'1.2-2' }}</span>
                    </div>
                  </div>

                  @if (!authService.isAuthenticated()) {
                    <a routerLink="/login" hlmBtn class="w-full gap-1.5">
                      <ng-icon name="lucideLogIn" class="text-sm" />
                      <span>Entre para Finalizar o Pedido</span>
                    </a>
                  } @else {
                    <button
                      hlmBtn
                      class="w-full shadow-md gap-1.5"
                      [disabled]="isPlacingOrder() || !deliveryAddress.trim()"
                      (click)="placeOrder()"
                    >
                      @if (isPlacingOrder()) {
                        <ng-icon name="lucideRefreshCw" class="text-sm animate-spin" />
                        <span>Processando Pedido...</span>
                      } @else {
                        <ng-icon name="lucideCheckCircle2" class="text-sm" />
                        <span>Confirmar Pedido • {{ cartService.total() | currency:'BRL':'symbol':'1.2-2' }}</span>
                      }
                    </button>
                  }
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
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

  // Checkout State
  protected deliveryAddress = 'Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, CEP: 01310-100';
  protected readonly isPlacingOrder = signal(false);
  protected readonly checkoutError = signal<string | null>(null);

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
      return;
    }
    this.activeCustomizingItem.set(item);
    this.itemQuantity.set(1);
    this.selectedComplements.set(new Map());

    const firstAvailableSize = item.sizes?.find((s) => s.available && s.stockQuantity > 0);
    this.selectedSize.set(firstAvailableSize);
  }

  getComplementQty(compId: string): number {
    return this.selectedComplements().get(compId)?.quantity ?? 0;
  }

  updateComplementQty(comp: ComplementItemDetail, delta: number): void {
    const map = new Map(this.selectedComplements());
    const current = map.get(comp.id)?.quantity ?? 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      map.delete(comp.id);
    } else {
      map.set(comp.id, { item: comp, quantity: next });
    }
    this.selectedComplements.set(map);
  }

  confirmAddToCart(item: MenuItemResponse): void {
    const rest = this.restaurant();
    if (!rest) return;

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
  }

  onCreateMenuItem(): void {
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
    this.menuService.toggleAvailable(item.id).subscribe({
      next: (updated) => {
        this.menuItems.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      },
    });
  }

  onDeleteMenuItem(id: string): void {
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
        this.router.navigate(['/orders', order.id]);
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

