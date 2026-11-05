import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
