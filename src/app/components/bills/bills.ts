import { Component, OnInit, inject } from '@angular/core';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { BillShareService } from '../../services/bill-share.service';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { MatDialog } from '@angular/material/dialog';
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
  private readonly router = inject(Router);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly billShareService = inject(BillShareService);

  bills: Bill[] = [];
  /** Tách "đang tải" / "lỗi" / "không có hóa đơn nào" để không hiện nhầm empty state. */
  isLoading = true;
  hasError = false;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.hasError = false;
    try {
      this.bills = await this.billSplitterService.getBills();
    } catch (err) {
      // Không có dữ liệu vì lỗi mạng là chuyện khác hẳn với "chưa có hóa đơn nào".
      console.error('Lỗi khi tải danh sách hóa đơn:', err);
      this.bills = [];
      this.hasError = true;
    } finally {
      this.isLoading = false;
    }
  }

  onItemClick(code: string): void {
    this.router.navigate([`/${code}`]);
  }

  onShareUrl(event: Event, bill: Bill): void {
    event.stopPropagation(); // Ngăn việc trigger click của item
    void this.billShareService.share(bill.code, bill.name);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  /** Ngày trong tháng cho "cuống vé" — vd "12". */
  getStubDay(dateString: string): string {
    return new Date(dateString).getDate().toString().padStart(2, '0');
  }

  /** Tháng viết tắt cho "cuống vé" — vd "thg 9". */
  getStubMonth(dateString: string): string {
    return `thg ${new Date(dateString).getMonth() + 1}`;
  }

  async onDelete(event: Event, billCode: string) {
    event.stopPropagation();
    const confirmLogin = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Xác nhận',
            message: `Bạn có chắc muốn xóa bill #${billCode}`,
            confirmText: 'Xóa',
            cancelText: 'Hủy',
          },
        })
        .afterClosed()
    );

    if (confirmLogin) {
      await this.billSplitterService.delete(billCode);
      await this.loadData();
    }
  }
}
