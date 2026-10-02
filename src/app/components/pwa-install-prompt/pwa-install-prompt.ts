import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

/** CSS var chứa chiều cao prompt đang hiện — FAB/upload-progress của create-bill, bill-details đọc để né. */
const PROMPT_OFFSET_VAR = '--pwa-prompt-offset';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './pwa-install-prompt.html',
  styleUrl: './pwa-install-prompt.scss'
})
export class PwaInstallPromptComponent implements OnInit, OnDestroy {
  private readonly snackBar = inject(MatSnackBar);
  private resizeObserver?: ResizeObserver;

  showInstallPrompt = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deferredPrompt: any;

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallPrompt = true;
    }, { once: true });
  }

  /** Prompt xuất hiện/biến mất theo `@if` → setter chạy mỗi lần, theo dõi chiều cao để FAB né. */
  @ViewChild('prompt')
  set prompt(ref: ElementRef<HTMLElement> | undefined) {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    const el = ref?.nativeElement;
    if (!el) {
      this.setOffset(0);
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.setOffset(el.offsetHeight));
    this.resizeObserver.observe(el);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.setOffset(0);
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

  private setOffset(height: number) {
    document.documentElement.style.setProperty(PROMPT_OFFSET_VAR, `${height}px`);
  }
}
