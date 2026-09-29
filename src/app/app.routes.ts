import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'setting',
    loadComponent: () => import('./components/setting/setting').then((m) => m.Setting),
    canActivate: [authGuard],
  },
  {
    path: 'bills',
    loadComponent: () => import('./components/bills/bills').then((m) => m.Bills),
    canActivate: [authGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./components/oauth-callback/oauth-callback').then((m) => m.OauthCallback),
  },
  {
    path: '',
    loadComponent: () => import('./components/create-bill/create-bill').then((m) => m.CreateBill),
  },
  {
    path: ':code',
    loadComponent: () => import('./components/bill-details/bill-details').then((m) => m.BillDetails),
  },
];
