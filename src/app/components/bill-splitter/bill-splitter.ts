import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { AuthService } from '../../services/auth.service';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { LoginDialogComponent } from '../login-dialog/login-dialog';
import { MemberTableComponent } from '../member-table/member-table';
import { ResultDisplayComponent } from '../result-display/result-display';

@Component({
  selector: 'app-bill-splitter',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTabsModule,
    ExpenseFormComponent,
    MemberTableComponent,
    ResultDisplayComponent,
  ],
  templateUrl: './bill-splitter.html',
  styleUrls: ['./bill-splitter.scss'],
})
export class BillSplitterComponent implements OnInit {
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  isSaving$: Observable<boolean>;
  hasData: boolean = false;
  isAuthor: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private billSplitterService: BillSplitterService,
    private authService: AuthService,
  ) {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
    this.isSaving$ = this.billSplitterService.isSaving$;

    // Kiểm tra có dữ liệu để enable/disable nút share
    this.expenses$.subscribe((expenses) => {
      this.hasData = expenses.length > 0;
    });
  }

  async ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      try {
        await this.billSplitterService.loadBill(code);
        this.snackBar.open('Đã tải dữ liệu thành công!', 'Đóng', {
          duration: 3000,
        });
        if (this.authService.isLoggedIn()) {
          const userLoggedIn = this.authService.getUserId();
          this.isAuthor = userLoggedIn
            ? userLoggedIn == this.billSplitterService.getUserId()
            : false;
        } else {
          this.isAuthor = false;
        }
      } catch (error) {
        this.snackBar.open('Không thể tải dữ liệu!', 'Đóng', {
          duration: 3000,
        });
      }
    } else {
      this.billSplitterService.loadBillFromStorage();
      this.route.queryParams.subscribe((params) => {
        const save = params['save'];
        if (save == 'true') {
          this.saveBill();
        }
      });
    }
  }

  async saveBill(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      const confirmLogin = await firstValueFrom(
        this.dialog
          .open(ConfirmDialogComponent, {
            data: {
              title: 'Xác nhận',
              message: 'Bạn cần đăng nhập để lưu và chia sẻ',
              confirmText: 'Đăng nhập',
              cancelText: 'Hủy',
            },
          })
          .afterClosed()
      );

      if (confirmLogin) {
        const loginResult = await firstValueFrom(
          this.dialog.open(LoginDialogComponent).afterClosed()
        );
        if (!loginResult) return;
      } else {
        return;
      }
    }

    try {
      const queryCode = this.route.snapshot.paramMap.get('code');
      if (queryCode) {
        await this.billSplitterService.updateBill(queryCode);
        await navigator.clipboard.writeText(`${window.location.origin}/${queryCode}`);
      } else {
        const code = await this.billSplitterService.createBill();
        await this.router.navigate(['/', code]);
        await navigator.clipboard.writeText(`${window.location.origin}/${queryCode}`);
      }
      this.snackBar.open('Đã Lưu và sao chép URL vào khay nhớ tạm!', 'Đóng', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open('Lỗi khi lưu dữ liệu!', 'Đóng', {
        duration: 3000,
      });
    }
  }

  private getFullPathWithoutQuery(): string {
    const origin = window.location.origin;
    const path = this.router.url.split('?')[0].split('#')[0];
    return origin + path;
  }
}
