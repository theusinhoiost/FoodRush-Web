import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AddressService } from '../../../core/services/address.service';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AddressResponse,
  ProblemDetail,
  RestaurantRequest,
  getFormattedAddress,
  getGoogleMapsUrl,
  getOpenStreetMapUrl,
} from '../../../core/models';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-register-restaurant',
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
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div hlmCard class="w-full max-w-2xl shadow-lg border-border">
        <div hlmCardHeader class="space-y-1 text-center">
          <h2 hlmCardTitle class="text-2xl font-bold tracking-tight">Cadastrar Restaurante Parceiro</h2>
          <p hlmCardDescription class="text-sm text-muted-foreground">
            Expanda seu negócio e receba pedidos no FoodRush
          </p>
        </div>

        <div hlmCardContent>
          @if (!authService.isAuthenticated()) {
            <div class="mb-6 rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
              <p class="font-medium mb-1">Atenção: Autenticação Necessária</p>
              <p>
                Para cadastrar um restaurante você precisa estar autenticado no sistema.
              </p>
              <div class="mt-3 flex gap-2">
                <a routerLink="/login" hlmBtn size="sm">Fazer Login</a>
                <a routerLink="/register/client" hlmBtn variant="outline" size="sm">Criar Conta</a>
              </div>
            </div>
          }

          @if (errorMessage()) {
            <div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {{ errorMessage() }}
            </div>
          }
          @if (successMessage()) {
            <div class="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
              {{ successMessage() }}
            </div>
          }

          <form [formGroup]="restaurantForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Dados do Restaurante -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label hlmLabel for="tradeName">Nome Fantasia *</label>
                <input
                  hlmInput
                  id="tradeName"
                  type="text"
                  formControlName="tradeName"
                  placeholder="Ex: Burger Artesanal FoodRush"
                  class="w-full"
                />
                @if (restaurantForm.get('tradeName')?.touched && restaurantForm.get('tradeName')?.hasError('required')) {
                  <span class="text-xs text-destructive">Nome fantasia é obrigatório.</span>
                }
              </div>

              <div class="space-y-1.5">
                <label hlmLabel for="cnpj">CNPJ (14 dígitos) *</label>
                <input
                  hlmInput
                  id="cnpj"
                  type="text"
                  formControlName="cnpj"
                  placeholder="48555407000133"
                  class="w-full"
                />
                @if (restaurantForm.get('cnpj')?.touched && restaurantForm.get('cnpj')?.hasError('required')) {
                  <span class="text-xs text-destructive">CNPJ é obrigatório.</span>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label hlmLabel for="phone">Telefone / WhatsApp *</label>
                <input
                  hlmInput
                  id="phone"
                  type="text"
                  formControlName="phone"
                  placeholder="11988881111"
                  class="w-full"
                />
                @if (restaurantForm.get('phone')?.touched && restaurantForm.get('phone')?.hasError('required')) {
                  <span class="text-xs text-destructive">Telefone é obrigatório.</span>
                }
              </div>

              <div class="space-y-1.5">
                <label hlmLabel for="baseDeliveryFee">Taxa Base de Entrega (R$) *</label>
                <input
                  hlmInput
                  id="baseDeliveryFee"
                  type="number"
                  step="0.10"
                  min="0"
                  formControlName="baseDeliveryFee"
                  placeholder="6.90"
                  class="w-full"
                />
                @if (restaurantForm.get('baseDeliveryFee')?.touched && restaurantForm.get('baseDeliveryFee')?.hasError('required')) {
                  <span class="text-xs text-destructive">Taxa de entrega é obrigatória.</span>
                }
              </div>
            </div>

            <div class="space-y-1.5">
              <label hlmLabel for="ownerId">ID do Proprietário (UUID) *</label>
              <input
                hlmInput
                id="ownerId"
                type="text"
                formControlName="ownerId"
                placeholder="22222222-2222-2222-2222-222222222222"
                class="w-full"
              />
              <span class="text-xs text-muted-foreground">
                Preenchido automaticamente com o usuário autenticado ou informe o UUID do proprietário.
              </span>
            </div>

            <!-- Endereço do Estabelecimento -->
            <div class="pt-2 border-t border-border space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 class="text-sm font-semibold text-foreground">Endereço do Estabelecimento *</h3>
                  <p class="text-xs text-muted-foreground">
                    Rua, bairro, cidade e coordenadas (OpenCage Geocoder) são calculados automaticamente a partir do CEP.
                  </p>
                </div>
                <button
                  hlmBtn
                  type="button"
                  variant="outline"
                  size="xs"
                  class="gap-1.5 self-start sm:self-center shrink-0"
                  [disabled]="isGeocoding()"
                  (click)="onPreviewGeocode()"
                >
                  <ng-icon name="lucideEye" class="text-xs" />
                  <span>{{ isGeocoding() ? 'Resolvendo...' : 'Preview no Mapa' }}</span>
                </button>
              </div>
              <div formGroupName="address" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-1.5">
                  <label hlmLabel for="cep">CEP *</label>
                  <input
                    hlmInput
                    id="cep"
                    type="text"
                    formControlName="cep"
                    placeholder="01001-000"
                    class="w-full"
                  />
                  @if (restaurantForm.get('address.cep')?.touched && restaurantForm.get('address.cep')?.hasError('required')) {
                    <span class="text-xs text-destructive">CEP é obrigatório.</span>
                  }
                </div>

                <div class="space-y-1.5">
                  <label hlmLabel for="number">Número *</label>
                  <input
                    hlmInput
                    id="number"
                    type="text"
                    formControlName="number"
                    placeholder="100"
                    class="w-full"
                  />
                  @if (restaurantForm.get('address.number')?.touched && restaurantForm.get('address.number')?.hasError('required')) {
                    <span class="text-xs text-destructive">Número é obrigatório.</span>
                  }
                </div>

                <div class="space-y-1.5">
                  <label hlmLabel for="complement">Complemento</label>
                  <input
                    hlmInput
                    id="complement"
                    type="text"
                    formControlName="complement"
                    placeholder="Loja 1 / Galpão B"
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
              class="w-full mt-4"
              [disabled]="restaurantForm.invalid || isLoading() || !authService.isAuthenticated()"
            >
              @if (isLoading()) {
                <span>Cadastrando Restaurante...</span>
              } @else {
                <span>Cadastrar Restaurante</span>
              }
            </button>
          </form>
        </div>

        <div hlmCardFooter class="justify-center text-sm text-muted-foreground">
          <a routerLink="/restaurants" class="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
            <ng-icon name="lucideArrowLeft" class="text-sm" />
            <span>Voltar para listagem de restaurantes</span>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class RegisterRestaurantComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly restaurantService = inject(RestaurantService);
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

  protected readonly restaurantForm = this.fb.group({
    ownerId: ['', [Validators.required]],
    tradeName: ['', [Validators.required, Validators.maxLength(120)]],
    cnpj: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    baseDeliveryFee: [6.9, [Validators.required, Validators.min(0)]],
    address: this.fb.group({
      cep: ['', [Validators.required]],
      number: ['', [Validators.required]],
      complement: [''],
    }),
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.id) {
      this.restaurantForm.patchValue({ ownerId: user.id });
    }
  }

  onPreviewGeocode(): void {
    const addr = this.restaurantForm.get('address')?.getRawValue();
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
    if (this.restaurantForm.invalid) {
      this.restaurantForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.restaurantForm.getRawValue();

    const payload: RestaurantRequest = {
      ownerId: val.ownerId!,
      tradeName: val.tradeName!,
      cnpj: val.cnpj!,
      phone: val.phone!,
      baseDeliveryFee: Number(val.baseDeliveryFee),
      address: {
        cep: val.address!.cep!,
        number: val.address!.number!,
        complement: val.address?.complement || undefined,
      },
    };

    this.restaurantService.create(payload).subscribe({
      next: (created) => {
        this.isLoading.set(false);
        this.successMessage.set(`Restaurante "${created.tradeName}" cadastrado com sucesso!`);
        setTimeout(() => {
          this.router.navigate(['/restaurants']);
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const problem = err.error as ProblemDetail | undefined;
        let detail = problem?.detail || 'Erro ao cadastrar restaurante.';
        if (problem?.invalidParameters) {
          const params = Object.values(problem.invalidParameters).join(' ');
          detail = `${detail} ${params}`;
        }
        this.errorMessage.set(detail);
      },
    });
  }
}

