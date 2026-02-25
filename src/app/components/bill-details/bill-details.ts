import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
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
  Observable,
  Subscription,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AuthService,
  BillAutoSaveService,
  BillSplitterService,
  SeoService,
} from '../../services';
import { formatAmount } from '../../shared/helpers';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog';
import { BillTabControlService } from './bill-tab-control.service';
import { ImageUploadComponent } from '../image-upload/image-upload';

interface ImagePreview {
  id?: number;
  file: File;
  url: string;
}

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
    ImageUploadComponent,
  ],
  templateUrl: './bill-details.html',
  styleUrl: './bill-details.scss',
})
export class BillDetails implements OnInit, OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly billTabControlService = inject(BillTabControlService);
  private readonly billAutoSaveService = inject(BillAutoSaveService);

  code!: string;
  nameCtrl = new FormControl();
  expenses$: Observable<ExpenseItem[]>;
  members$: Observable<Member[]>;
  isSaving$: Observable<boolean>;
  isChange$: Observable<boolean>;
  counter$: Observable<number>;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  sub!: Subscription;
  isEditable = false;
  oldImages: { id: number; url: string }[] = [];
  images: ImagePreview[] = [];

  constructor() {
    this.expenses$ = this.billSplitterService.expenses$;
    this.members$ = this.billSplitterService.members$;
    this.isSaving$ = this.billSplitterService.isSaving$;
    this.isChange$ = this.billSplitterService.isChange$;
    this.counter$ = this.billAutoSaveService.counter$;
    this.code = this.route.snapshot.paramMap.get('code') ?? '';
    this.nameCtrl.valueChanges
      .pipe(
        debounceTime(300), // tránh spam khi người dùng gõ liên tục
        distinctUntilChanged(),
        filter((value) => value !== null && value !== undefined),
      )
      .subscribe((name) => {
        this.billSplitterService.updateName(name);
      });

    this.counter$.pipe(
        distinctUntilChanged(),
        filter((value) => value !== null && value !== undefined),
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
    this.init().then(() => {
      this.billAutoSaveService.startMonitoring();
      this.isEditable = this.billSplitterService.isEditable();
    });
  }

  ngAfterViewInit() {
    this.sub = this.billTabControlService.tabChange$.subscribe((index) => {
      this.tabGroup.selectedIndex = index;
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
      this.oldImages = bill.files.map(({ id, url }) => ({ id, url }));
      this.billSplitterService.setFileIds(bill.files.map(({ id }) => id));
    }

    this.seoService.generateTags({
      title: `Hóa đơn ${bill.name}`,
      description: `Tổng tiền: ${formatAmount(
        bill.data.totalAmount,
      )} - Số thành viên tham gia: ${bill.data.members.length}.`,
    });
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
    const isChange = this.billSplitterService.getIsChange();
    if (isShare && (!this.isEditable || !isChange)) {
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
          .afterClosed(),
      );
      if (!confirmLogin) return;

      const loginResult = await firstValueFrom(
        this.dialog.open(LoginDialogComponent).afterClosed(),
      );
      if (!loginResult) return;
    }

    if (isChange) {
      if (this.images.length) {
        const oldFileIds = this.billSplitterService.getFileIds();
        const newImages = this.images.filter(({ id }) => !id).map(img => img.file);
        if (newImages.length) {
          const newFiles = await this.billSplitterService.uploadImages(newImages);
          const newFileIds = newFiles.map((file) => file.id);
          this.billSplitterService.setFileIds([...oldFileIds, ...newFileIds]);
        }
      }
      this.billSplitterService
        .updateBill(this.code)
        .then(() => {
          this.billSplitterService.updateIsChange(false);
          this.snackBar.open('Hóa đơn đã được lưu!', 'Đóng', {
            duration: 3000,
          });
          this.billAutoSaveService.stopCountdown();
          this.init();
        })
        .catch((error) => {
          console.error('Có lỗi khi lưu hóa đơn:', error);
        });
    }
    if (isShare) {
      await this.copyUrlToClipboard(this.code);
    }
  }

  private async copyUrlToClipboard(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/${code}`);
    this.snackBar.open('Đã sao chép URL vào khay nhớ tạm!', 'Đóng', {
      duration: 3000,
    });
  }
}
