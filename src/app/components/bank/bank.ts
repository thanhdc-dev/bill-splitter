import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, filter, Observable } from 'rxjs';
import { BankInfoItem } from '../../models/bank.model';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BillTabControlService } from '../bill-details/bill-tab-control.service';
import { QRService } from '../../services';

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
  private readonly qrService = inject(QRService);

  bankInfo$: Observable<BankInfoItem>;
  bankInfo!: BankInfoItem;
  qrCodeUrl!: string;
  isShowMomoInfo = false;
  qrCodeUrlMomo!: string;

  constructor() {
    this.bankInfo$ = this.billSplitterService.bankInfo$;

    this.bankInfo$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        filter((value) => !!value)
      )
      .subscribe((bankInfo) => {
        if (bankInfo) {
          this.bankInfo = bankInfo;
          this.fetchIsShowMomoInfo();
          this.getQrCodeUrl();
          this.getQrCodeUrlMomo();
        }
      });
  }

  ngOnInit(): void {
    this.bankInfo = this.billSplitterService.getBankInfo();
  }

  getQrCodeUrl() {
    if (this.bankInfo.accountNumber && this.bankInfo.bin) {
      const acc = this.bankInfo.accountNumber;
      const bin = this.bankInfo.bin;
      this.qrCodeUrl = this.qrService.buildQRCodeUrl(acc, bin);
    } else {
      this.qrCodeUrl = '';
    }
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

  fetchIsShowMomoInfo() {
    this.isShowMomoInfo = !!(
      this.bankInfo.accountNameMomo && this.bankInfo.phoneNumberMomo
    );
  }

  getQrCodeUrlMomo() {
    if (this.bankInfo.accountNumberMomo) {
      const acc = this.bankInfo.accountNumberMomo;
      this.qrCodeUrlMomo = this.qrService.buildMomoQRCodeUrl(acc);
    } else {
      this.qrCodeUrlMomo = '';
    }
  }
}
