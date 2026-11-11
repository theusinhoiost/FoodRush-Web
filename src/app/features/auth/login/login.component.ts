import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../core/models';
import { NgIcon } from '@ng-icons/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmCardImports,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    NgIcon,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showQuickLogin = environment.enableQuickLogin;

  protected readonly demoAccounts = [
    { label: 'Cliente', email: 'cliente@foodrush.com', icon: 'lucideShoppingBag' },
    { label: 'Restaurante', email: 'restaurante@foodrush.com', icon: 'lucideChefHat' },
    { label: 'Entregador', email: 'entregador@foodrush.com', icon: 'lucideBike' },
    { label: 'Admin', email: 'admin@foodrush.com', icon: 'lucideShieldCheck' },
  ];

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  fillDemoAccount(email: string): void {
    this.loginForm.patchValue({ email, password: '123456' });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/restaurants']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const problem = err.error as ProblemDetail | undefined;
        this.errorMessage.set(
          problem?.detail || 'Erro ao realizar login. Verifique seu e-mail e senha.',
        );
      },
    });
  }
}
