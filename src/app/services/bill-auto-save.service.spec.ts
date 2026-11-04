import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { VirtualAction, VirtualTimeScheduler } from 'rxjs';
import { skip } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AUTO_SAVE_SCHEDULER, BillAutoSaveService } from './bill-auto-save.service';
import { BillSplitterService } from './bill-splitter.service';

describe('BillAutoSaveService', () => {
  let autoSave: BillAutoSaveService;
  let bill: BillSplitterService;
  let vts: VirtualTimeScheduler;

  beforeEach(() => {
    // Scheduler ảo thay cho timer của zone.js: test không phụ thuộc fakeAsync hay thứ tự chạy ngẫu nhiên.
    vts = new VirtualTimeScheduler(VirtualAction, Infinity);
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTO_SAVE_SCHEDULER, useValue: vts },
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: {} },
        { provide: AuthService, useValue: { isLoggedIn: () => true, getUserId: () => 1 } },
      ],
    });
    autoSave = TestBed.inject(BillAutoSaveService);
    bill = TestBed.inject(BillSplitterService);
  });

  /** Ghi lại mốc thời gian ảo (ms) mỗi lần bộ đếm về 0, tức là lúc bill được lưu. */
  function recordSaves(): number[] {
    const saveFrames: number[] = [];
    autoSave.counter$.pipe(skip(1)).subscribe((v) => {
      if (v === 0) saveFrames.push(vts.frame);
    });
    return saveFrames;
  }

  it('phát tín hiệu lưu (counter = 0) sau 3 giây kể từ lần sửa', () => {
    const saveFrames = recordSaves();
    autoSave.startMonitoring();

    bill.updateName('A');
    TestBed.tick();
    vts.flush();

    expect(saveFrames).toEqual([3000]);
    autoSave.stopMonitoring();
  });

  it('debounce: sửa tiếp trong lúc đang đếm thì đếm lại từ đầu', () => {
    const saveFrames = recordSaves();
    autoSave.startMonitoring();

    bill.updateName('A');
    TestBed.tick();
    vts.schedule(() => {
      bill.updateName('B');
      TestBed.tick();
    }, 2000);
    vts.flush();

    // Đếm cũ lẽ ra về 0 ở t=3s; sau lần sửa cuối ở t=2s thì lưu ở t=5s.
    expect(saveFrames).toEqual([5000]);
    autoSave.stopMonitoring();
  });

  it('không phát tín hiệu khi không có thay đổi', () => {
    const saveFrames = recordSaves();
    autoSave.startMonitoring();
    TestBed.tick();

    vts.flush();

    expect(saveFrames).toEqual([]);
    expect(vts.frame).toBe(0);
    autoSave.stopMonitoring();
  });
});
