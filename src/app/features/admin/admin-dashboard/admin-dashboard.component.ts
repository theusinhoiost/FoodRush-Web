import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminRestaurantResponse, AdminUserResponse, AdminMetricsResponse, UserRole } from '../../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    NgIcon,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly activeTab = signal<'RESTAURANTS' | 'USERS'>('RESTAURANTS');
  protected readonly isLoading = signal(false);
  protected readonly isSavingCommission = signal<string | null>(null);
  protected readonly isTogglingUser = signal<string | null>(null);
  protected readonly feedbackMessage = signal<string | null>(null);

  protected readonly metrics = signal<AdminMetricsResponse | null>(null);
  protected readonly restaurants = signal<AdminRestaurantResponse[]>([]);
  protected readonly users = signal<AdminUserResponse[]>([]);

  // Search & Filter state
  protected userSearch = '';
  protected userRoleFilter: string = 'ALL';
  protected restaurantSearch = '';

  // Local commission edit values
  protected commissionEdits: { [restaurantId: string]: number } = {};

  protected readonly filteredUsers = computed(() => {
    let list = this.users();
    if (this.userRoleFilter !== 'ALL') {
      list = list.filter((u) => u.role === this.userRoleFilter);
    }
    if (this.userSearch.trim()) {
      const q = this.userSearch.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.cpf && u.cpf.includes(q))
      );
    }
    return list;
  });

  protected readonly filteredRestaurants = computed(() => {
    let list = this.restaurants();
    if (this.restaurantSearch.trim()) {
      const q = this.restaurantSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.tradeName.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.ownerEmail.toLowerCase().includes(q) ||
          r.cnpj.includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.adminService.getMetrics().subscribe({
      next: (m) => this.metrics.set(m),
      error: () => {},
    });

    this.adminService.getRestaurants().subscribe({
      next: (rests) => {
        this.restaurants.set(rests);
        rests.forEach((r) => {
          this.commissionEdits[r.id] = r.commissionRate;
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });

    this.adminService.getUsers().subscribe({
      next: (u) => this.users.set(u),
      error: () => {},
    });
  }

  saveCommission(restaurant: AdminRestaurantResponse): void {
    const newRate = this.commissionEdits[restaurant.id];
    if (newRate === undefined || newRate < 0 || newRate > 100) {
      this.showFeedback('A taxa de comissão deve estar entre 0% e 100%');
      return;
    }

    this.isSavingCommission.set(restaurant.id);
    this.adminService.updateCommission(restaurant.id, newRate).subscribe({
      next: (updated) => {
        this.restaurants.update((list) =>
          list.map((r) => (r.id === updated.id ? updated : r))
        );
        this.isSavingCommission.set(null);
        this.showFeedback(`Comissão de "${updated.tradeName}" atualizada para ${updated.commissionRate}% com sucesso!`);
      },
      error: () => {
        this.isSavingCommission.set(null);
        this.showFeedback('Erro ao atualizar taxa de comissão.');
      },
    });
  }

  toggleUser(user: AdminUserResponse): void {
    this.isTogglingUser.set(user.id);
    this.adminService.toggleUserStatus(user.id).subscribe({
      next: (updated) => {
        this.users.update((list) =>
          list.map((u) => (u.id === updated.id ? updated : u))
        );
        this.isTogglingUser.set(null);
        this.showFeedback(
          `Usuário ${updated.name} ${updated.active ? 'ativado' : 'bloqueado'} com sucesso.`
        );
      },
      error: () => {
        this.isTogglingUser.set(null);
        this.showFeedback('Erro ao alterar status do usuário.');
      },
    });
  }

  private showFeedback(msg: string): void {
    this.feedbackMessage.set(msg);
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4000);
  }
}
