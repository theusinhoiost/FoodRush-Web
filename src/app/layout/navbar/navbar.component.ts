import { Component, inject, PLATFORM_ID, signal, computed } from '@angular/core';
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
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly isDark = signal(false);

  protected readonly canSeePartnerLink = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role !== 'RESTAURANT';
  });

  protected readonly canAccessKds = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'RESTAURANT' || role === 'COURIER' || role === 'ADMIN';
  });

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
