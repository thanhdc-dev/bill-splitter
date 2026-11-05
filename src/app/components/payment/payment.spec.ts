import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../services/auth.service';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { PaymentComponent } from './payment';

describe('PaymentComponent - lưu thông tin nhận tiền', () => {
  let fixture: ComponentFixture<PaymentComponent>;
  let service: BillSplitterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaymentComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isLoggedIn: () => false, getUserId: () => 0 } },
      ],
    });
    service = TestBed.inject(BillSplitterService);
    fixture = TestBed.createComponent(PaymentComponent);
    fixture.detectChanges();
  });

  it('chỉ có Momo (chưa chọn ngân hàng) vẫn được lưu vào bill', () => {
    fixture.componentInstance.bankForm.patchValue({
      accountNameMomo: 'NGUYEN VAN A',
      phoneNumberMomo: '0901234567',
      accountNumberMomo: '0901234567',
    });

    const info = service.bankInfo();
    expect(info.accountNameMomo).toBe('NGUYEN VAN A');
    expect(info.phoneNumberMomo).toBe('0901234567');
    expect(info.accountNumberMomo).toBe('0901234567');
    expect(info.bin).toBe('');
    expect(info.accountNumber).toBe('');
  });

  it('chọn ngân hàng thì lưu cả ngân hàng lẫn Momo', () => {
    fixture.componentInstance.bankForm.patchValue({
      bank: 'MB',
      accountName: 'NGUYEN VAN A',
      accountNumber: '0123456789',
      accountNumberMomo: '0901234567',
    });

    const info = service.bankInfo();
    expect(info.bin).toBe('970422');
    expect(info.accountNumber).toBe('0123456789');
    expect(info.accountNumberMomo).toBe('0901234567');
  });

  it('chỉ gõ tên chủ tài khoản khi chưa chọn ngân hàng và chưa có Momo thì không ghi đè', () => {
    const before = service.bankInfo();

    fixture.componentInstance.bankForm.patchValue({ accountName: 'AN' });

    expect(service.bankInfo()).toBe(before);
  });

  it('đã có ngân hàng từ cài đặt: gõ thêm Momo vẫn giữ ngân hàng', () => {
    service.updateBankInfo({
      bank: 'MB', name: 'TMCP Quân đội', short_name: 'MBBank', bin: '970422',
      accountName: 'NGUYEN VAN A', accountNumber: '0123456789',
      accountNumberMomo: '', accountNameMomo: '', phoneNumberMomo: '',
    }, true);
    fixture.detectChanges();

    fixture.componentInstance.bankForm.patchValue({ accountNameMomo: 'NGUYEN VAN A' });

    const info = service.bankInfo();
    expect(info.bin).toBe('970422');
    expect(info.accountNumber).toBe('0123456789');
    expect(info.accountNameMomo).toBe('NGUYEN VAN A');
  });

  it('mã ngân hàng cũ không còn trong danh sách: sửa Momo không xoá ngân hàng đang lưu', () => {
    service.updateBankInfo({
      bank: 'OLDCODE', name: 'Ngân hàng cũ', short_name: 'Cu', bin: '999999',
      accountName: 'AN', accountNumber: '111222333',
      accountNumberMomo: '', accountNameMomo: '', phoneNumberMomo: '',
    }, true);
    fixture.detectChanges();

    fixture.componentInstance.bankForm.patchValue({ phoneNumberMomo: '0901234567' });

    const info = service.bankInfo();
    expect(info.bin).toBe('999999');
    expect(info.accountNumber).toBe('111222333');
    expect(info.phoneNumberMomo).toBe('0901234567');
  });
});
