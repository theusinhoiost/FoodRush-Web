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
  template: `
    <div class="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight">
            {{ isAdmin() ? 'Meu Perfil, Usuários & Endereços' : 'Meu Perfil' }}
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{ isAdmin()
              ? 'Atualize seus dados cadastrais, gerencie contas ativas e consulte o serviço padronizado de endereços e geocodificação'
              : 'Visualize e atualize seus dados cadastrais e endereço principal' }}
          </p>
        </div>

        @if (isAdmin()) {
          <div class="inline-flex rounded-xl border border-border bg-muted/50 p-1 self-start">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              [class]="
                rightPanelTab() === 'USERS'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              "
              (click)="rightPanelTab.set('USERS')"
            >
              <ng-icon name="lucideUser" class="text-sm" />
              <span>Usuários ({{ users().length }})</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              [class]="
                rightPanelTab() === 'ADDRESSES'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              "
              (click)="switchToAddressesTab()"
            >
              <ng-icon name="lucideMapPin" class="text-sm text-primary" />
              <span>Endereços & Geocoding ({{ addresses().length }})</span>
            </button>
          </div>
        }
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
        <div [class]="isAdmin() ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start' : 'max-w-2xl mx-auto'">
          <!-- Left Column / Main Profile Card -->
          <div [class]="isAdmin() ? 'lg:col-span-5' : 'w-full'">
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

              @if (authService.currentUser()?.address; as currAddr) {
                <div class="rounded-xl bg-muted/40 border border-border/70 p-3.5 space-y-2 text-xs">
                  <div class="font-bold text-foreground flex items-center gap-1.5">
                    <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0" />
                    <span>Endereço Atual Cadastrado</span>
                  </div>
                  <p class="text-muted-foreground leading-relaxed">
                    {{ formatAddress(currAddr) }}
                  </p>
                  @if (currAddr.latitude != null && currAddr.longitude != null) {
                    <p class="text-[11px] font-mono text-muted-foreground">
                      Lat/Lng: {{ currAddr.latitude | number:'1.6-6' }}, {{ currAddr.longitude | number:'1.6-6' }}
                    </p>
                  }
                  <div class="flex flex-wrap items-center gap-2 pt-0.5">
                    @if (googleMapsUrl(currAddr); as gUrl) {
                      <a
                        [href]="gUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 text-[11px] font-semibold transition-colors"
                      >
                        <ng-icon name="lucideMap" class="text-xs" />
                        <span>Google Maps</span>
                        <ng-icon name="lucideExternalLink" class="text-[10px]" />
                      </a>
                    }
                    @if (openStreetMapUrl(currAddr); as osmUrl) {
                      <a
                        [href]="osmUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 rounded-md bg-background hover:bg-muted text-foreground px-2 py-0.5 text-[11px] font-medium border border-border transition-colors"
                      >
                        <ng-icon name="lucideCompass" class="text-xs" />
                        <span>OpenStreetMap</span>
                        <ng-icon name="lucideExternalLink" class="text-[10px]" />
                      </a>
                    }
                  </div>
                </div>
              }

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
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ng-icon name="lucideMapPin" class="text-xs text-primary" />
                      <span>Endereço Principal</span>
                    </h3>
                    <button
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="xs"
                      class="gap-1"
                      [disabled]="isPreviewingProfileAddress()"
                      (click)="onPreviewProfileAddress()"
                    >
                      <ng-icon name="lucideEye" class="text-xs" />
                      <span>{{ isPreviewingProfileAddress() ? 'Resolvendo...' : 'Preview Mapa' }}</span>
                    </button>
                  </div>
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

                  @if (profileAddressPreview(); as preview) {
                    <div class="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1.5 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-primary">Preview do Endereço</span>
                        <button type="button" (click)="profileAddressPreview.set(null)">
                          <ng-icon name="lucideX" class="text-xs text-muted-foreground" />
                        </button>
                      </div>
                      <p class="text-foreground font-medium">{{ formatAddress(preview) }}</p>
                      @if (preview.latitude != null && preview.longitude != null) {
                        <p class="text-[10px] font-mono text-muted-foreground">
                          Coords: {{ preview.latitude | number:'1.6-6' }}, {{ preview.longitude | number:'1.6-6' }}
                        </p>
                      }
                      <div class="flex flex-wrap gap-2 pt-1">
                        @if (googleMapsUrl(preview); as gUrl) {
                          <a
                            [href]="gUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 rounded bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-semibold"
                          >
                            <ng-icon name="lucideMap" class="text-[10px]" />
                            <span>Google Maps</span>
                            <ng-icon name="lucideExternalLink" class="text-[9px]" />
                          </a>
                        }
                        @if (openStreetMapUrl(preview); as osmUrl) {
                          <a
                            [href]="osmUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 rounded bg-background border border-border px-2 py-0.5 text-[10px] font-medium"
                          >
                            <ng-icon name="lucideCompass" class="text-[10px]" />
                            <span>OpenStreetMap</span>
                            <ng-icon name="lucideExternalLink" class="text-[9px]" />
                          </a>
                        }
                      </div>
                    </div>
                  }
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

          @if (isAdmin()) {
            <!-- Right Column: Users OR Addresses (Admin Only) -->
            <div class="lg:col-span-7 space-y-4">
            @if (rightPanelTab() === 'USERS') {
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-bold">Usuários Cadastrados ({{ users().length }})</h2>
                  <p class="text-xs text-muted-foreground">
                    Gerenciamento de contas, endereço completo formatado e status ativo via <code>/api/v1/users</code>
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
                    <div class="space-y-1.5">
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
                        <div class="space-y-1 pt-0.5">
                          <p class="text-[11px] text-foreground/90 flex items-start gap-1">
                            <ng-icon name="lucideMapPin" class="text-xs text-primary shrink-0 mt-0.5" />
                            <span>{{ formatAddress(u.address) }}</span>
                          </p>
                          <div class="flex flex-wrap items-center gap-2 pl-4">
                            @if (u.address.latitude != null && u.address.longitude != null) {
                              <span class="text-[10px] font-mono text-muted-foreground">
                                ({{ u.address.latitude | number:'1.6-6' }}, {{ u.address.longitude | number:'1.6-6' }})
                              </span>
                            }
                            @if (googleMapsUrl(u.address); as gUrl) {
                              <a
                                [href]="gUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                              >
                                <ng-icon name="lucideMap" class="text-[10px]" />
                                <span>Google Maps</span>
                              </a>
                            }
                            @if (openStreetMapUrl(u.address); as osmUrl) {
                              <a
                                [href]="osmUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                              >
                                <ng-icon name="lucideCompass" class="text-[10px]" />
                                <span>OpenStreetMap</span>
                              </a>
                            }
                          </div>
                        </div>
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
            } @else {
              <!-- ADDRESSES & GEOCODING PANEL (/api/v1/addresses) -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-bold">Serviço de Endereços & Geocoding</h2>
                    <p class="text-xs text-muted-foreground">
                      Endpoints padronizados <code>/api/v1/addresses</code> e <code>/api/v1/addresses/geocode</code>
                    </p>
                  </div>
                  <button hlmBtn variant="outline" size="xs" class="gap-1.5" (click)="loadAddresses()">
                    <ng-icon name="lucideRefreshCw" class="text-xs" />
                    <span>Listar Todos</span>
                  </button>
                </div>

                @if (addressError()) {
                  <div class="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {{ addressError() }}
                  </div>
                }

                <!-- Geocode Preview & Create Address Card -->
                <div hlmCard class="rounded-2xl border-border p-4 space-y-4">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ng-icon name="lucideCompass" class="text-sm text-primary" />
                    <span>Resolver CEP + Número (OpenCage Geocoder)</span>
                  </h3>

                  <form [formGroup]="standaloneAddressForm" class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div class="space-y-1">
                        <label hlmLabel class="text-xs">CEP *</label>
                        <input hlmInput formControlName="cep" placeholder="01001-000" class="w-full" />
                      </div>
                      <div class="space-y-1">
                        <label hlmLabel class="text-xs">Número *</label>
                        <input hlmInput formControlName="number" placeholder="100" class="w-full" />
                      </div>
                      <div class="space-y-1">
                        <label hlmLabel class="text-xs">Complemento</label>
                        <input hlmInput formControlName="complement" placeholder="Loja 1" class="w-full" />
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        hlmBtn
                        type="button"
                        variant="outline"
                        size="xs"
                        class="gap-1.5"
                        [disabled]="standaloneAddressForm.invalid || isAddressActionLoading()"
                        (click)="onStandaloneGeocodePreview()"
                      >
                        <ng-icon name="lucideEye" class="text-xs" />
                        <span>Preview sem Salvar (POST /geocode)</span>
                      </button>

                      <button
                        hlmBtn
                        type="button"
                        size="xs"
                        class="gap-1.5"
                        [disabled]="standaloneAddressForm.invalid || isAddressActionLoading()"
                        (click)="onCreateStandaloneAddress()"
                      >
                        <ng-icon name="lucidePlus" class="text-xs" />
                        <span>Resolver e Salvar no Banco (POST /addresses)</span>
                      </button>
                    </div>
                  </form>

                  <!-- Lookup by UUID (GET /api/v1/addresses/{id}) -->
                  <div class="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      hlmInput
                      type="text"
                      [(ngModel)]="searchAddressId"
                      placeholder="Buscar endereço por UUID (GET /api/v1/addresses/{id})"
                      class="flex-1 text-xs h-8"
                    />
                    <button
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="xs"
                      class="gap-1.5"
                      (click)="onFindAddressById()"
                    >
                      <ng-icon name="lucideSearch" class="text-xs" />
                      <span>Buscar UUID</span>
                    </button>
                  </div>

                  <!-- Highlighted Preview / Selected Address Result -->
                  @if (highlightedAddress(); as highlighted) {
                    <div class="rounded-xl border border-primary/40 bg-primary/5 p-3.5 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-primary flex items-center gap-1.5">
                          <ng-icon name="lucideCheckCircle2" class="text-xs" />
                          <span>{{ highlightedAddressTitle() }}</span>
                        </span>
                        <button type="button" (click)="highlightedAddress.set(null)">
                          <ng-icon name="lucideX" class="text-xs text-muted-foreground" />
                        </button>
                      </div>
                      <p class="font-semibold text-foreground">{{ formatAddress(highlighted) }}</p>
                      @if (highlighted.latitude != null && highlighted.longitude != null) {
                        <p class="text-[11px] font-mono text-muted-foreground">
                          Latitude: {{ highlighted.latitude | number:'1.6-6' }} | Longitude: {{ highlighted.longitude | number:'1.6-6' }}
                        </p>
                      }
                      @if (highlighted.id) {
                        <p class="text-[10px] font-mono text-muted-foreground">UUID: {{ highlighted.id }}</p>
                      }
                      <div class="flex flex-wrap items-center gap-2 pt-1">
                        @if (googleMapsUrl(highlighted); as gUrl) {
                          <a
                            [href]="gUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-[11px] font-semibold"
                          >
                            <ng-icon name="lucideMap" class="text-xs" />
                            <span>Ver no Google Maps</span>
                            <ng-icon name="lucideExternalLink" class="text-[10px]" />
                          </a>
                        }
                        @if (openStreetMapUrl(highlighted); as osmUrl) {
                          <a
                            [href]="osmUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 rounded-md bg-background border border-border text-foreground px-2.5 py-1 text-[11px] font-medium"
                          >
                            <ng-icon name="lucideCompass" class="text-xs" />
                            <span>Pino no OpenStreetMap</span>
                            <ng-icon name="lucideExternalLink" class="text-[10px]" />
                          </a>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Saved Addresses List (GET /api/v1/addresses) -->
                <div class="space-y-3">
                  @for (addr of addresses(); track addr.id) {
                    <div hlmCard class="rounded-2xl border-border/80 p-4 space-y-2">
                      <div class="flex items-start justify-between gap-2">
                        <p class="text-xs font-bold text-foreground flex items-start gap-1.5">
                          <ng-icon name="lucideMapPin" class="text-sm text-primary shrink-0 mt-0.5" />
                          <span>{{ formatAddress(addr) }}</span>
                        </p>
                        <span hlmBadge variant="secondary" class="text-[10px] shrink-0">
                          CEP: {{ addr.cep }}
                        </span>
                      </div>

                      <div class="flex flex-wrap items-center justify-between gap-2 pl-5 text-[11px] text-muted-foreground">
                        <div class="space-x-3 font-mono">
                          @if (addr.latitude != null && addr.longitude != null) {
                            <span>Lat: {{ addr.latitude | number:'1.6-6' }}</span>
                            <span>Lng: {{ addr.longitude | number:'1.6-6' }}</span>
                          }
                          @if (addr.id) {
                            <span class="text-[10px]">UUID: {{ addr.id.slice(0, 8) }}...</span>
                          }
                        </div>

                        <div class="flex items-center gap-2">
                          @if (googleMapsUrl(addr); as gUrl) {
                            <a
                              [href]="gUrl"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 text-[11px] font-semibold transition-colors"
                            >
                              <ng-icon name="lucideMap" class="text-xs" />
                              <span>Google Maps</span>
                              <ng-icon name="lucideExternalLink" class="text-[10px]" />
                            </a>
                          }
                          @if (openStreetMapUrl(addr); as osmUrl) {
                            <a
                              [href]="osmUrl"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 rounded-md bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 text-[11px] font-medium border border-border transition-colors"
                            >
                              <ng-icon name="lucideCompass" class="text-xs" />
                              <span>OpenStreetMap</span>
                              <ng-icon name="lucideExternalLink" class="text-[10px]" />
                            </a>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
      }
    </div>
  `,
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
