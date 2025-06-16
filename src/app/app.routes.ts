import { Routes } from '@angular/router';
import { BillSplitterComponent } from './components/bill-splitter/bill-splitter';
import { OauthCallback } from './components/oauth-callback/oauth-callback';
import { Bills } from './components/bills/bills';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'bills', component: Bills, canActivate: [authGuard] },
  { path: 'auth/:provider/callback', component: OauthCallback },
  { path: '', component: BillSplitterComponent },
  { path: ':code', component: BillSplitterComponent },
];
