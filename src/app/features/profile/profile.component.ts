import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AddressService } from '../../core/services/address.service';
import {
  AddressResponse,
  ProblemDetail,
  UserPatchRequest,
  UserResponse,
  getFormattedAddress,
  getGoogleMapsUrl,
  getOpenStreetMapUrl,
} from '../../core/models';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe,
    RouterLink,
    HlmCardImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    NgIcon,
  ],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly addressService = inject(AddressService);

  protected readonly isAdmin = computed(() => {
    return this.authService.currentUser()?.role === 'ADMIN';
  });

  protected readonly formatAddress = getFormattedAddress;
  protected readonly googleMapsUrl = getGoogleMapsUrl;
  protected readonly openStreetMapUrl = getOpenStreetMapUrl;

  protected readonly rightPanelTab = signal<'USERS' | 'ADDRESSES'>('USERS');
  protected readonly users = signal<UserResponse[]>([]);
  protected readonly addresses = signal<AddressResponse[]>([]);
  protected readonly isSaving = signal(false);
  protected readonly saveMessage = signal<string | null>(null);

  protected readonly isPreviewingProfileAddress = signal(false);
  protected readonly profileAddressPreview = signal<AddressResponse | null>(null);

  protected readonly isAddressActionLoading = signal(false);
  protected readonly addressError = signal<string | null>(null);
  protected readonly highlightedAddress = signal<AddressResponse | null>(null);
  protected readonly highlightedAddressTitle = signal<string>('Preview do Endereço');
  protected searchAddressId = '';

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

  protected readonly standaloneAddressForm = this.fb.group({
    cep: ['', [Validators.required]],
    number: ['', [Validators.required]],
    complement: [''],
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

    if (this.authService.isAuthenticated() && this.isAdmin()) {
      this.loadUsers();
      this.loadAddresses();
    }
  }

  switchToAddressesTab(): void {
    if (!this.isAdmin()) return;
    this.rightPanelTab.set('ADDRESSES');
    if (this.addresses().length === 0) {
      this.loadAddresses();
    }
  }

  loadUsers(): void {
    if (!this.isAdmin()) return;
    this.userService.findAll().subscribe({
      next: (list) => {
        this.users.set(list);
      },
    });
  }

  loadAddresses(): void {
    if (!this.isAdmin()) return;
    this.addressError.set(null);
    this.addressService.findAll().subscribe({
      next: (list) => {
        this.addresses.set(list);
      },
      error: () => {
        this.addressError.set('Não foi possível carregar a lista de endereços.');
      },
    });
  }

  onPreviewProfileAddress(): void {
    const addr = this.profileForm.get('address')?.getRawValue();
    if (!addr?.cep?.trim() || !addr?.number?.trim()) return;

    this.isPreviewingProfileAddress.set(true);
    this.addressService
      .geocodePreview({
        cep: addr.cep.trim(),
        number: addr.number.trim(),
        complement: addr.complement?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isPreviewingProfileAddress.set(false);
          this.profileAddressPreview.set(res);
        },
        error: () => {
          this.isPreviewingProfileAddress.set(false);
        },
      });
  }

  onStandaloneGeocodePreview(): void {
    if (this.standaloneAddressForm.invalid) return;
    const val = this.standaloneAddressForm.getRawValue();
    this.isAddressActionLoading.set(true);
    this.addressError.set(null);

    this.addressService
      .geocodePreview({
        cep: val.cep!.trim(),
        number: val.number!.trim(),
        complement: val.complement?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.isAddressActionLoading.set(false);
          this.highlightedAddressTitle.set('Preview sem Salvar (POST /api/v1/addresses/geocode)');
          this.highlightedAddress.set(res);
        },
        error: (err: HttpErrorResponse) => {
          this.isAddressActionLoading.set(false);
          const problem = err.error as ProblemDetail | undefined;
          this.addressError.set(problem?.detail || 'Erro ao consultar preview de geocoding.');
        },
      });
  }

  onCreateStandaloneAddress(): void {
    if (this.standaloneAddressForm.invalid) return;
    const val = this.standaloneAddressForm.getRawValue();
    this.isAddressActionLoading.set(true);
    this.addressError.set(null);

    this.addressService
      .create({
        cep: val.cep!.trim(),
        number: val.number!.trim(),
        complement: val.complement?.trim() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.isAddressActionLoading.set(false);
          this.highlightedAddressTitle.set('Endereço Persistido com Sucesso (POST /api/v1/addresses)');
          this.highlightedAddress.set(created);
          this.addresses.update((list) => [created, ...list]);
        },
        error: (err: HttpErrorResponse) => {
          this.isAddressActionLoading.set(false);
          const problem = err.error as ProblemDetail | undefined;
          this.addressError.set(problem?.detail || 'Erro ao salvar endereço.');
        },
      });
  }

  onFindAddressById(): void {
    const id = this.searchAddressId.trim();
    if (!id) return;
    this.addressError.set(null);

    this.addressService.findById(id).subscribe({
      next: (found) => {
        this.highlightedAddressTitle.set('Endereço Encontrado por UUID (GET /api/v1/addresses/{id})');
        this.highlightedAddress.set(found);
      },
      error: (err: HttpErrorResponse) => {
        const problem = err.error as ProblemDetail | undefined;
        this.addressError.set(problem?.detail || 'Endereço não encontrado para o UUID informado.');
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
        if (this.isAdmin()) {
          this.loadUsers();
        }
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  onToggleUserActive(user: UserResponse): void {
    if (!this.isAdmin()) return;
    this.userService.toggleActive(user.id).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      },
    });
  }
}
