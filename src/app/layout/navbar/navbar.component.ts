import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CurrencyPipe, HlmButtonImports, HlmBadgeImports, NgIcon],
  template: `
    <header class="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div class="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <!-- Brand Logo -->
        <div class="flex items-center gap-8">
          <a routerLink="/restaurants" class="flex items-center gap-2.5 group">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <ng-icon name="lucideFlame" class="text-xl" />
            </div>
            <div class="flex flex-col">
              <span class="font-extrabold text-lg leading-none tracking-tight text-foreground">
                Food<span class="text-primary">Rush</span>
              </span>
              <span class="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
                Delivery Express
              </span>
            </div>
          </a>

          <!-- Main Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <a
              routerLink="/restaurants"
              routerLinkActive="bg-accent text-accent-foreground font-semibold"
              [routerLinkActiveOptions]="{ exact: true }"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ng-icon name="lucideUtensils" class="text-base" />
              <span>Restaurantes</span>
            </a>
            <a
              routerLink="/orders"
              routerLinkActive="bg-accent text-accent-foreground font-semibold"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ng-icon name="lucidePackage" class="text-base" />
              <span>Pedidos & KDS</span>
            </a>
            <a
              routerLink="/register/restaurant"
              routerLinkActive="bg-accent text-accent-foreground font-semibold"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ng-icon name="lucideStore" class="text-base" />
              <span>Seja Parceiro</span>
            </a>
            @if (authService.isAuthenticated()) {
              <a
                routerLink="/profile"
                routerLinkActive="bg-accent text-accent-foreground font-semibold"
                class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <ng-icon name="lucideUser" class="text-base" />
                <span>Meu Perfil</span>
              </a>
            }
          </nav>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-2.5">
          <!-- Cart Quick Button -->
          @if (cartService.totalItems() > 0 && cartService.restaurantId()) {
            <a
              [routerLink]="['/restaurants', cartService.restaurantId()]"
              class="flex items-center gap-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/25 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all"
            >
              <ng-icon name="lucideShoppingCart" class="text-sm" />
              <span>{{ cartService.totalItems() }}</span>
              <span class="hidden sm:inline">•</span>
              <span class="hidden sm:inline">{{ cartService.total() | currency:'BRL':'symbol':'1.2-2' }}</span>
            </a>
          }

          <!-- Theme Toggle -->
          <button
            hlmBtn
            variant="ghost"
            size="icon-sm"
            (click)="toggleTheme()"
            title="Alternar tema claro/escuro"
            class="rounded-full"
          >
            @if (isDark()) {
              <ng-icon name="lucideSun" class="text-base text-amber-400" />
            } @else {
              <ng-icon name="lucideMoon" class="text-base text-slate-700" />
            }
          </button>

          @if (authService.isAuthenticated()) {
            <a
              routerLink="/profile"
              class="hidden sm:flex items-center gap-2 rounded-full border border-border bg-muted/40 hover:bg-muted px-3 py-1 transition-colors"
            >
              <div class="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                {{ (authService.currentUser()?.name || 'U')[0].toUpperCase() }}
              </div>
              <div class="flex flex-col text-left">
                <span class="text-xs font-semibold leading-tight max-w-[110px] truncate">
                  {{ authService.currentUser()?.name || 'Usuário' }}
                </span>
                <span class="text-[10px] text-muted-foreground leading-none">
                  {{ authService.currentUser()?.role || 'CLIENT' }}
                </span>
              </div>
            </a>
            <button hlmBtn variant="outline" size="sm" class="gap-1.5" (click)="onLogout()">
              <ng-icon name="lucideLogOut" class="text-sm" />
              <span>Sair</span>
            </button>
          } @else {
            <a routerLink="/login" hlmBtn variant="ghost" size="sm" class="gap-1.5">
              <ng-icon name="lucideLogIn" class="text-sm" />
              <span>Entrar</span>
            </a>
            <a routerLink="/register/client" hlmBtn size="sm" class="gap-1.5 shadow-sm shadow-primary/20">
              <ng-icon name="lucideUserPlus" class="text-sm" />
              <span>Criar Conta</span>
            </a>
          }
        </div>
      </div>

      <!-- Mobile Bottom Navigation Bar -->
      <div class="flex md:hidden border-t border-border/60 bg-background/95 px-2 py-1.5 justify-around text-xs">
        <a routerLink="/restaurants" routerLinkActive="text-primary font-semibold" class="flex flex-col items-center gap-0.5 py-1 px-2">
          <ng-icon name="lucideUtensils" class="text-base" />
          <span>Início</span>
        </a>
        <a routerLink="/orders" routerLinkActive="text-primary font-semibold" class="flex flex-col items-center gap-0.5 py-1 px-2">
          <ng-icon name="lucidePackage" class="text-base" />
          <span>Pedidos</span>
        </a>
        <a routerLink="/register/restaurant" routerLinkActive="text-primary font-semibold" class="flex flex-col items-center gap-0.5 py-1 px-2">
          <ng-icon name="lucideStore" class="text-base" />
          <span>Parceiro</span>
        </a>
        <a routerLink="/profile" routerLinkActive="text-primary font-semibold" class="flex flex-col items-center gap-0.5 py-1 px-2">
          <ng-icon name="lucideUser" class="text-base" />
          <span>Perfil</span>
        </a>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly isDark = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('foodrush_theme');
      if (saved === 'dark') {
        this.isDark.set(true);
        document.documentElement.classList.add('dark');
      }
    }
  }

  toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    if (isPlatformBrowser(this.platformId)) {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('foodrush_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('foodrush_theme', 'light');
      }
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
