import { AuthUser } from './models/auth.model';
import { Observable } from 'rxjs';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LoginDialogComponent } from './components/login-dialog/login-dialog';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BillSplitterService, SeoService } from './services';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AsyncPipe,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly billSplitterService = inject(BillSplitterService);

  sidebarOpen = false;
  user$: Observable<AuthUser | null>;

  constructor() {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    this.seoService.generateTags();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  openLoginPopup(): void {
    this.billSplitterService.saveBillToStorage();
    this.dialog.open(LoginDialogComponent);
  }

  redirectToList() {
    this.router.navigate(['/bills']);
    this.closeSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeSidebar();
  }
}
