import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'restaurants',
    pathMatch: 'full',
  },
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./features/restaurants/restaurant-list/restaurant-list.component').then(
        (m) => m.RestaurantListComponent
      ),
  },
  {
    path: 'restaurants/:id',
    loadComponent: () =>
      import('./features/restaurants/restaurant-detail/restaurant-detail.component').then(
        (m) => m.RestaurantDetailComponent
      ),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/order-list/order-list.component').then(
        (m) => m.OrderListComponent
      ),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./features/orders/order-detail/order-detail.component').then(
        (m) => m.OrderDetailComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register/client',
    loadComponent: () =>
      import('./features/auth/register-client/register-client.component').then(
        (m) => m.RegisterClientComponent
      ),
  },
  {
    path: 'register/restaurant',
    loadComponent: () =>
      import('./features/restaurants/register-restaurant/register-restaurant.component').then(
        (m) => m.RegisterRestaurantComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'restaurants',
  },
];
