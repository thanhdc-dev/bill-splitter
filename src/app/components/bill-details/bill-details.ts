import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { MemberTableComponent } from '../member-table/member-table';
import { ResultDisplayComponent } from '../result-display/result-display';
import { BankComponent } from '../bank/bank';
import { PaymentComponent } from '../payment/payment';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  interval,
  Observable,
  Subscription,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, BillSplitterService, SeoService } from '../../services';
import { formatAmount } from '../../shared/helpers';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog';
import { BillTabControlService } from './bill-tab-control.service';

@Component({
  selector: 'app-bill-details',
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
  templateUrl: './bill-details.html',
  styleUrl: './bill-details.scss',
})
export class BillDetails implements OnInit, OnDestroy {
  code!: string;
  nameCtrl = new FormControl();
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  isSaving$: Observable<boolean>;
  isChange$: Observable<boolean>;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  sub!: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly billSplitterService: BillSplitterService,
    private readonly authService: AuthService,
    private readonly seoService: SeoService,
    private readonly billTabControlService: BillTabControlService
  ) {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
    this.isSaving$ = this.billSplitterService.isSaving$;
    this.isChange$ = this.billSplitterService.isChange$;
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
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

  ngOnInit() {
    this.loadData().then((bill) => {
      this.nameCtrl.patchValue(bill.name, { emitEvent: false });

      this.seoService.generateTags({
        title: `Hóa đơn ${bill.name}`,
        description: `Tổng tiền: ${formatAmount(
          bill.data.totalAmount
        )} - Số thành viên tham gia: ${bill.data.members.length}.`,
      });
    });
  }

  ngAfterViewInit() {
    this.sub = this.billTabControlService.tabChange$.subscribe((index) => {
      this.tabGroup.selectedIndex = index;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  isEditable() {
    return this.billSplitterService.isEditable();
  }

  async save(isShare?: boolean) {
    const isChange = this.billSplitterService.getIsChange();
    if (isShare && (!this.isEditable() || !isChange)) {
      this.copyUrlToClipboard(this.code);
      return;
    }

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

      const loginResult = await firstValueFrom(
        this.dialog.open(LoginDialogComponent).afterClosed()
      );
      if (!loginResult) return;
    }

    if (isChange) {
      await this.billSplitterService.updateBill(this.code);
      this.billSplitterService.updateIsChange(false);
    }
    if (isShare) {
      await this.copyUrlToClipboard(this.code);
    }
  }

  private async loadData() {
    const bill = await this.billSplitterService.fetchBill(this.code);
    this.snackBar.open('Đã tải dữ liệu thành công!', 'Đóng', {
      duration: 3000,
    });
    return bill;
  }

  private async copyUrlToClipboard(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/${code}`);
    this.snackBar.open('Đã sao chép URL vào khay nhớ tạm!', 'Đóng', {
      duration: 3000,
    });
  }
}
