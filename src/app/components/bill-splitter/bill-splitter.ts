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
  isChange$: Observable<boolean>;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  sub!: Subscription;
  today = new Date();
  nameCtrl = new FormControl();
  countdown: number = 5;
  code: string | null = null;
  private countdownTimer: any;

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
    this.isChange$ = this.billSplitterService.isChange$;

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
    this.route.params.subscribe((params) => {
      this.code = params['code'];
      if (this.code) {
        this.loadData(this.code).then((bill) => {
          this.seoService.generateTags({
            title: `Hóa đơn ${bill.name}`,
            description: `Tổng tiền: ${formatAmount(
              bill.data.totalAmount
            )} - Số thành viên tham gia: ${bill.data.members.length}.`,
          });

          this.isChange$.subscribe((isChange) => {
            if (isChange) {
              this.resetTimers();
            } else {
              this.cancelTimers();
            }
          });

          this.patchValueNameCtrl();
        });
      }
    });
    if (this.code) {
      this.billSplitterService.fetchBill(this.code).then((bill) => {
        this.snackBar.open('Đã tải dữ liệu thành công!', 'Đóng', {
          duration: 3000,
        });

        this.seoService.generateTags({
          title: `Hóa đơn ${bill.name}`,
          description: `Tổng tiền: ${formatAmount(
            bill.data.totalAmount
          )} - Số thành viên tham gia: ${bill.data.members.length}.`,
        });

        this.isChange$.subscribe((isChange) => {
          if (isChange) {
            this.resetTimers();
          } else {
            this.cancelTimers();
          }
        });

        this.patchValueNameCtrl();
      });
    } else {
      this.billSplitterService.fetchBillFromStorage();
      this.route.queryParams.subscribe((params) => {
        const save = params['save'];
        if (save == 'true') {
          this.saveBill(true);
        }
      });
      this.seoService.generateTags();

      this.patchValueNameCtrl();
    }
  }

  ngAfterViewInit() {
    this.sub = this.billTabControlService.tabChange$.subscribe((index) => {
      this.tabGroup.selectedIndex = index;
    });
  }

  ngOnDestroy() {
    this.cancelTimers();
    this.sub?.unsubscribe();
  }

  async loadData(code: string) {
    const bill = await this.billSplitterService.fetchBill(code);
    this.snackBar.open('Đã tải dữ liệu thành công!', 'Đóng', {
      duration: 3000,
    });
    return bill;
  }

  async saveBill(isShare?: boolean): Promise<void> {
    if (!this.isEditable() && this.code) {
      return this.copyUrlToClipboard(this.code);
    }
    this.cancelTimers();

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

    const isChange = this.billSplitterService.getIsChange();
    try {
      if (this.code) {
        if (isChange) {
          await this.billSplitterService.updateBill(this.code);
        }
        if (isShare) {
          await this.copyUrlToClipboard(this.code);
        }
      } else {
        const code = await this.billSplitterService.createBill();
        if (isShare) {
          await this.copyUrlToClipboard(code);
        }
        await this.router.navigate(['/', code]);
      }
      this.billSplitterService.updateIsChange(false);
    } catch (error) {
      this.snackBar.open('Lỗi khi lưu dữ liệu!', 'Đóng', {
        duration: 3000,
      });
    }
  }

  async copyUrlToClipboard(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/${code}`);
    this.snackBar.open('Đã sao chép URL vào khay nhớ tạm!', 'Đóng', {
      duration: 3000,
    });
  }

  activateTab(index: number) {
    this.tabGroup.selectedIndex = index;
  }

  isEditable() {
    return this.billSplitterService.isEditable();
  }

  resetTimers() {
    this.cancelTimers();
    if (this.code && this.isEditable()) {
      // Khởi động đếm ngược
      this.countdown = 5;
      this.countdownTimer = setInterval(() => {
        this.countdown--;
        console.log(this.countdownTimer);
        if (this.countdown === 0) {
          this.autoSave();
        }
      }, 1000);
    }
  }

  cancelTimers() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdown = 0;
    }
  }

  autoSave() {
    this.cancelTimers();
    this.saveBill();
  }

  private patchValueNameCtrl() {
    const firstNameValue = this.billSplitterService.getName();
    if (firstNameValue) {
      this.nameCtrl.patchValue(firstNameValue, { emitEvent: false });
    }
  }
}
