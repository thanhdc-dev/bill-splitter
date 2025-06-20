import { AuthUser } from './models/auth.model';
import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LoginDialogComponent } from './components/login-dialog/login-dialog';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Meta, Title } from '@angular/platform-browser';

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
  sidebarOpen = false;
  user$: Observable<AuthUser | null>;

  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit() {
    this.updateMetaTags();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  openLoginPopup(): void {
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

  private updateMetaTags() {
    const _title = 'Chia hóa đơn';
    const _description = 'Bạn cứ chill đi – bill để tôi chia';
    this.title.setTitle(_title);

    // Standard Meta Tags
    this.meta.addTag({ name: 'description', content: _description });
    this.meta.addTag({
      name: 'keywords',
      content: 'Bill splitter, Chia hóa đơn, Thanhdc',
    });

    // Open Graph Meta Tags
    const origin = window.location.origin;
    const thumbnailUrl = `${origin}/thumbnail.webp`;
    this.meta.addTag({ property: 'og:title', content: `${_title} - Home` });
    this.meta.addTag({ property: 'og:description', content: _description });
    this.meta.addTag({ property: 'og:image', content: thumbnailUrl });
  }
}
