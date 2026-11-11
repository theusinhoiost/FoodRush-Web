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
  templateUrl: './register-client.component.html',
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
