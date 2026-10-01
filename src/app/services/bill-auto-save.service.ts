import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription, timer } from 'rxjs';
import { filter, map, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { BillSplitterService } from './bill-splitter.service';

@Injectable({
  providedIn: 'root',
})
export class BillAutoSaveService implements OnDestroy {
  private readonly router = inject(Router);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly ngZone = inject(NgZone);
  
  private monitorSub?: Subscription;
  private readonly counterSubject = new BehaviorSubject<number>(0);
  public counter$ = this.counterSubject.asObservable();
  
  // Tín hiệu hủy bộ đếm thủ công
  private cancel$ = new Subject<void>();

  private readonly SAVE_DELAY = 3; // 3s

  ngOnDestroy() {
    this.stopMonitoring();
  }

  stopMonitoring() {
    this.monitorSub?.unsubscribe();
    this.stopCountdown();
  }

  stopCountdown() {
    this.cancel$.next();
    this.counterSubject.next(0);
  }

  startMonitoring() {
    if (this.billSplitterService.isEditable()) {
      this.monitorSub = this.billSplitterService.isChange$.pipe(
        filter((isChange) => isChange),
        switchMap(() => {
          // Bắt đầu một timer phát sinh mỗi 1 giây (1000ms), 
          // Timer này sẽ bị tự động hủy và tạo mới lại vòng lặp nếu isChange$ phát dữ liệu mới.
          // Chạy ngoài zone: các tick trung gian không ai render (counter$ chỉ được lắng nghe để
          // lưu khi về 0) nên không cần kích hoạt change detection mỗi giây.
          return this.timerOutsideZone(0, 1000).pipe(
            map((i) => this.SAVE_DELAY - i),
            tap((remaining) => this.emitCounter(remaining)),
            takeWhile((remaining) => remaining > 0),
            takeUntil(this.cancel$)
          );
        })
      ).subscribe();
    }
  }

  /** `timer()` có `setInterval` bên dưới được đăng ký ngoài NgZone. */
  private timerOutsideZone(dueTime: number, period: number): Observable<number> {
    return new Observable<number>((subscriber) =>
      this.ngZone.runOutsideAngular(() => timer(dueTime, period).subscribe(subscriber)),
    );
  }

  /** Chỉ vào lại zone khi đếm về 0, vì đó là lúc người nghe thực sự lưu bill và cập nhật UI. */
  private emitCounter(remaining: number) {
    if (remaining <= 0) {
      this.ngZone.run(() => this.counterSubject.next(remaining));
    } else {
      this.counterSubject.next(remaining);
    }
  }
}
