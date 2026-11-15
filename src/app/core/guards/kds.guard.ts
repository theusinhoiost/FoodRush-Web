import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const kdsGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.currentUser()?.role;
  if (role === 'RESTAURANT' || role === 'ADMIN') {
    return true;
  }

  router.navigate(['/restaurants']);
  return false;
};
