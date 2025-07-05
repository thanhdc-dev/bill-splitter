import { Routes } from '@angular/router';
import { BillSplitterComponent } from './components/bill-splitter/bill-splitter';
import { OauthCallback } from './components/oauth-callback/oauth-callback';
import { Bills } from './components/bills/bills';
import { authGuard } from './guards/auth-guard';
import { CreateBill } from './components/create-bill/create-bill';
import { BillDetails } from './components/bill-details/bill-details';

export const routes: Routes = [
  { path: 'bills', component: Bills, canActivate: [authGuard] },
  { path: 'auth/:provider/callback', component: OauthCallback },
  { path: '', component: CreateBill },
  { path: ':code', component: BillDetails },
];
