import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  Observable,
  Subscription,
} from 'rxjs';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { AuthService } from '../../services/auth.service';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { LoginDialogComponent } from '../login-dialog/login-dialog';
import { MemberTableComponent } from '../member-table/member-table';
import { ResultDisplayComponent } from '../result-display/result-display';
import { BankComponent } from '../bank/bank';
import { PaymentComponent } from '../payment/payment';
import { formatAmount } from '../../shared/helpers';
import { SeoService } from '../../services';
import { BillTabControlService } from './bill-tab-control.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
    BankComponent,
    PaymentComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './bill-splitter.html',
  styleUrls: ['./bill-splitter.scss'],
})
export class BillSplitterComponent implements OnInit, AfterViewInit, OnDestroy {
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  isSaving$: Observable<boolean>;
  hasData: boolean = false;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  sub!: Subscription;
  today = new Date();
  nameCtrl = new FormControl();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private billTabControlService: BillTabControlService,
    private readonly billSplitterService: BillSplitterService,
    private readonly authService: AuthService,
    private readonly seoService: SeoService
  ) {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
    this.isSaving$ = this.billSplitterService.isSaving$;

    // Kiểm tra có dữ liệu để enable/disable nút share
    this.expenses$.subscribe((expenses) => {
      this.hasData = expenses.length > 0;
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

  async ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      const bill = await this.billSplitterService.fetchBill(code);
      this.snackBar.open('Đã tải dữ liệu thành công!', 'Đóng', {
        duration: 3000,
      });

      this.seoService.generateTags({
        title: `Hóa đơn ${bill.name}`,
        description: `Tổng tiền: ${formatAmount(
          bill.data.totalAmount
        )} - Số thành viên tham gia: ${bill.data.members.length}.`,
      });
    } else {
      this.billSplitterService.fetchBillFromStorage();
      this.route.queryParams.subscribe((params) => {
        const save = params['save'];
        if (save == 'true') {
          this.saveBill();
        }
      });
      this.seoService.generateTags();
    }
    const firstNameValue = this.billSplitterService.getName();
    if (firstNameValue) {
      this.nameCtrl.patchValue(firstNameValue, { emitEvent: false });
    }
  }

  ngAfterViewInit() {
    this.sub = this.billTabControlService.tabChange$.subscribe((index) => {
      this.tabGroup.selectedIndex = index;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
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
        await navigator.clipboard.writeText(
          `${window.location.origin}/${queryCode}`
        );
      } else {
        const code = await this.billSplitterService.createBill();
        await this.router.navigate(['/', code]);
        await navigator.clipboard.writeText(
          `${window.location.origin}/${queryCode}`
        );
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

  activateTab(index: number) {
    this.tabGroup.selectedIndex = index;
  }

  isEditable() {
    return this.billSplitterService.isEditable();
  }
}
