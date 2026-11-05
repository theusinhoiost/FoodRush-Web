import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AddressResponse,
  ProblemDetail,
  UserRequest,
  UserRole,
  getFormattedAddress,
  getGoogleMapsUrl,
  getOpenStreetMapUrl,
} from '../../../core/models';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-register-client',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    RouterLink,
    HlmCardImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    NgIcon,
  ],
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 bg-gradient-to-b from-red-500/5 via-background to-background">
      <div hlmCard class="w-full max-w-xl shadow-xl border-border/80 rounded-2xl overflow-hidden">

        <div hlmCardHeader class="space-y-1 text-center pt-6">
          <h2 hlmCardTitle class="text-2xl font-extrabold tracking-tight">Criar Nova Conta</h2>
          <p hlmCardDescription class="text-xs text-muted-foreground">
            Escolha seu perfil e cadastre-se com resolução automática de endereço via CEP
          </p>
        </div>

        <div hlmCardContent class="space-y-4">
          @if (errorMessage()) {
            <div class="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {{ errorMessage() }}
            </div>
          }
          @if (successMessage()) {
            <div class="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              {{ successMessage() }}
            </div>
          }

          <!-- Role Selector Pills -->
          <div class="grid grid-cols-3 gap-2">
            @for (r of roles; track r.value) {
              <button
                type="button"
                (click)="selectedRole.set(r.value)"
                class="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all"
                [class]="
                  selectedRole() === r.value
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                "
              >
                <ng-icon [name]="r.icon" class="size-5" />
                <span>{{ r.label }}</span>
              </button>
            }
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label hlmLabel for="name">Nome Completo *</label>
                <input
                  hlmInput
                  id="name"
                  type="text"
                  formControlName="name"
                  placeholder="Ex: Matheus Silva"
                  class="w-full"
                />
              </div>

              <div class="space-y-1.5">
                <label hlmLabel for="email">E-mail *</label>
                <input
                  hlmInput
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="seuemail@exemplo.com"
                  class="w-full"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label hlmLabel for="phone">Celular (DDD) *</label>
                <input
                  hlmInput
                  id="phone"
                  type="text"
                  formControlName="phone"
                  placeholder="11991112222"
                  class="w-full"
                />
              </div>

              <div class="space-y-1.5">
                <label hlmLabel for="cpf">CPF (11 dígitos)</label>
                <input
                  hlmInput
                  id="cpf"
                  type="text"
                  formControlName="cpf"
                  placeholder="52998224725"
                  class="w-full"
                />
              </div>

              <div class="space-y-1.5">
                <label hlmLabel for="password">Senha *</label>
                <input
                  hlmInput
                  id="password"
                  type="password"
                  formControlName="password"
                  placeholder="Mínimo 6 dígitos"
                  class="w-full"
                />
              </div>
            </div>

            <div class="pt-3 border-t border-border space-y-3">
              <div class="flex items-center justify-between gap-2">
                <h3 class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <ng-icon name="lucideMapPin" class="size-3.5 text-primary" />
                  <span>Endereço (OpenCage Geocoder via CEP)</span>
                </h3>
                <button
                  hlmBtn
                  type="button"
                  variant="outline"
                  size="xs"
                  class="gap-1.5"
                  [disabled]="isGeocoding()"
                  (click)="onPreviewGeocode()"
                >
                  <ng-icon name="lucideEye" class="text-xs" />
                  <span>{{ isGeocoding() ? 'Resolvendo...' : 'Simular / Ver no Mapa' }}</span>
                </button>
              </div>
              <div formGroupName="address" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                  <label hlmLabel for="cep">CEP</label>
                  <input
                    hlmInput
                    id="cep"
                    type="text"
                    formControlName="cep"
                    placeholder="01310-100"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1.5">
                  <label hlmLabel for="number">Número</label>
                  <input
                    hlmInput
                    id="number"
                    type="text"
                    formControlName="number"
                    placeholder="1000"
                    class="w-full"
                  />
                </div>

                <div class="space-y-1.5">
                  <label hlmLabel for="complement">Complemento</label>
                  <input
                    hlmInput
                    id="complement"
                    type="text"
                    formControlName="complement"
                    placeholder="Apto 42"
                    class="w-full"
                  />
                </div>
              </div>

              @if (addressPreview(); as preview) {
                <div class="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-primary flex items-center gap-1.5">
                      <ng-icon name="lucideCheckCircle2" class="text-xs" />
                      <span>Preview do Endereço Resolvido (/addresses/geocode)</span>
                    </span>
                    <button
                      type="button"
                      class="text-muted-foreground hover:text-foreground"
                      (click)="addressPreview.set(null)"
                    >
                      <ng-icon name="lucideX" class="text-xs" />
                    </button>
                  </div>
                  <p class="font-medium text-foreground">{{ formatAddress(preview) }}</p>
                  @if (preview.latitude != null && preview.longitude != null) {
                    <p class="text-[11px] font-mono text-muted-foreground">
                      Coordenadas: {{ preview.latitude | number:'1.6-6' }}, {{ preview.longitude | number:'1.6-6' }}
                    </p>
                  }
                  <div class="flex flex-wrap items-center gap-2 pt-1">
                    @if (googleMapsUrl(preview); as gUrl) {
                      <a
                        [href]="gUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-semibold hover:opacity-90 transition"
                      >
                        <ng-icon name="lucideMap" class="text-xs" />
                        <span>Abrir no Google Maps</span>
                        <ng-icon name="lucideExternalLink" class="text-[10px]" />
                      </a>
                    }
                    @if (openStreetMapUrl(preview); as osmUrl) {
                      <a
                        [href]="osmUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 rounded-md bg-background border border-border text-foreground px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition"
                      >
                        <ng-icon name="lucideCompass" class="text-xs" />
                        <span>Ver Pino no OpenStreetMap</span>
                        <ng-icon name="lucideExternalLink" class="text-[10px]" />
                      </a>
                    }
                  </div>
                </div>
              }
            </div>

            <button
              hlmBtn
              type="submit"
              class="w-full shadow-md"
              [disabled]="registerForm.invalid || isLoading()"
            >
              @if (isLoading()) {
                <span>Criando Conta...</span>
              } @else {
                <span>Finalizar Cadastro como {{ selectedRole() }}</span>
              }
            </button>
          </form>
        </div>

        <div hlmCardFooter class="justify-center text-xs text-muted-foreground border-t border-border/60 pt-4">
          Já possui uma conta?
          <a routerLink="/login" class="text-primary font-semibold hover:underline ml-1">
            Fazer Login
          </a>
        </div>
      </div>
    </div>
  `,
})
export class RegisterClientComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly addressService = inject(AddressService);
  private readonly router = inject(Router);

  protected readonly formatAddress = getFormattedAddress;
  protected readonly googleMapsUrl = getGoogleMapsUrl;
  protected readonly openStreetMapUrl = getOpenStreetMapUrl;

  protected readonly isLoading = signal(false);
  protected readonly isGeocoding = signal(false);
  protected readonly addressPreview = signal<AddressResponse | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly selectedRole = signal<UserRole>('CLIENT');

  protected readonly roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'CLIENT', label: 'Cliente', icon: 'lucideShoppingBag' },
    { value: 'RESTAURANT', label: 'Restaurante', icon: 'lucideChefHat' },
    { value: 'COURIER', label: 'Entregador', icon: 'lucideBike' },
  ];

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required]],
    cpf: [''],
    address: this.fb.group({
      cep: [''],
      number: [''],
      complement: [''],
    }),
  });

  onPreviewGeocode(): void {
    const addr = this.registerForm.get('address')?.getRawValue();
    if (!addr?.cep?.trim() || !addr?.number?.trim()) {
      this.errorMessage.set('Informe o CEP e o número para simular a resolução de endereço.');
      return;
    }

    this.isGeocoding.set(true);
    this.errorMessage.set(null);

    this.addressService
      .geocodePreview({
        cep: addr.cep.trim(),
        number: addr.number.trim(),
        complement: addr.complement?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isGeocoding.set(false);
          this.addressPreview.set(res);
        },
        error: (err: HttpErrorResponse) => {
          this.isGeocoding.set(false);
          const problem = err.error as ProblemDetail | undefined;
          this.errorMessage.set(problem?.detail || 'Não foi possível resolver o CEP informado.');
        },
      });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.registerForm.getRawValue();

    const payload: UserRequest = {
      name: val.name!,
      email: val.email!,
      password: val.password!,
      phone: val.phone!,
      cpf: val.cpf || undefined,
      role: this.selectedRole(),
    };

    if (val.address?.cep && val.address?.number) {
      payload.address = {
        cep: val.address.cep,
        number: val.address.number,
        complement: val.address.complement || undefined,
      };
    }

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Cadastro realizado com sucesso! Conectando...');
        this.authService.login({ email: payload.email, password: payload.password }).subscribe({
          next: () => {
            if (this.selectedRole() === 'RESTAURANT') {
              this.router.navigate(['/register/restaurant']);
            } else {
              this.router.navigate(['/restaurants']);
            }
          },
          error: () => this.router.navigate(['/login']),
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const problem = err.error as ProblemDetail | undefined;
        let detail = problem?.detail || 'Erro ao realizar cadastro.';
        if (problem?.invalidParameters) {
          const params = Object.values(problem.invalidParameters).join(' ');
          detail = `${detail} ${params}`;
        }
        this.errorMessage.set(detail);
      },
    });
  }
}
