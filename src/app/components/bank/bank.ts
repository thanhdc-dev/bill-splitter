import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { BankInfoItem } from '../../models/bank.model';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { buildUrl } from '../../shared/helpers';
import { SEPAY_URL } from '../../constants';
import { BillTabControlService } from '../bill-splitter/bill-tab-control.service';

@Component({
  selector: 'app-bank',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './bank.html',
  styleUrl: './bank.scss',
})
export class BankComponent {
  bankInfo$: Observable<BankInfoItem>;
  bankInfo!: BankInfoItem;

  constructor(
    private snackBar: MatSnackBar,
    private billTabControlService: BillTabControlService,
    private billSplitterService: BillSplitterService
  ) {
    this.bankInfo$ = this.billSplitterService.bankInfo$;

    this.bankInfo$.subscribe((bankInfo) => {
      this.bankInfo = bankInfo;
    });
  }

  get qrCodeUrl(): string {
    const acc = encodeURIComponent(this.bankInfo.accountNumber);
    const bank = encodeURIComponent(this.bankInfo.bank);
    return buildUrl(`${SEPAY_URL}/img`, { acc, bank });
  }

  onCopyAccountNumber(event: Event) {
    event.stopPropagation();
    navigator.clipboard
      .writeText(this.bankInfo.accountNumber)
      .then(() => {
        this.snackBar.open('Số tài khoản đã được sao chép!', 'Đóng', {
          duration: 3000,
        });
      })
      .catch((err) => {
        console.error('Lỗi khi copy:', err);
      });
  }

  onSettingClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.billTabControlService.changeTab(2); // giả sử tab Setting có index là 1
  }
}
