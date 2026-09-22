import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuantitySelector } from '../quantity-selector/quantity-selector';
import { EmptyStateComponent } from '../empty-state/empty-state';

/** Dưới ngưỡng này bảng ma trận thành viên × khoản mục đổi sang layout card. */
const MOBILE_BREAKPOINT = '(max-width: 767px)';

@Component({
  selector: 'app-member-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    QuantitySelector,
    EmptyStateComponent,
  ],
  templateUrl: './member-table.html',
  styleUrls: ['./member-table.scss'],
})
export class MemberTableComponent {
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  expenses: ExpenseItem[] = [];
  members: Member[] = [];
  memberForm: FormGroup;
  /** Cột của mat-table, tính lại mỗi khi danh sách khoản mục đổi. */
  displayedColumns: string[] = [];
  isMobile = false;

  constructor() {
    this.memberForm = this.fb.group({
      name: ['', [Validators.required]],
    });

    this.billSplitterService.expenses$
      .pipe(takeUntilDestroyed())
      .subscribe((expenses) => {
        this.expenses = expenses;
        this.displayedColumns = [
          'name',
          ...expenses.map((expense) => expense.id),
          'isPaid',
          'totalAmount',
          'actions',
        ];
      });

    this.billSplitterService.members$
      .pipe(takeUntilDestroyed())
      .subscribe((members) => {
        this.members = members;
      });

    this.breakpointObserver
      .observe(MOBILE_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        this.isMobile = matches;
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
    const index = this.members.findIndex((m) => m.id === memberId);
    if (index === -1) return;
    const removed = this.members[index];

    this.billSplitterService.removeMember(memberId);

    this.snackBar
      .open(`Đã xoá "${removed.name}"`, 'Hoàn tác', { duration: 5000 })
      .onAction()
      .subscribe(() => {
        this.billSplitterService.restoreMember(removed, index);
      });
  }

  updateParticipation(
    memberId: string,
    expenseId: string,
    quantity: number
  ): void {
    const validQuantity = Math.max(0, quantity || 0);
    this.billSplitterService.updateParticipation(
      memberId,
      expenseId,
      validQuantity
    );
  }

  updateIsPaid(memberId: string, isPaid: boolean) {
    this.billSplitterService.updatePaid(memberId, isPaid);
  }

  getParticipation(member: Member, expenseId: string): number {
    return member.participations.get(expenseId) || 0;
  }

  private filterNameExists(names: string[]) {
    return names.filter((name) =>
      this.members.some((member) => member.name === name)
    );
  }
}
