import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { QrPopupComponent } from '../qr-popup/qr-popup';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { removeVietnameseTones, roundedToThousand } from '../../shared/helpers';
import { BankInfoItem } from '../../models/bank.model';
import { MatButtonModule } from '@angular/material/button';
import { QRService } from '../../services';
import { EmptyStateComponent } from '../empty-state/empty-state';

@Component({
  selector: 'app-result-display',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    EmptyStateComponent,
  ],
  templateUrl: './result-display.html',
  styleUrls: ['./result-display.scss'],
})
export class ResultDisplayComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly qrService = inject(QRService);

  billName$: Observable<string>;
  billName = '';
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  bankInfo$: Observable<BankInfoItem>;
  bankInfo!: BankInfoItem;
  isShowBankInfo = false;
  isShowMomoInfo = false;

  constructor() {
    this.billName$ = this.billSplitterService.name$;
    // `billName` chỉ dùng trong showQRPopup/showMomoQRPopup (không qua template),
    // nên vẫn cần subscribe thủ công ở đây - huỷ theo lifecycle component.
    this.billName$.pipe(takeUntilDestroyed()).subscribe((billName) => {
      this.billName = billName;
    });
    // expenses$/members$ chỉ được đọc qua `| async` trong template.
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;

    this.bankInfo$ = this.billSplitterService.bankInfo$;
    this.bankInfo$.pipe(takeUntilDestroyed()).subscribe((bankInfo) => {
      if (bankInfo) {
        this.bankInfo = bankInfo;
        this.fetchIsShowBankInfo();
        this.fetchIsShowMomoInfo();
      }
    });
  }

  ngOnInit(): void {
    this.bankInfo = this.billSplitterService.getBankInfo();
  }

  getParticipants(expense: ExpenseItem, members: Member[]): string {
    return members
      .filter((member) => member.participations.get(expense.id))
      .map((member) => {
        const quantity = member.participations.get(expense.id) || 0;
        return quantity === 1
          ? `${member.name}`
          : `${member.name}(x${quantity})`;
      })
      .join(', ');
  }

  getParticipantCount(expense: ExpenseItem, members: Member[]): number {
    return members.reduce((total, member) => {
      const quantity = member.participations.get(expense.id) || 0;
      return total + quantity;
    }, 0);
  }

  calculatePerPerson(amount: number, participantCount: number): number {
    return amount / participantCount;
  }

  getTotalAmount(expenses: ExpenseItem[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  formatUserAmount(amount: number) {
    return roundedToThousand(amount);
  }

  showQRPopup(member: Member) {
    const totalAmountFormatted = this.formatUserAmount(member.totalAmount);
    const description = `${member.name} TT ${this.billName}`;
    const qrImageUrl = this.qrService.buildQRCodeUrl(
      this.bankInfo.accountNumber,
      this.bankInfo.bin,
      { amount: totalAmountFormatted, description }
    );
    const qrImageDownloadUrl = this.qrService.buildQRCodeUrl(
      this.bankInfo.accountNumber,
      this.bankInfo.bin,
      {
        amount: totalAmountFormatted,
        description,
        isDownload: true,
      }
    );
    const fileName = `${removeVietnameseTones(
      this.billName
    )}-${removeVietnameseTones(member.name)}-qr.png`;
    this.dialog.open(QrPopupComponent, {
      data: {
        fileName,
        qrImageUrl,
        qrImageDownloadUrl,
      },
    });
  }

  showMomoQRPopup(member: Member) {
    const totalAmountFormatted = this.formatUserAmount(member.totalAmount);
    const description = `${member.name} TT ${this.billName}`;
    const qrImageUrl = this.qrService.buildMomoQRCodeUrl(
      this.bankInfo.accountNumberMomo,
      { amount: totalAmountFormatted, description }
    );
    const qrImageDownloadUrl = this.qrService.buildMomoQRCodeUrl(
      this.bankInfo.accountNumberMomo,
      {
        amount: totalAmountFormatted,
        description,
        isDownload: true,
      }
    );
    const fileName = `${removeVietnameseTones(
      this.billName
    )}-${removeVietnameseTones(member.name)}-qr-momo.png`;
    this.dialog.open(QrPopupComponent, {
      data: {
        fileName,
        qrImageUrl,
        qrImageDownloadUrl,
      },
    });
  }

  onSettingClick() {
    // Thanh toán không còn là tab riêng (Pha 3) — cuộn tới phần thanh toán
    // (luôn hiện full-width dưới trong create-bill.html) thay vì đổi tab.
    document
      .getElementById('payment-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  isEditable() {
    return this.billSplitterService.isEditable();
  }

  fetchIsShowBankInfo() {
    this.isShowBankInfo = !!(
      this.bankInfo.accountNumber && this.bankInfo.bin
    );
  }

  fetchIsShowMomoInfo() {
    this.isShowMomoInfo = !!(
      this.bankInfo.accountNameMomo && this.bankInfo.phoneNumberMomo
    );
  }
}
