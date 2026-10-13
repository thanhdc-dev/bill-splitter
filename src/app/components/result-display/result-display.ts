import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { Member } from '../../models/bill-splitter.model';
import { MatIconModule } from '@angular/material/icon';
import { QrPopupComponent } from '../qr-popup/qr-popup';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { removeVietnameseTones, roundedToThousand } from '../../shared/helpers';
import { MatButtonModule } from '@angular/material/button';
import { QRService } from '../../services';
import { EmptyStateComponent } from '../empty-state/empty-state';

interface IExpenseRowVM {
  id: string;
  name: string;
  amount: number;
  participants: string;
  participantCount: number;
  perPerson: number | null;
}

interface IMemberRowVM {
  member: Member;
  displayAmount: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-result-display',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    EmptyStateComponent,
  ],
  templateUrl: './result-display.html',
  styleUrls: ['./result-display.scss'],
})
export class ResultDisplayComponent {
  private readonly dialog = inject(MatDialog);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly qrService = inject(QRService);

  private readonly expenses = this.billSplitterService.expenses;
  private readonly members = this.billSplitterService.members;
  private readonly bankInfo = this.billSplitterService.bankInfo;

  readonly hasExpenses = computed(() => this.expenses().length > 0);
  readonly hasMembers = computed(() => this.members().length > 0);

  /** View-model tính một lần mỗi khi expenses/members đổi, template chỉ đọc field. */
  readonly expenseRows = computed<IExpenseRowVM[]>(() => {
    const members = this.members();
    return this.expenses().map((expense) => {
      let participantCount = 0;
      const names: string[] = [];
      for (const member of members) {
        const quantity = member.participations.get(expense.id) || 0;
        if (!quantity) continue;
        participantCount += quantity;
        names.push(quantity === 1 ? member.name : `${member.name}(x${quantity})`);
      }
      return {
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        participants: names.join(', '),
        participantCount,
        perPerson: participantCount > 0 ? expense.amount / participantCount : null,
      };
    });
  });

  readonly totalAmount = computed(() =>
    this.expenses().reduce((total, expense) => total + expense.amount, 0)
  );

  readonly memberRows = computed<IMemberRowVM[]>(() =>
    this.members().map((member) => ({
      member,
      displayAmount: roundedToThousand(member.totalAmount),
    }))
  );

  readonly isShowBankInfo = computed(() => {
    const info = this.bankInfo();
    return !!(info.accountNumber && info.bin);
  });

  readonly isShowMomoInfo = computed(() => {
    const info = this.bankInfo();
    return !!(info.accountNameMomo && info.phoneNumberMomo);
  });

  formatUserAmount(amount: number) {
    return roundedToThousand(amount);
  }

  showQRPopup(member: Member) {
    const totalAmountFormatted = this.formatUserAmount(member.totalAmount);
    const description = `${member.name} TT ${this.billSplitterService.name()}`;
    const qrImageUrl = this.qrService.buildQRCodeUrl(
      this.bankInfo().accountNumber,
      this.bankInfo().bin,
      { amount: totalAmountFormatted, description }
    );
    const qrImageDownloadUrl = this.qrService.buildQRCodeUrl(
      this.bankInfo().accountNumber,
      this.bankInfo().bin,
      {
        amount: totalAmountFormatted,
        description,
        isDownload: true,
      }
    );
    const fileName = `${removeVietnameseTones(
      this.billSplitterService.name()
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
    const description = `${member.name} TT ${this.billSplitterService.name()}`;
    const qrImageUrl = this.qrService.buildMomoQRCodeUrl(
      this.bankInfo().accountNumberMomo,
      { amount: totalAmountFormatted, description }
    );
    const qrImageDownloadUrl = this.qrService.buildMomoQRCodeUrl(
      this.bankInfo().accountNumberMomo,
      {
        amount: totalAmountFormatted,
        description,
        isDownload: true,
      }
    );
    const fileName = `${removeVietnameseTones(
      this.billSplitterService.name()
    )}-${removeVietnameseTones(member.name)}-qr-momo.png`;
    this.dialog.open(QrPopupComponent, {
      data: {
        fileName,
        qrImageUrl,
        qrImageDownloadUrl,
      },
    });
  }
}
