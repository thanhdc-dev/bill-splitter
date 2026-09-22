import { AuthUser } from './models/auth.model';
import { Observable } from 'rxjs';
import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LoginDialogComponent } from './components/login-dialog/login-dialog';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BillSplitterService, SeoService, ThemeService } from './services';
import { PwaInstallPromptComponent } from './components/pwa-install-prompt/pwa-install-prompt';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AsyncPipe,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    PwaInstallPromptComponent,
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
  private readonly themeService = inject(ThemeService);

  // Icon/label thể hiện giao diện SẼ chuyển tới khi bấm, không phải giao diện hiện tại.
  readonly themeIcon = computed(() =>
    this.themeService.mode() === 'dark' ? 'light_mode' : 'dark_mode'
  );
  readonly themeToggleLabel = computed(() =>
    this.themeService.mode() === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'
  );

  sidebarOpen = false;
  user$: Observable<AuthUser | null>;

  constructor() {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    this.seoService.generateTags();
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  openLoginPopup(): void {
    if (!this.billSplitterService.isBillDataEmpty()) {
      this.billSplitterService.saveBillToStorage();
    }
    this.dialog.open(LoginDialogComponent);
  }

  redirectToList() {
    this.router.navigate(['/bills']);
    this.closeSidebar();
  }

  redirectToSetting() {
    this.router.navigate(['/setting']);
    this.closeSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeSidebar();
  }
}
