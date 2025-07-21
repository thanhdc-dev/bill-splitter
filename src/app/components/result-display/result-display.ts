import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { QrPopupComponent } from '../qr-popup/qr-popup';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  buildQRCodeUrl,
  removeVietnameseTones,
  roundedToThousand,
} from '../../shared/helpers';
import { BankInfoItem } from '../../models/bank.model';
import { BillTabControlService } from '../bill-details/bill-tab-control.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-result-display',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './result-display.html',
  styleUrls: ['./result-display.scss'],
})
export class ResultDisplayComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly billTabControlService = inject(BillTabControlService);
  private readonly billSplitterService = inject(BillSplitterService);

  billName$: Observable<string>;
  billName = '';
  expenses: ExpenseItem[] = [];
  expenses$: Observable<ExpenseItem[]>;
  members: Member[] = [];
  members$: Observable<Member[]>;
  displayedColumns: string[] = ['name', 'amount', 'participants', 'perPerson'];
  bankInfo$: Observable<BankInfoItem>;
  bankInfo!: BankInfoItem;

  constructor() {
    this.billName$ = this.billSplitterService.name$;
    this.billName$.subscribe((billName) => {
      this.billName = billName;
    });
    this.expenses$ = this.billSplitterService.expenses$;
    this.expenses$.subscribe((expenses) => {
      this.expenses = expenses;
    });
    this.members$ = this.billSplitterService.members$;
    this.members$.subscribe((members) => {
      this.members = members;
    });
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

  getParticipants(expense: ExpenseItem, members: Member[]): string {
    return members
      .filter((member) => member.participations.get(expense.id))
      .map((member) => member.name)
      .join(', ');
  }

  getParticipantCount(expense: ExpenseItem, members: Member[]): number {
    return (
      members.filter((member) => member.participations.get(expense.id))
        .length || 1
    );
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
    const items: string[] = [];
    this.expenses.forEach((expense) => {
      const isParticipating = member.participations.get(expense.id);
      if (isParticipating) {
        const participantsCount = this.getParticipantsCount(expense.id);
        const amount = expense.amount / participantsCount;
        items.push(`${expense.name} ${this.formatUserAmount(amount)}`);
      }
    });
    const des = `TT ${this.billName} ${member.name} ${items.join(' ')}`;
    const qrImageUrl = buildQRCodeUrl(
      this.bankInfo.accountNumber,
      this.bankInfo.bank,
      { amount: this.formatUserAmount(member.totalAmount), des }
    );
    const qrImageDownloadUrl = buildQRCodeUrl(
      this.bankInfo.accountNumber,
      this.bankInfo.bank,
      {
        amount: this.formatUserAmount(member.totalAmount),
        des,
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

  private getParticipantsCount(expenseId: string): number {
    return (
      this.members.filter((member) => member.participations.get(expenseId))
        .length || 1
    ); // Prevent division by zero
  }

  onSettingClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.billTabControlService.changeTab(1); // giả sử tab Setting có index là 1
  }

  isEditable() {
    return this.billSplitterService.isEditable();
  }
}
