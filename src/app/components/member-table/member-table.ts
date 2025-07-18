import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-member-table',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './member-table.html',
  styleUrls: ['./member-table.scss'],
})
export class MemberTableComponent {
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly billSplitterService = inject(BillSplitterService);

  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  memberNames: string[] = [];
  memberForm: FormGroup;
  displayedColumns: string[] = ['name'];
  expensesColumns: string[] = [];

  constructor() {
    this.memberForm = this.fb.group({
      name: ['', [Validators.required]],
    });
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;

    this.expenses$.subscribe((expenses) => {
      this.expensesColumns = [...expenses.map((e) => e.id)];
    });
    this.members$.subscribe((members) => {
      this.memberNames = [...members.map((e) => e.name)];
    });
  }

  onSubmit(): void {
    if (this.memberForm.valid) {
      const { name }: { name: string } = this.memberForm.value;
      const names = name.split(',').map((memberName) => memberName.trim());
      const namesExist = this.filterNameExists(names);
      if (namesExist.length) {
        this.snackBar.open(`${namesExist.join(', ')} đã tồn tại`, 'Đóng', {
          duration: 3000,
        });
      } else {
        names.forEach((memberName) => {
          this.billSplitterService.addMember(memberName.trim());
        });
      }
      this.memberForm.reset();
    }
  }

  removeMember(memberId: string): void {
    this.billSplitterService.removeMember(memberId);
  }

  updateParticipation(
    memberId: string,
    expenseId: string,
    isParticipating: boolean
  ): void {
    this.billSplitterService.updateParticipation(
      memberId,
      expenseId,
      isParticipating
    );
  }

  getDisplayedColumns(): string[] {
    this.displayedColumns = [
      'name',
      ...this.expensesColumns,
      'isPaid',
      'totalAmount',
      'actions',
    ];
    return this.displayedColumns;
  }

  updateIsPaid(memberId: string, isPaid: boolean) {
    this.billSplitterService.updatePaid(memberId, isPaid);
  }

  private filterNameExists(names: string[]) {
    return names.filter((name) => this.memberNames.includes(name));
  }
}
