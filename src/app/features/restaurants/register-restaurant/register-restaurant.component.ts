import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
  templateUrl: './register-restaurant.component.html',
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

  protected readonly isAdmin = computed(() => {
    return this.authService.currentUser()?.role === 'ADMIN';
  });

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
    const user = this.authService.currentUser();
    if (!this.restaurantForm.get('ownerId')?.value && user?.id) {
      this.restaurantForm.patchValue({ ownerId: user.id });
    }

    if (this.restaurantForm.invalid) {
      this.restaurantForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const val = this.restaurantForm.getRawValue();
    const ownerId = val.ownerId?.trim() || user?.id;

    if (!ownerId) {
      this.errorMessage.set('Usuário não autenticado para definir o proprietário.');
      this.isLoading.set(false);
      return;
    }

    const payload: RestaurantRequest = {
      ownerId,
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
