import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { BankInfoItem } from '../../models/bank.model';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { buildUrl } from '../../shared/helpers';
import { SEPAY_URL } from '../../constants';
import { BillTabControlService } from '../bill-details/bill-tab-control.service';

@Component({
  selector: 'app-bank',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './bank.html',
  styleUrl: './bank.scss',
})
export class BankComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly billTabControlService = inject(BillTabControlService);
  private readonly billSplitterService = inject(BillSplitterService);

  bankInfo$: Observable<BankInfoItem>;
  bankInfo!: BankInfoItem;

  constructor() {
    this.bankInfo$ = this.billSplitterService.bankInfo$;

    this.bankInfo$.subscribe((bankInfo) => {
      if (bankInfo) {
        this.bankInfo = bankInfo;
      }
    });
  }

  ngOnInit(): void {
    this.bankInfo = this.billSplitterService.getBankInfo();
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

  isEditable() {
    return this.billSplitterService.isEditable();
  }
}
