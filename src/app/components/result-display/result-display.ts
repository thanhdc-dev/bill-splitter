import { Component } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-result-display',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    MatCardModule,
    MatTableModule
  ],
  templateUrl: './result-display.html',
  styleUrls: ['./result-display.scss']
})
export class ResultDisplayComponent {
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  displayedColumns: string[] = ['name', 'amount', 'participants', 'perPerson'];

  constructor(private billSplitterService: BillSplitterService) {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
  }

  getParticipants(expense: ExpenseItem, members: Member[]): string {
    return members
      .filter(member => member.participations.get(expense.id))
      .map(member => member.name)
      .join(', ');
  }

  getParticipantCount(expense: ExpenseItem, members: Member[]): number {
    return members.filter(member => member.participations.get(expense.id)).length || 1;
  }

  calculatePerPerson(amount: number, participantCount: number): number {
    return amount / participantCount;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  getTotalAmount(expenses: ExpenseItem[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }
}
