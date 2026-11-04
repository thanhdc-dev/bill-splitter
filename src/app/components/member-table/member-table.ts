import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuantitySelector } from '../quantity-selector/quantity-selector';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { roundedToThousand } from '../../shared/helpers';

/** Dưới ngưỡng này bảng ma trận thành viên × khoản mục đổi sang layout card. */
const MOBILE_BREAKPOINT = '(max-width: 767px)';
const AUTO_SPLIT_STORAGE_KEY = 'bs.autoSplitNewMember';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-member-table',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTableModule,
    MatCheckboxModule,
    MatSlideToggleModule,
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
  private readonly cdr = inject(ChangeDetectorRef);

  expenses: ExpenseItem[] = [];
  members: Member[] = [];
  memberForm: FormGroup;
  /** Cột của mat-table, tính lại mỗi khi danh sách khoản mục đổi. */
  displayedColumns: string[] = [];
  isMobile = false;
  /** Thành viên mới tự có 1 suất ở mọi khoản mục. Mặc định bật, nhớ theo thiết bị. */
  autoSplit = this.readAutoSplit();

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
        this.cdr.markForCheck();
      });

    this.billSplitterService.members$
      .pipe(takeUntilDestroyed())
      .subscribe((members) => {
        this.members = members;
        this.cdr.markForCheck();
      });

    this.breakpointObserver
      .observe(MOBILE_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        this.isMobile = matches;
        this.cdr.markForCheck();
      });
  }

  /**
   * Số tiền người này phải trả, làm tròn lên đến nghìn: cùng số với bảng tổng và mã QR để hai màn
   * không lệch nhau (`member.totalAmount` giữ nguyên số thô để lưu và tính lại).
   */
  displayAmount(member: Member): number {
    return roundedToThousand(member.totalAmount);
  }

  onSubmit(): void {
    if (this.memberForm.valid) {
      const { name }: { name: string } = this.memberForm.value;
      // Bỏ chuỗi rỗng ("An," ) và tên trùng nhau trong cùng một lần nhập
      const names = [
        ...new Set(
          name
            .split(',')
            .map((memberName) => memberName.trim())
            .filter(Boolean)
        ),
      ];
      const namesExist = this.filterNameExists(names);
      if (namesExist.length) {
        this.snackBar.open(`${namesExist.join(', ')} đã tồn tại`, 'Đóng', {
          duration: 3000,
        });
      } else if (names.length) {
        const portion = this.autoSplit && this.expenses.length ? 1 : 0;
        const addedIds = names.map((memberName) =>
          this.billSplitterService.addMember(memberName, portion)
        );
        if (portion) {
          this.snackBar
            .open(
              `Đã chia đều ${names.join(', ')} vào ${this.expenses.length} khoản mục`,
              'Hoàn tác',
              { duration: 5000 }
            )
            .onAction()
            .subscribe(() => {
              this.billSplitterService.resetMemberParticipations(addedIds);
            });
        }
      }
      this.memberForm.reset();
    }
  }

  onAutoSplitChange(checked: boolean): void {
    this.autoSplit = checked;
    try {
      localStorage.setItem(AUTO_SPLIT_STORAGE_KEY, String(checked));
    } catch {
      // Storage bị chặn: bỏ qua, lựa chọn chỉ có hiệu lực trong phiên này
    }
  }

  private readAutoSplit(): boolean {
    try {
      return localStorage.getItem(AUTO_SPLIT_STORAGE_KEY) !== 'false';
    } catch {
      return true;
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
