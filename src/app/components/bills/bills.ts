import { Component, OnInit, inject } from '@angular/core';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { firstValueFrom } from 'rxjs';

interface Bill {
  code: string;
  name: string;
  createdAt: string;
}

@Component({
  selector: 'app-bills',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './bills.html',
  styleUrl: './bills.scss',
})
export class Bills implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly billSplitterService = inject(BillSplitterService);

  bills: Bill[] = [];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.bills = await this.billSplitterService.getBills();
  }

  onItemClick(code: string): void {
    this.router.navigate([`/${code}`]);
  }

  onCopyUrl(event: Event, code: string): void {
    event.stopPropagation(); // Ngăn việc trigger click của item
    const url = `${window.location.origin}/${code}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        // Có thể thêm thông báo toast ở đây
        this.snackBar.open('URL đã được sao chép!', 'Đóng', {
          duration: 3000,
        });
      })
      .catch((err) => {
        console.error('Lỗi khi copy URL:', err);
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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
