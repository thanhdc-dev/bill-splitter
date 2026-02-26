import { inject, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { BillSplitterService } from './bill-splitter.service';

@Injectable({
  providedIn: 'root',
})
export class BillAutoSaveService implements OnDestroy {
  private intervalSub?: Subscription;
  private countdownSub?: Subscription;
  private readonly saveTimer?: number;
  private readonly router = inject(Router);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly counterSubject = new BehaviorSubject<number>(0);
  public counter$ = this.counterSubject.asObservable();

  private countdownSeconds = 0;
  private readonly SAVE_DELAY = 3; // 3s

  ngOnDestroy() {
    this.stopMonitoring();
  }

  stopMonitoring() {
    this.intervalSub?.unsubscribe();
    this.stopCountdown();
    clearTimeout(this.saveTimer);
    this.counterSubject.complete();
  }

  startMonitoring() {
    if (this.billSplitterService.isEditable()) {
      this.intervalSub = this.billSplitterService.isChange$.subscribe(
        (isChange) => {
          if (isChange) {
            // Nếu có thay đổi → reset timer và counter
            this.resetTimer();
            this.startCountdown();
          }
        }
      );
    }
  }

  private resetTimer() {
    clearTimeout(this.saveTimer);
    this.stopCountdown();
  }

  private startCountdown() {
    this.countdownSeconds = this.SAVE_DELAY; // Bắt đầu từ 3 giây
    this.counterSubject.next(this.countdownSeconds);

    // Đếm ngược mỗi giây
    this.countdownSub = interval(1000).subscribe(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds >= 0) {
        console.log(`Countdown: ${this.countdownSeconds} seconds remaining`);
        this.counterSubject.next(this.countdownSeconds);
      } else {
        this.stopCountdown();
      }
    });
  }

  stopCountdown() {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
      this.countdownSub = undefined;
    }
    this.counterSubject.next(0); // Reset counter về 0
  }

  private isOnBillDetailPage(): boolean {
    const currentUrl = this.router.url;
    return (
      !currentUrl.startsWith('/bills') &&
      !currentUrl.startsWith('/auth') &&
      currentUrl !== '/'
    );
  }
}
