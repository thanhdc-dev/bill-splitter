import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { BillSplitterService } from './bill-splitter.service';

describe('BillSplitterService - chia tiền', () => {
  let service: BillSplitterService;

  const memberTotal = (name: string): number =>
    service.members().find((m) => m.name === name)?.totalAmount ?? NaN;

  const expenseId = (name: string): string =>
    service.expenses().find((e) => e.name === name)!.id;

  const memberId = (name: string): string =>
    service.members().find((m) => m.name === name)!.id;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isLoggedIn: () => false, getUserId: () => 0 } },
      ],
    });
    service = TestBed.inject(BillSplitterService);
    localStorage.clear();
    sessionStorage.clear();
  });

  function seedTwoMembersTwoExpenses() {
    service.addExpense('Lẩu', 300000);
    service.addExpense('Bia', 100000);
    service.addMember('An');
    service.addMember('Bình');
    service.updateParticipation(memberId('An'), expenseId('Lẩu'), 1);
    service.updateParticipation(memberId('Bình'), expenseId('Lẩu'), 1);
    service.updateParticipation(memberId('Bình'), expenseId('Bia'), 1);
  }

  it('chia đều khoản mục cho các thành viên tham gia', () => {
    seedTwoMembersTwoExpenses();

    expect(memberTotal('An')).toBe(150000);
    expect(memberTotal('Bình')).toBe(250000);
  });

  it('chia theo tỉ lệ số lượng (quantity)', () => {
    service.addExpense('Bánh', 300000);
    service.addMember('An');
    service.addMember('Bình');
    service.updateParticipation(memberId('An'), expenseId('Bánh'), 1);
    service.updateParticipation(memberId('Bình'), expenseId('Bánh'), 2);

    expect(memberTotal('An')).toBeCloseTo(100000);
    expect(memberTotal('Bình')).toBeCloseTo(200000);
  });

  it('khoản mục không ai tham gia thì không tính cho ai', () => {
    service.addExpense('Lẩu', 300000);
    service.addMember('An');

    expect(memberTotal('An')).toBe(0);
    expect(service.totalAmount()).toBe(300000);
  });

  it('totalAmount là tổng các khoản mục', () => {
    seedTwoMembersTwoExpenses();

    expect(service.totalAmount()).toBe(400000);
  });

  it('đổi số tiền khoản mục thì tính lại phần mỗi người và tổng', () => {
    seedTwoMembersTwoExpenses();

    service.updateExpenseAmount(expenseId('Lẩu'), 500000);

    expect(memberTotal('An')).toBe(250000);
    expect(memberTotal('Bình')).toBe(350000);
    expect(service.totalAmount()).toBe(600000);
  });

  it('xoá khoản mục thì tính lại', () => {
    seedTwoMembersTwoExpenses();

    service.removeExpense(expenseId('Bia'));

    expect(memberTotal('Bình')).toBe(150000);
    expect(service.totalAmount()).toBe(300000);
  });

  it('xoá thành viên thì phần của người còn lại tăng lên', () => {
    seedTwoMembersTwoExpenses();

    service.removeMember(memberId('An'));

    expect(memberTotal('Bình')).toBe(400000);
  });

  it('hoàn tác xoá khoản mục khôi phục vị trí và số tiền', () => {
    seedTwoMembersTwoExpenses();
    const lau = service.expenses()[0];

    service.removeExpense(lau.id);
    service.restoreExpense(lau, 0);

    expect(service.expenses()[0].name).toBe('Lẩu');
    expect(memberTotal('An')).toBe(150000);
    expect(memberTotal('Bình')).toBe(250000);
  });

  it('hoàn tác xoá thành viên khôi phục vị trí và số tiền', () => {
    seedTwoMembersTwoExpenses();
    const an = service.members()[0];

    service.removeMember(an.id);
    service.restoreMember(an, 0);

    expect(service.members()[0].name).toBe('An');
    expect(memberTotal('An')).toBe(150000);
    expect(memberTotal('Bình')).toBe(250000);
  });

  it('thêm khoản mục mới đặt participation của mọi thành viên là 0', () => {
    service.addMember('An');
    service.addExpense('Lẩu', 100000);

    expect(service.members()[0].participations.get(expenseId('Lẩu'))).toBe(0);
    expect(memberTotal('An')).toBe(0);
  });

  it('thêm thành viên sau khi có khoản mục: participation mặc định 0', () => {
    service.addExpense('Lẩu', 100000);
    service.addMember('An');

    expect(service.members()[0].participations.get(expenseId('Lẩu'))).toBe(0);
  });

  it('updateParticipation tính lại phần của các thành viên cùng khoản mục', () => {
    seedTwoMembersTwoExpenses();
    const binhBefore = service.members().find((m) => m.name === 'Bình')!;

    service.updateParticipation(memberId('An'), expenseId('Bia'), 1);

    expect(memberTotal('An')).toBe(200000);
    expect(memberTotal('Bình')).toBe(200000);
    // object cũ không bị mutate
    expect(binhBefore.totalAmount).toBe(250000);
  });

  it('đánh dấu đã thanh toán không đổi số tiền nhưng bật cờ isChange', () => {
    seedTwoMembersTwoExpenses();
    service.updateIsChange(false);

    service.updatePaid(memberId('An'), true);

    expect(service.members().find((m) => m.name === 'An')!.isPaid).toBeTrue();
    expect(memberTotal('An')).toBe(150000);
    expect(service.isChange()).toBeTrue();
  });

  it('mỗi thao tác sửa đều bật isChange', () => {
    service.updateIsChange(false);
    service.addExpense('Lẩu', 1);
    expect(service.isChange()).toBeTrue();

    service.updateIsChange(false);
    service.updateName('Tên mới');
    expect(service.isChange()).toBeTrue();
  });

  it('changeVersion tăng ở mỗi lần sửa, kể cả khi isChange đã là true', () => {
    const start = service.getChangeVersion();

    service.updateName('A');
    service.updateName('B');

    expect(service.getChangeVersion()).toBe(start + 2);
    expect(service.isChange()).toBeTrue();
  });

  it('updateIsChange(true) tăng changeVersion, updateIsChange(false) thì không', () => {
    const start = service.getChangeVersion();

    service.updateIsChange(true);
    expect(service.getChangeVersion()).toBe(start + 1);

    service.updateIsChange(false);
    expect(service.getChangeVersion()).toBe(start + 1);
  });

  it('resetBill đưa mọi thứ về trạng thái rỗng', () => {
    seedTwoMembersTwoExpenses();

    service.resetBill();

    expect(service.expenses()).toEqual([]);
    expect(service.members()).toEqual([]);
    expect(service.totalAmount()).toBe(0);
  });

  it('lưu nháp vào localStorage giữ nguyên participations và tổng tiền', () => {
    seedTwoMembersTwoExpenses();
    service.saveBillToStorage();
    const saved = JSON.parse(localStorage.getItem('bill')!);

    expect(saved.data.totalAmount).toBe(400000);
    expect(saved.data.members[1].participations).toEqual(
      jasmine.objectContaining({ [expenseId('Bia')]: 1 })
    );
  });
});
