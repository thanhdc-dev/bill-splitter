import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { BillShareService } from '../../services/bill-share.service';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { firstValueFrom } from 'rxjs';

interface Bill {
  code: string;
  name: string;
  createdAt: string;
  data: {
    totalAmount: number;
    members: { id: string }[];
  };
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bills',
  imports: [
    CurrencyPipe,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
    EmptyStateComponent,
  ],
  templateUrl: './bills.html',
  styleUrl: './bills.scss',
})
export class Bills implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly billShareService = inject(BillShareService);

  readonly bills = signal<Bill[]>([]);
  /** Tách "đang tải" / "lỗi" / "không có hóa đơn nào" để không hiện nhầm empty state. */
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  /** Ngày hiển thị được format một lần khi danh sách đổi, thay vì mỗi lần change detection. */
  readonly billRows = computed(() =>
    this.bills().map((bill) => {
      const date = new Date(bill.createdAt);
      return {
        bill,
        dateLabel: date.toLocaleDateString('vi-VN'),
        // "cuống vé": ngày "12" và tháng viết tắt "thg 9"
        stubDay: date.getDate().toString().padStart(2, '0'),
        stubMonth: `thg ${date.getMonth() + 1}`,
      };
    })
  );

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    this.hasError.set(false);
    try {
      this.bills.set(await this.billSplitterService.getBills());
    } catch (err) {
      // Không có dữ liệu vì lỗi mạng là chuyện khác hẳn với "chưa có hóa đơn nào".
      console.error('Lỗi khi tải danh sách hóa đơn:', err);
      this.bills.set([]);
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  onItemClick(code: string): void {
    this.router.navigate([`/${code}`]);
  }

  onShareUrl(event: Event, bill: Bill): void {
    event.stopPropagation(); // Ngăn việc trigger click của item
    void this.billShareService.share(bill.code, bill.name);
  }

  async onDelete(event: Event, billCode: string) {
    event.stopPropagation();
    const confirmLogin = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Xác nhận',
            message: `Bạn có chắc muốn xóa hóa đơn #${billCode}?`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
          },
        })
        .afterClosed()
    );

    if (!confirmLogin) return;

    try {
      await this.billSplitterService.delete(billCode);
    } catch (err) {
      console.error('Lỗi khi xóa hóa đơn:', err);
      this.snackBar.open('Không xóa được hóa đơn. Vui lòng thử lại.', 'Đóng', { duration: 5000 });
      return;
    }
    this.snackBar.open(`Đã xóa hóa đơn #${billCode}`, 'Đóng', { duration: 3000 });
    await this.loadData();
  }
}
