import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { Member } from '../../models/bill-splitter.model';
import { MatIconModule } from '@angular/material/icon';
import { QrPopupComponent } from '../qr-popup/qr-popup';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  formatAmount,
  removeVietnameseTones,
  roundedToThousand,
  summarizeRounding,
} from '../../shared/helpers';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, QRService } from '../../services';
import { EmptyStateComponent } from '../empty-state/empty-state';

interface IExpenseRowVM {
  id: string;
  name: string;
  amount: number;
  participants: string;
  totalPortions: number;
  perPerson: number | null;
  /** `perPerson` đã làm tròn lên nên khác giá trị thật: hiện "≈" trước số. */
  perPersonApprox: boolean;
  /** Đơn vị của `perPerson`: "người" khi mọi người đều ăn đúng 1 suất, "suất" khi có suất lẻ. */
  perUnit: 'người' | 'suất';
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
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly expenses = this.billSplitterService.expenses;
  private readonly members = this.billSplitterService.members;
  private readonly bankInfo = this.billSplitterService.bankInfo;

  readonly hasExpenses = computed(() => this.expenses().length > 0);
  readonly hasMembers = computed(() => this.members().length > 0);

  constructor() {
    // isEditable() phụ thuộc phiên đăng nhập, vốn khôi phục bất đồng bộ lúc khởi động.
    this.authService.user$.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  }

  /** Người xem bill chia sẻ (không phải chủ) không được sửa. */
  isEditable(): boolean {
    return this.billSplitterService.isEditable();
  }

  splitEvenly(expense: IExpenseRowVM): void {
    if (!this.isEditable()) return;
    const memberIds = this.members().map((member) => member.id);
    this.billSplitterService.splitExpenseEvenly(expense.id);
    // Nút biến mất sau khi chia nên focus rơi về body: báo kết quả qua snackbar (aria-live) + hoàn tác.
    this.snackBar
      .open(`Đã chia đều "${expense.name}" cho ${memberIds.length} người`, 'Hoàn tác', { duration: 5000 })
      .onAction()
      .subscribe(() => {
        memberIds.forEach((id) => this.billSplitterService.updateParticipation(id, expense.id, 0));
      });
  }

  /** View-model tính một lần mỗi khi expenses/members đổi, template chỉ đọc field. */
  readonly expenseRows = computed<IExpenseRowVM[]>(() => {
    const members = this.members();
    return this.expenses().map((expense) => {
      let totalPortions = 0;
      let hasPartialPortion = false;
      const names: string[] = [];
      for (const member of members) {
        const quantity = member.participations.get(expense.id) || 0;
        if (!quantity) continue;
        totalPortions += quantity;
        if (quantity !== 1) hasPartialPortion = true;
        // "0,5 suất" (dấu phẩy thập phân kiểu Việt) thay cho "x0.5" trông như mã.
        names.push(
          quantity === 1 ? member.name : `${member.name} (${quantity.toLocaleString('vi-VN')} suất)`
        );
      }
      const exactPerPerson = totalPortions > 0 ? expense.amount / totalPortions : null;
      const perPerson = exactPerPerson === null ? null : roundedToThousand(exactPerPerson);
      return {
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        participants: names.join(', '),
        totalPortions,
        // Làm tròn lên đến nghìn như số tiền mỗi người (thẻ thành viên, bảng tổng, QR) để cùng một
        // quy tắc ở mọi nơi; chỉ để hiển thị, không dùng để tính tiền.
        perPerson,
        perPersonApprox:
          perPerson !== null && exactPerPerson !== null && Math.abs(perPerson - exactPerPerson) > 0.5,
        // Chia theo suất: khi ai đó ăn nửa suất hay nhiều suất, số tiền này là giá MỖI SUẤT, không
        // phải mỗi người, nên không được ghi "/người".
        perUnit: hasPartialPortion ? 'suất' : 'người',
      };
    });
  });

  /** Có dòng khoản mục nào hiện giá "≈": cần một dòng chú thích vì cộng lại không khớp tổng. */
  readonly hasApproxPerPerson = computed(() => this.expenseRows().some((row) => row.perPersonApprox));

  readonly totalAmount = computed(() =>
    this.expenses().reduce((total, expense) => total + expense.amount, 0)
  );

  readonly memberRows = computed<IMemberRowVM[]>(() =>
    this.members().map((member) => ({
      member,
      displayAmount: roundedToThousand(member.totalAmount),
    }))
  );

  /**
   * Giải thích vì sao tổng thu lớn hơn hóa đơn. Chỉ khi mọi khoản mục đều có người tham gia: nếu có
   * khoản chưa ai ăn thì chênh lệch không đến từ làm tròn (đã có cảnh báo riêng ở khoản mục đó).
   */
  readonly roundingNote = computed(() => {
    const rows = this.expenseRows();
    if (!rows.length || rows.some((row) => row.totalPortions === 0)) return null;
    return summarizeRounding(
      this.members().map((member) => member.totalAmount),
      this.totalAmount()
    );
  });
  readonly isRoundingNoteOpen = signal(false);

  toggleRoundingNote() {
    this.isRoundingNoteOpen.update((isOpen) => !isOpen);
  }

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
    const bank = this.bankInfo();
    this.dialog.open(QrPopupComponent, {
      data: {
        // Tiêu đề cho người cầm điện thoại đối chiếu bằng mắt: QR của ai, bao nhiêu, vào đâu.
        title: `${member.name} · ${formatAmount(totalAmountFormatted)}`,
        subtitle: [bank.short_name, bank.accountName, bank.accountNumber].filter(Boolean).join(' · '),
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
    const bank = this.bankInfo();
    this.dialog.open(QrPopupComponent, {
      data: {
        title: `${member.name} · ${formatAmount(totalAmountFormatted)}`,
        // Hiện đúng trường mà QR Momo được dựng từ đó (accountNumberMomo), để đối chiếu với mã quét.
        subtitle: ['Momo', bank.accountNameMomo, bank.accountNumberMomo || bank.phoneNumberMomo]
          .filter(Boolean)
          .join(' · '),
        fileName,
        qrImageUrl,
        qrImageDownloadUrl,
      },
    });
  }
}
