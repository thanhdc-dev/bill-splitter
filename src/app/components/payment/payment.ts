
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { BankInfoItem } from '../../models/bank.model';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { BANKS } from '../../constants';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { BankSelectComponent } from '../bank-select/bank-select';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-payment',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    BankSelectComponent,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule
],
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class PaymentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  bankInfo$: Observable<BankInfoItem>;
  bankForm: FormGroup;
  bankInfo!: BankInfoItem;
  selectedTab: 'bank' | 'momo' = 'bank';

  constructor() {
    this.bankInfo$ = this.billSplitterService.bankInfo$;

    this.bankForm = this.fb.group({
      bank: [''],
      accountNumber: [''],
      accountName: [''],
      accountNumberMomo: [''],
      accountNameMomo: [''],
      phoneNumberMomo: [''],
    });

    this.bankForm.valueChanges.pipe(takeUntilDestroyed()).subscribe((_) => {
      this.handleFormChanges();
    });
  }

  ngOnInit(): void {
    this.bankInfo$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((bankInfo) => {
      if (bankInfo) {
        this.bankInfo = bankInfo;
        this.bankForm.patchValue({ ...bankInfo }, { emitEvent: false });
        // OnPush: patchValue không phát sự kiện nên view phải được đánh dấu thủ công.
        this.cdr.markForCheck();
      }
    });
  }

  handleFormChanges() {
    if (!this.bankForm.valid) return;
    const formValue = this.bankForm.value;
    const bank = BANKS.find(({ code }) => code == formValue.bank);
    const hasMomo = !!(
      formValue.accountNameMomo ||
      formValue.phoneNumberMomo ||
      formValue.accountNumberMomo
    );
    // Momo độc lập với ngân hàng: người chỉ có Momo chưa chọn ngân hàng vẫn phải được lưu (trước đây
    // chỉ lưu khi có ngân hàng nên dữ liệu Momo bị bỏ qua im lặng, không thẻ và không nút QR).
    if (!bank && !hasMomo) return;
    // Bill cũ có mã ngân hàng không còn trong BANKS nhưng `bin`/số tài khoản vẫn hợp lệ: sửa Momo không
    // được xoá ngân hàng đó, nên giữ nguyên các trường ngân hàng đang lưu khi mã không đổi.
    const current = this.bankInfo;
    const keepCurrentBank = !bank && !!current && !!formValue.bank && formValue.bank === current.bank;
    const data: BankInfoItem = {
      name: bank?.name ?? (keepCurrentBank ? current.name : ''),
      bank: bank?.code ?? (keepCurrentBank ? current.bank : ''),
      short_name: bank?.short_name ?? (keepCurrentBank ? current.short_name : ''),
      bin: bank?.bin ?? (keepCurrentBank ? current.bin : ''),
      accountName: formValue.accountName ?? '',
      accountNumber: formValue.accountNumber ?? '',
      accountNumberMomo: formValue.accountNumberMomo ?? '',
      accountNameMomo: formValue.accountNameMomo ?? '',
      phoneNumberMomo: formValue.phoneNumberMomo ?? '',
    };
    this.billSplitterService.updateBankInfo(data);
  }

  selectTab(tab: 'bank' | 'momo'): void {
    this.selectedTab = tab;
  }
}
