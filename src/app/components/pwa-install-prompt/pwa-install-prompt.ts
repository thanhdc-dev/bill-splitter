import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './pwa-install-prompt.html',
  styleUrl: './pwa-install-prompt.scss'
})
export class PwaInstallPromptComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);

  showInstallPrompt = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deferredPrompt: any;

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallPrompt = true;
    });
  }

  async installPwa() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.snackBar.open('Cảm ơn bạn đã cài đặt!', 'Đóng', {
        duration: 3000,
      });
    }

    this.deferredPrompt = null;
    this.showInstallPrompt = false;
  }

  dismissPrompt() {
    this.showInstallPrompt = false;
  }
}
