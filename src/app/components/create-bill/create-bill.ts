import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { MemberTableComponent } from '../member-table/member-table';
import { ResultDisplayComponent } from '../result-display/result-display';
import { BankComponent } from '../bank/bank';
import { PaymentComponent } from '../payment/payment';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { debounceTime, distinctUntilChanged, filter, firstValueFrom, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, BillSplitterService, SeoService } from '../../services';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-create-bill',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatTabsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    ExpenseFormComponent,
    MemberTableComponent,
    ResultDisplayComponent,
    BankComponent,
    PaymentComponent,
  ],
  templateUrl: './create-bill.html',
  styleUrl: './create-bill.scss',
})
export class CreateBill implements OnInit {
  nameCtrl = new FormControl();
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  isSaving$: Observable<boolean>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly billSplitterService: BillSplitterService,
    private readonly authService: AuthService,
    private readonly seoService: SeoService
  ) {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
    this.isSaving$ = this.billSplitterService.isSaving$;
    this.patchValueNameCtrl();
  }

  ngOnInit() {
    this.billSplitterService.fetchBillFromStorage();
      this.route.queryParams.subscribe((params) => {
        if (params['save'] && params['save'] === 'true') {
          this.save();
        }
      });
    this.nameCtrl.valueChanges
      .pipe(
        debounceTime(300), // tránh spam khi người dùng gõ liên tục
        distinctUntilChanged(),
        filter((value) => value !== null && value !== undefined)
      )
      .subscribe((name) => {
        this.billSplitterService.updateName(name);
      });
  }

  async save(isShare?: boolean) {
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
      if (!confirmLogin) return;
      this.billSplitterService.saveBillToStorage();
      const loginResult = await firstValueFrom(
        this.dialog.open(LoginDialogComponent).afterClosed()
      );
      if (!loginResult) return;
    }
    const code = await this.billSplitterService.createBill();
    if (isShare) {
      await this.copyUrlToClipboard(code);
    }
    await this.router.navigate(['/', code]);
  }

  private patchValueNameCtrl() {
    const firstNameValue = this.billSplitterService.getName();
    if (firstNameValue) {
      this.nameCtrl.patchValue(firstNameValue, { emitEvent: false });
    }
  }

  private  async copyUrlToClipboard(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/${code}`);
    this.snackBar.open('Đã sao chép URL vào khay nhớ tạm!', 'Đóng', {
      duration: 3000,
    });
  }
}
