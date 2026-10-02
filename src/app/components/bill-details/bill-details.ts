import { AsyncPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExpenseFormComponent } from '../expense-form/expense-form';
import { MemberTableComponent } from '../member-table/member-table';
import { ResultDisplayComponent } from '../result-display/result-display';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { BankComponent } from '../bank/bank';
import { PaymentComponent } from '../payment/payment';
import { ExpenseItem, Member } from '../../models/bill-splitter.model';
import { RevealOnScroll } from '../../directives/reveal-on-scroll';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  Observable,
  Subscription,
} from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AuthService,
  BillAutoSaveService,
  BillShareService,
  BillSplitterService,
  SeoService,
} from '../../services';
import { formatAmount } from '../../shared/helpers';
import { ILoginDialogData, LoginDialogComponent } from '../login-dialog/login-dialog';
import { BillTabControlService } from './bill-tab-control.service';
import { ImageUploadComponent, ImagePreview } from '../image-upload/image-upload';

/* Cùng ngưỡng với create-bill.ts/member-table.ts — dưới 768px thấy tab, từ 768px thấy layout
   2 cột, để 2 trang nhất quán về hành vi responsive. */
const MOBILE_BREAKPOINT = '(max-width: 767px)';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bill-details',
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
    EmptyStateComponent,
    RouterLink,
  ],
  templateUrl: './bill-details.html',
  styleUrl: './bill-details.scss',
})
export class BillDetails implements OnInit, OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly billShareService = inject(BillShareService);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly billTabControlService = inject(BillTabControlService);
  private readonly billAutoSaveService = inject(BillAutoSaveService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly cdr = inject(ChangeDetectorRef);

  code!: string;
  nameCtrl = new FormControl();
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  isSaving$: Observable<boolean>;
  isChange$: Observable<boolean>;
  counter$: Observable<number>;
  @ViewChild('tabGroup') tabGroup?: MatTabGroup;
  sub!: Subscription;
  isEditable = false;
  /** Trạng thái tải bill lần đầu — mẫu giống bills.ts. */
  isLoading = true;
  hasError = false;
  notFound = false;
  oldImages: { id: number; storagePath: string }[] = [];
  images: ImagePreview[] = [];
  /** null = không đang upload; 0-100 = % tiến trình của batch upload ảnh hiện tại. */
  uploadProgress: number | null = null;
  /** Dưới 768px: tab Khoản mục/Thành viên. Từ 768px: 2 cột song song, không có tabGroup. */
  isMobile = false;


  constructor() {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
    this.isSaving$ = this.billSplitterService.isSaving$;
    this.isChange$ = this.billSplitterService.isChange$;
    this.counter$ = this.billAutoSaveService.counter$;
    this.code = this.route.snapshot.paramMap.get('code') ?? '';

    this.breakpointObserver
      .observe(MOBILE_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe(({ matches }) => {
        this.isMobile = matches;
        this.cdr.markForCheck();
      });
    this.nameCtrl.valueChanges
      .pipe(
        debounceTime(300), // tránh spam khi người dùng gõ liên tục
        distinctUntilChanged(),
        filter((value) => value !== null && value !== undefined),
        takeUntilDestroyed(),
      )
      .subscribe((name) => {
        this.billSplitterService.updateName(name);
      });

    this.counter$.pipe(
        distinctUntilChanged(),
        filter((value) => value !== null && value !== undefined),
        takeUntilDestroyed(),
      ).subscribe((counter) => {
      if (counter === 0) {
        const isChange = this.billSplitterService.getIsChange();
        if (isChange) {
          this.save();
        }
      }
    });
  }

  ngOnInit() {
    void this.loadBill();
  }

  /** Tải bill lần đầu và cả khi bấm "Thử lại"; lỗi 404 tách riêng với lỗi kết nối. */
  async loadBill() {
    this.isLoading = true;
    this.hasError = false;
    this.notFound = false;
    this.cdr.markForCheck();
    try {
      await this.init();
    } catch (error) {
      this.notFound = error instanceof HttpErrorResponse && error.status === 404;
      this.hasError = !this.notFound;
      return;
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
    await this.authService.whenReady();
    this.billAutoSaveService.startMonitoring();
    this.isEditable = this.billSplitterService.isEditable();
    this.cdr.markForCheck();
  }

  ngAfterViewInit() {
    this.sub = this.billTabControlService.tabChange$.subscribe((index) => {
      // tabGroup chỉ tồn tại ở layout mobile (dưới 768px) hoặc khi isEditable=false (không có
      // tab nào) — ở layout 2 cột desktop hoặc chế độ chỉ đọc không có tab nào để chuyển tới.
      if (this.tabGroup) {
        this.tabGroup.selectedIndex = index;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.billAutoSaveService.stopMonitoring();
  }

  async init() {
    this.oldImages = [];
    this.images = [];
    const bill = await this.billSplitterService.fetchBill(this.code);
    this.nameCtrl.patchValue(bill.name, { emitEvent: false });

    if (bill.files) {
      this.oldImages = bill.files.map(({ id, storagePath }) => ({ id, storagePath }));
      this.billSplitterService.setFileIds(bill.files.map(({ id }) => id));
    }


    this.seoService.generateTags({
      title: `Hóa đơn ${bill.name}`,
      description: `Tổng tiền: ${formatAmount(
        bill.data.totalAmount,
      )} - Số thành viên tham gia: ${bill.data.members.length}.`,
    });
    // OnPush: oldImages/nameCtrl được gán sau await nên phải đánh dấu thủ công.
    this.cdr.markForCheck();
  }

  /** OnPush: tiến trình upload được gán từ callback ngoài template nên phải đánh dấu thủ công. */
  private setUploadProgress(value: number | null) {
    this.uploadProgress = value;
    this.cdr.markForCheck();
  }

  onImagesChanged(images: ImagePreview[]) {
    this.images = images;
    const imageIds = images.filter(({ id }) => id !== undefined).map(({ id }) => id) as number[];
    // Kiểm tra nếu số lượng ảnh đã thay đổi so với ảnh cũ → đánh dấu có thay đổi
    const isAddingNewImage = images.some(({ id }) => !id);
    const isRemovingImage = this.oldImages.some(oldImg => !imageIds.includes(oldImg.id));
    if (isAddingNewImage || isRemovingImage) {
      this.billSplitterService.updateIsChange(true);
    }
    this.billSplitterService.setFileIds(imageIds);
  }

  async save(isShare?: boolean) {
    await this.authService.whenReady();
    const isChange = this.billSplitterService.getIsChange();
    if (isShare && (!this.isEditable || !isChange)) {
      await this.billShareService.share(this.code, this.billSplitterService.getName());
      return;
    }

    if (!this.authService.isLoggedIn()) {
      const loginResult = await firstValueFrom(
        this.dialog
          .open<LoginDialogComponent, ILoginDialogData>(LoginDialogComponent, {
            data: { message: 'Bạn cần đăng nhập để lưu và chia sẻ' },
          })
          .afterClosed(),
      );
      if (!loginResult) return;
    }

    if (isChange) {
      try {
        let failedCount = 0;
        if (this.images.length) {
          const oldFileIds = this.billSplitterService.getFileIds();
          const newImages = this.images.filter(({ id }) => !id).map(img => img.file!).filter(Boolean);
          if (newImages.length) {
            this.setUploadProgress(0);
            try {
              const { uploaded, failed } = await this.billSplitterService.uploadImages(
                newImages,
                (percent) => this.setUploadProgress(percent)
              );
              const newFileIds = uploaded.map((file) => file.id);
              this.billSplitterService.setFileIds([...oldFileIds, ...newFileIds]);
              failedCount = failed.length;
            } finally {
              this.setUploadProgress(null);
            }
          }
        }
        await this.billSplitterService.updateBill(this.code);
        this.billSplitterService.updateIsChange(false);
        this.snackBar.open('Hóa đơn đã được lưu!', 'Đóng', {
          duration: 3000,
        });
        this.billAutoSaveService.stopCountdown();
        // Tải lại để đồng bộ id ảnh/dữ liệu server; bill đã lưu rồi nên lỗi ở đây chỉ log.
        this.init().catch((error) => console.error('Có lỗi khi tải lại hóa đơn:', error));
        if (failedCount) {
          // Ảnh chỉ là thông tin bổ sung: bill đã lưu, user có thể chọn lại ảnh lỗi.
          this.snackBar.open(`${failedCount} ảnh tải lên thất bại, vui lòng thử lại`, 'Đóng', {
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Có lỗi khi lưu hóa đơn:', error);
        this.snackBar.open('Không lưu được hóa đơn. Vui lòng thử lại.', 'Đóng', {
          duration: 5000,
        });
        // Không chia sẻ link của bản chưa lưu được.
        return;
      }
    }
    if (isShare) {
      await this.billShareService.share(this.code, this.billSplitterService.getName());
    }
  }
}
