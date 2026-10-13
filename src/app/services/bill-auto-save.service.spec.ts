import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { skip } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { BillAutoSaveService } from './bill-auto-save.service';
import { BillSplitterService } from './bill-splitter.service';

describe('BillAutoSaveService', () => {
  let autoSave: BillAutoSaveService;
  let bill: BillSplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: {} },
        { provide: AuthService, useValue: { isLoggedIn: () => true, getUserId: () => 1 } },
      ],
    });
    autoSave = TestBed.inject(BillAutoSaveService);
    bill = TestBed.inject(BillSplitterService);
  });

  it('phát tín hiệu lưu (counter = 0) sau 3 giây kể từ lần sửa', fakeAsync(() => {
    const emitted: number[] = [];
    autoSave.counter$.pipe(skip(1)).subscribe((v) => emitted.push(v));
    autoSave.startMonitoring();

    bill.updateName('A');
    TestBed.tick();
    tick(2999);
    expect(emitted).not.toContain(0);

    tick(1);
    expect(emitted).toContain(0);

    autoSave.stopMonitoring();
  }));

  it('debounce: sửa tiếp trong lúc đang đếm thì đếm lại từ đầu', fakeAsync(() => {
    const emitted: number[] = [];
    autoSave.counter$.pipe(skip(1)).subscribe((v) => emitted.push(v));
    autoSave.startMonitoring();

    bill.updateName('A');
    TestBed.tick();
    tick(2000);

    bill.updateName('B');
    TestBed.tick();
    tick(2000); // t=4s: đếm cũ lẽ ra đã về 0 ở t=3s
    expect(emitted).not.toContain(0);

    tick(1000); // t=5s = 3s sau lần sửa cuối
    expect(emitted).toContain(0);

    autoSave.stopMonitoring();
  }));

  it('không phát tín hiệu khi không có thay đổi', fakeAsync(() => {
    const emitted: number[] = [];
    autoSave.counter$.pipe(skip(1)).subscribe((v) => emitted.push(v));
    autoSave.startMonitoring();
    TestBed.tick();

    tick(10000);

    expect(emitted).toEqual([]);
    autoSave.stopMonitoring();
  }));
});
