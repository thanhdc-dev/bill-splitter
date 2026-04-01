import { inject, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Subscription, timer } from 'rxjs';
import { filter, map, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { BillSplitterService } from './bill-splitter.service';

@Injectable({
  providedIn: 'root',
})
export class BillAutoSaveService implements OnDestroy {
  private readonly router = inject(Router);
  private readonly billSplitterService = inject(BillSplitterService);
  
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
          return timer(0, 1000).pipe(
            map((i) => this.SAVE_DELAY - i),
            tap((remaining) => this.counterSubject.next(remaining)),
            takeWhile((remaining) => remaining > 0),
            takeUntil(this.cancel$)
          );
        })
      ).subscribe();
    }
  }
}
