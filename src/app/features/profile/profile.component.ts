import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserPatchRequest, UserResponse } from '../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    NgIcon,
  ],
  template: `
    <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold tracking-tight">Meu Perfil & Diretório de Usuários</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Atualize seus dados cadastrais, endereço de entrega e gerencie contas ativas na plataforma
        </p>
      </div>

      @if (!authService.isAuthenticated()) {
        <div hlmCard class="rounded-2xl p-10 text-center max-w-md mx-auto">
          <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-3xl mx-auto mb-3">
            <ng-icon name="lucideUser" />
          </div>
          <h3 class="text-lg font-bold">Você não está conectado</h3>
          <p class="text-xs text-muted-foreground mt-1 mb-5">
            Entre com sua conta para visualizar e editar seu perfil.
          </p>
          <a routerLink="/login" hlmBtn size="sm" class="gap-1.5">
            <ng-icon name="lucideLogIn" class="text-sm" />
            <span>Entrar Agora</span>
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Left Column: Edit Current User Profile -->
          <div class="lg:col-span-5">
            <div hlmCard class="rounded-2xl border-border p-6 shadow-sm space-y-5">
              <div class="flex items-center gap-4 pb-4 border-b border-border">
                <div class="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center text-2xl font-extrabold shadow">
                  {{ (authService.currentUser()?.name || 'U')[0].toUpperCase() }}
                </div>
                <div>
                  <h2 class="text-lg font-bold leading-tight">
                    {{ authService.currentUser()?.name }}
                  </h2>
                  <p class="text-xs text-muted-foreground">
                    {{ authService.currentUser()?.email }}
                  </p>
                  <div class="mt-1 flex items-center gap-1.5">
                    <span hlmBadge variant="secondary" class="text-[10px]">
                      {{ authService.currentUser()?.role }}
                    </span>
                    <span class="text-[10px] text-muted-foreground font-mono">
                      ID: {{ authService.currentUser()?.id?.slice(0, 8) }}...
                    </span>
                  </div>
                </div>
              </div>

              @if (saveMessage()) {
                <div class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  {{ saveMessage() }}
                </div>
              }

              <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()" class="space-y-4">
                <div class="space-y-1">
                  <label hlmLabel class="text-xs">Nome Completo</label>
                  <input hlmInput formControlName="name" class="w-full" />
                </div>

                <div class="space-y-1">
                  <label hlmLabel class="text-xs">E-mail</label>
                  <input hlmInput type="email" formControlName="email" class="w-full" />
                </div>

                <div class="space-y-1">
                  <label hlmLabel class="text-xs">Celular (DDD)</label>
                  <input hlmInput formControlName="phone" class="w-full" />
                </div>

                <div formGroupName="address" class="pt-3 border-t border-border space-y-3">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ng-icon name="lucideMapPin" class="text-xs text-primary" />
                    <span>Endereço Principal (ViaCEP Geocoding)</span>
                  </h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label hlmLabel class="text-xs">CEP</label>
                      <input hlmInput formControlName="cep" placeholder="01310-100" class="w-full" />
                    </div>
                    <div class="space-y-1">
                      <label hlmLabel class="text-xs">Número</label>
                      <input hlmInput formControlName="number" placeholder="1000" class="w-full" />
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label hlmLabel class="text-xs">Complemento</label>
                    <input hlmInput formControlName="complement" placeholder="Apto 101" class="w-full" />
                  </div>
                </div>

                <button
                  hlmBtn
                  type="submit"
                  class="w-full gap-1.5"
                  [disabled]="isSaving()"
                >
                  <ng-icon name="lucideCheck" class="text-sm" />
                  <span>{{ isSaving() ? 'Salvando Alterações...' : 'Salvar Dados do Perfil' }}</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Right Column: Platform Users List (/api/v1/users) -->
          <div class="lg:col-span-7 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold">Usuários Cadastrados ({{ users().length }})</h2>
                <p class="text-xs text-muted-foreground">
                  Gerenciamento de contas e status ativo via <code>/api/v1/users</code>
                </p>
              </div>
              <button hlmBtn variant="outline" size="xs" class="gap-1.5" (click)="loadUsers()">
                <ng-icon name="lucideRefreshCw" class="text-xs" />
                <span>Recarregar</span>
              </button>
            </div>

            <div class="space-y-3">
              @for (u of users(); track u.id) {
                <div hlmCard class="rounded-2xl border-border/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm">{{ u.name }}</span>
                      <span hlmBadge variant="secondary" class="text-[10px]">{{ u.role }}</span>
                      @if (u.active) {
                        <span class="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                          Ativo
                        </span>
                      } @else {
                        <span class="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold">
                          Inativo
                        </span>
                      }
                    </div>
                    <p class="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                      <span class="inline-flex items-center gap-1">
                        <ng-icon name="lucideMail" class="text-xs" />
                        <span>{{ u.email }}</span>
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <ng-icon name="lucidePhone" class="text-xs" />
                        <span>{{ u.phone }}</span>
                      </span>
                    </p>
                    @if (u.address) {
                      <p class="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0" />
                        <span>{{ u.address.street }}, {{ u.address.number }} - {{ u.address.city }}/{{ u.address.state }}</span>
                      </p>
                    }
                    <p class="text-[10px] text-muted-foreground font-mono">
                      UUID: {{ u.id }}
                    </p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      hlmBtn
                      variant="outline"
                      size="xs"
                      (click)="onToggleUserActive(u)"
                    >
                      {{ u.active ? 'Desativar' : 'Ativar' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  protected readonly users = signal<UserResponse[]>([]);
  protected readonly isSaving = signal(false);
  protected readonly saveMessage = signal<string | null>(null);

  protected readonly profileForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address: this.fb.group({
      cep: [''],
      number: [''],
      complement: [''],
    }),
  });

  ngOnInit(): void {
    const current = this.authService.currentUser();
    if (current) {
      this.profileForm.patchValue({
        name: current.name,
        email: current.email,
        phone: current.phone,
        address: {
          cep: current.address?.cep ?? '',
          number: current.address?.number ?? '',
          complement: current.address?.complement ?? '',
        },
      });
    }

    if (this.authService.isAuthenticated()) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.userService.findAll().subscribe({
      next: (list) => {
        this.users.set(list);
      },
    });
  }

  onUpdateProfile(): void {
    const current = this.authService.currentUser();
    if (!current?.id) return;

    this.isSaving.set(true);
    this.saveMessage.set(null);

    const val = this.profileForm.getRawValue();
    const payload: UserPatchRequest = {
      name: val.name || undefined,
      email: val.email || undefined,
      phone: val.phone || undefined,
    };

    if (val.address?.cep && val.address?.number) {
      payload.address = {
        cep: val.address.cep,
        number: val.address.number,
        complement: val.address.complement || undefined,
      };
    }

    this.userService.patch(current.id, payload).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.authService.setCurrentUser(updated);
        this.saveMessage.set('Perfil atualizado com sucesso!');
        this.loadUsers();
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  onToggleUserActive(user: UserResponse): void {
    this.userService.toggleActive(user.id).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      },
    });
  }
}

