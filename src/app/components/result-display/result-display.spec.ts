import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ResultDisplayComponent } from './result-display';

registerLocaleData(localeVi, 'vi');

describe('ResultDisplayComponent - giải thích làm tròn', () => {
  let fixture: ComponentFixture<ResultDisplayComponent>;
  let service: BillSplitterService;

  const infoButton = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('.member-summary__info');
  const note = (): HTMLElement | null => fixture.nativeElement.querySelector('#rounding-note');

  function seed(amount: number, names: string[]) {
    service.addExpense('Lẩu', amount);
    names.forEach((name) => service.addMember(name));
    const expenseId = service.expenses()[0].id;
    service.members().forEach((member) => service.updateParticipation(member.id, expenseId, 1));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResultDisplayComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => false, getUserId: () => 0, user$: of(null) },
        },
      ],
    });
    service = TestBed.inject(BillSplitterService);
    fixture = TestBed.createComponent(ResultDisplayComponent);
  });

  it('chia 785.000 cho 3 người: có nút (i) và ghi chú đóng sẵn', () => {
    seed(785000, ['Tèo', 'Tủn', 'Tý']);

    expect(infoButton()).not.toBeNull();
    expect(infoButton()!.getAttribute('aria-expanded')).toBe('false');
    expect(note()).toBeNull();
  });

  it('bấm (i) mở ghi chú với tổng thu, hóa đơn và phần dư; bấm lần nữa đóng lại', () => {
    seed(785000, ['Tèo', 'Tủn', 'Tý']);

    infoButton()!.click();
    fixture.detectChanges();

    expect(infoButton()!.getAttribute('aria-expanded')).toBe('true');
    const text = note()!.textContent!.replace(/\s+/g, ' ');
    expect(text).toContain('786.000');
    expect(text).toContain('785.000');
    expect(text).toContain('1.000');

    infoButton()!.click();
    fixture.detectChanges();
    expect(note()).toBeNull();
  });

  it('Esc trên nút (i) đóng ghi chú', () => {
    seed(785000, ['Tèo', 'Tủn', 'Tý']);
    infoButton()!.click();
    fixture.detectChanges();

    infoButton()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(note()).toBeNull();
  });

  it('giá mỗi người ở dòng khoản mục cũng làm tròn lên đến nghìn', () => {
    seed(785000, ['Tèo', 'Tủn', 'Tý']);

    const perPerson = fixture.nativeElement.querySelector('.expense-meta__per-person');

    expect(perPerson.textContent.replace(/\s+/g, ' ')).toContain('262.000');
    expect(perPerson.textContent).toContain('/người');
  });

  it('giá mỗi người ở dòng khoản mục bị làm tròn thì có dấu ≈ và chú thích dưới bảng', () => {
    seed(785000, ['Tèo', 'Tủn', 'Tý']);

    const perPerson = fixture.nativeElement.querySelector('.expense-meta__per-person');
    const note = fixture.nativeElement.querySelector('.receipt-note');

    expect(perPerson.querySelector('[aria-hidden="true"]').textContent).toContain('≈');
    expect(perPerson.querySelector('.sr-only').textContent).toContain('khoảng');
    expect(perPerson.textContent).toContain('262.000');
    expect(note.textContent).toContain('làm tròn lên đến nghìn riêng');
  });

  it('giá mỗi người đúng nghìn thì không có ≈ và không có chú thích', () => {
    seed(450000, ['Tèo', 'Tủn', 'Tý']);

    expect(fixture.nativeElement.querySelector('.expense-meta__per-person').textContent).not.toContain('≈');
    expect(fixture.nativeElement.querySelector('.receipt-note')).toBeNull();
  });

  it('popup QR có tiêu đề là tên và số tiền, dòng phụ là ngân hàng và chủ tài khoản', () => {
    seed(785000, ['Tèo', 'Tủn', 'Tý']);
    service.updateBankInfo({
      bank: 'VTLMONEY', name: 'Viettel Money', short_name: 'ViettelMoney', bin: '970422',
      accountName: 'NGUYEN VAN A', accountNumber: '0123456789',
      accountNumberMomo: '', accountNameMomo: '', phoneNumberMomo: '',
    }, true);
    const open = spyOn(fixture.debugElement.injector.get(MatDialog), 'open');

    fixture.componentInstance.showQRPopup(service.members()[0]);

    const data = open.calls.mostRecent().args[1]!.data as { title: string; subtitle: string };
    expect(data.title.replace(/\s/g, ' ')).toContain('Tèo · 262.000');
    expect(data.subtitle).toBe('ViettelMoney · NGUYEN VAN A · 0123456789');
  });

  it('chia khéo ra đúng nghìn thì không có nút (i)', () => {
    seed(450000, ['Tèo', 'Tủn']);

    expect(infoButton()).toBeNull();
  });

  it('có khoản mục chưa ai tham gia thì không giải thích bằng làm tròn', () => {
    seed(785000, ['Tèo', 'Tủn', 'Tý']);
    service.addExpense('Bia', 100000);
    fixture.detectChanges();

    expect(infoButton()).toBeNull();
  });
});
