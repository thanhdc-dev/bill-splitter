import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { QrPopupComponent } from '../qr-popup/qr-popup';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { buildQRCodeUrl } from '../../shared/helpers';
import { BankInfoItem } from '../../models/bank.model';
import { BillTabControlService } from '../bill-splitter/bill-tab-control.service';
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
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  displayedColumns: string[] = ['name', 'amount', 'participants', 'perPerson'];
  bankInfo$: Observable<BankInfoItem>;
  bankInfo!: BankInfoItem;

  constructor(
    private dialog: MatDialog,
    private billTabControlService: BillTabControlService,
    private billSplitterService: BillSplitterService,
  ) {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
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

  showQRPopup(member: Member) {
    const qrImageUrl = buildQRCodeUrl(
            this.bankInfo.accountNumber,
            this.bankInfo.bank,
            { amount: member.totalAmount },
          );
    const qrImageDownloadUrl = buildQRCodeUrl(
            this.bankInfo.accountNumber,
            this.bankInfo.bank,
            { amount: member.totalAmount, isDownload: true },
          );
    this.dialog
      .open(QrPopupComponent, {
        data: {
          fileName: `${member.name}-qr.png`,
          qrImageUrl,
          qrImageDownloadUrl,
        },
      });
  }

  onSettingClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.billTabControlService.changeTab(1); // giả sử tab Setting có index là 1
  }

  isEditable() {
    return this.billSplitterService.isEditable();
  }
}
