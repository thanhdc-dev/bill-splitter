import { AsyncPipe, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { MemberTableComponent } from '../member-table/member-table';
import { ResultDisplayComponent } from '../result-display/result-display';
import { BankComponent } from '../bank/bank';
import { PaymentComponent } from '../payment/payment';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { RevealOnScroll } from '../../directives/reveal-on-scroll';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  Observable,
} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, BillShareService, BillSplitterService, UserService } from '../../services';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BillTabControlService } from '../bill-details/bill-tab-control.service';
import { BANKS } from '../../constants';
import { SettingsData } from '../../interfaces';
import { BankInfoItem } from '../../models';
import { ImageUploadComponent, ImagePreview } from '../image-upload/image-upload';

/* Cùng ngưỡng với member-table.ts (MOBILE_BREAKPOINT) để "mobile vs desktop" nhất quán trong
   toàn bộ trang tạo hoá đơn — dưới 768px thấy tab, từ 768px thấy layout 2 cột. */
const MOBILE_BREAKPOINT = '(max-width: 767px)';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-bill',
  imports: [
    AsyncPipe,
    NgClass,
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
    ImageUploadComponent,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RevealOnScroll,
  ],
  templateUrl: './create-bill.html',
  styleUrl: './create-bill.scss',
})
export class CreateBill implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  /** Số ảnh upload lỗi ở lần lưu gần nhất; báo sau khi lưu xong để không bị snackbar khác đè. */
  private failedUploadCount = 0;
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly billShareService = inject(BillShareService);
  private readonly authService = inject(AuthService);
  private readonly billTabControlService = inject(BillTabControlService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('tabGroup') tabGroup?: MatTabGroup;

  nameCtrl = new FormControl();
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  isSaving$: Observable<boolean>;
  files: File[] = [];
  /** null = không đang upload; 0-100 = % tiến trình của batch upload ảnh hiện tại. */
  uploadProgress: number | null = null;
  /** Dưới 768px: tab Khoản mục/Thành viên. Từ 768px: 2 cột song song, không có tabGroup. */
  isMobile = false;

  constructor() {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
    this.isSaving$ = this.billSplitterService.isSaving$;
    this.patchValueNameCtrl();

    this.breakpointObserver
      .observe(MOBILE_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        this.isMobile = matches;
        this.cdr.markForCheck();
      });
  }

  ngOnInit() {
    this.billSplitterService.fetchBillFromStorage();
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['save'] && params['save'] === 'true') {
        this.save();
      } else if (params['restore'] === 'true') {
        // Quay lại sau login từ popup upload ảnh: giữ nguyên dữ liệu đã nhập, chưa tạo bill.
        this.billSplitterService.finishRestoreDraft();
        this.patchValueNameCtrl();
        this.cdr.markForCheck();
      } else {
        this.billSplitterService.resetBill();
        this.fetchUserSetting();
      }
    });
    this.nameCtrl.valueChanges
      .pipe(
        debounceTime(300), // tránh spam khi người dùng gõ liên tục
        distinctUntilChanged(),
        filter((value) => value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((name) => {
        this.billSplitterService.updateName(name);
      });
  }

  ngAfterViewInit() {
    this.billTabControlService.tabChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((index) => {
        // tabGroup chỉ tồn tại ở layout mobile (dưới 768px) — ở layout 2 cột desktop không có
        // tab nào để chuyển tới.
        if (this.tabGroup) {
          this.tabGroup.selectedIndex = index;
        }
      });
  }

  async save(isShare?: boolean) {
    this.failedUploadCount = 0;
    await this.authService.whenReady();
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
          .afterClosed(),
      );
      if (!confirmLogin) return;
      // Guest không được upload ảnh (backend cần biết user) — chỉ lưu bill local rồi đăng nhập.
      this.billSplitterService.saveBillToStorage();
      const loginResult = await firstValueFrom(
        this.dialog.open(LoginDialogComponent).afterClosed(),
      );
      if (!loginResult) return;
    } else if (this.files.length) {
      const fileIds = await this.uploadImagesWithProgress();
      this.billSplitterService.setFileIds(fileIds);
    }
    const code = await this.billSplitterService.createBill();
    this.billSplitterService.updateIsChange(false);
    if (isShare) {
      await this.billShareService.share(code, this.billSplitterService.getName());
    }
    await this.router.navigate(['/', code]);
    this.notifyFailedUploads();
  }

  private notifyFailedUploads() {
    if (!this.failedUploadCount) return;
    this.snackBar.open(
      `${this.failedUploadCount} ảnh tải lên thất bại. Bạn có thể tải lại trong chi tiết hóa đơn`,
      'Đóng',
      { duration: 5000 }
    );
    this.failedUploadCount = 0;
  }

  /**
   * Ảnh chỉ là thông tin bổ sung: ảnh lỗi bị bỏ qua (báo bằng snackbar) để bill vẫn được lưu,
   * user có thể upload lại ở màn hình bill-details.
   */
  private async uploadImagesWithProgress(): Promise<number[]> {
    this.setUploadProgress(0);
    try {
      const { uploaded, failed } = await this.billSplitterService.uploadImages(
        this.files,
        (percent) => this.setUploadProgress(percent)
      );
      this.failedUploadCount = failed.length;
      return uploaded.map((file) => file.id);
    } finally {
      this.setUploadProgress(null);
    }
  }

  /** OnPush: tiến trình upload được gán từ callback ngoài template nên phải đánh dấu thủ công. */
  private setUploadProgress(value: number | null) {
    this.uploadProgress = value;
    this.cdr.markForCheck();
  }

  onImagesChanged(images: ImagePreview[]) {
    this.files = images.map((img) => img.file).filter((f): f is File => !!f);
  }

  private patchValueNameCtrl() {
    const firstNameValue = this.billSplitterService.getName();
    if (firstNameValue) {
      this.nameCtrl.patchValue(firstNameValue, { emitEvent: false });
    }
  }

  private async fetchUserSetting() {
    await this.authService.whenReady();
    if (this.authService.isLoggedIn()) {
      Promise.all([
        this.userService.getSettingBankAccount(),
        this.userService.getSettingMomoWallet(),
      ]).then(
        ([bankAccount, momoWallet]: [
          SettingsData['bankAccount'],
          SettingsData['momoWallet'],
        ]) => {
          const bankInfo: BankInfoItem = {
            bank: '',
            name: '',
            short_name: '',
            bin: '',
            accountName: '',
            accountNumber: '',
            accountNumberMomo: '',
            accountNameMomo: '',
            phoneNumberMomo: '',
          };
          const bank = BANKS.find(({ bin }) => bin == bankAccount.bankBin);
          if (bank || (momoWallet && Object.keys(momoWallet).length)) {
            if (bank) {
              bankInfo.bank = bank.code;
              bankInfo.name = bank.name;
              bankInfo.short_name = bank.short_name;
              bankInfo.bin = bankAccount.bankBin;
              bankInfo.accountName = bankAccount.accountName;
              bankInfo.accountNumber = bankAccount.accountNumber;
            }
            if (momoWallet && Object.keys(momoWallet).length) {
              bankInfo.accountNumberMomo = momoWallet.accountNumber;
              bankInfo.accountNameMomo = momoWallet.accountName;
              bankInfo.phoneNumberMomo = momoWallet.phoneNumber;
            }
            this.billSplitterService.updateBankInfo(bankInfo, true);
          }
        },
      );
    }
  }
}
