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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BillSplitterService, SeoService, ThemeService, ThemeMode } from './services';
import { PwaInstallPromptComponent } from './components/pwa-install-prompt/pwa-install-prompt';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AsyncPipe,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
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

  readonly themeMode = this.themeService.mode;
  readonly themeIcon = computed(() => {
    const mode = this.themeService.mode();
    if (mode === 'light') return 'light_mode';
    if (mode === 'dark') return 'dark_mode';
    return 'brightness_auto';
  });

  sidebarOpen = false;
  user$: Observable<AuthUser | null>;

  constructor() {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    this.seoService.generateTags();
  }

  setTheme(mode: ThemeMode) {
    this.themeService.setMode(mode);
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
