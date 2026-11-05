
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, filter, Observable } from 'rxjs';
import { BankInfoItem } from '../../models/bank.model';
import { AuthService } from '../../services/auth.service';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QRService } from '../../services';
import { QrImageComponent } from '../qr-image/qr-image';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-bank',
  imports: [MatCardModule, MatButtonModule, MatIconModule, QrImageComponent],
  templateUrl: './bank.html',
  styleUrl: './bank.scss',
})
export class BankComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly qrService = inject(QRService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  bankInfo$: Observable<BankInfoItem>;
  bankInfo!: BankInfoItem;
  qrCodeUrl!: string;
  isShowMomoInfo = false;
  qrCodeUrlMomo!: string;
  isAccountNumberCopied = false;
  isMomoNumberCopied = false;

  constructor() {
    this.bankInfo$ = this.billSplitterService.bankInfo$;

    this.bankInfo$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        filter((value) => !!value),
        takeUntilDestroyed()
      )
      .subscribe((bankInfo) => {
        if (bankInfo) {
          this.bankInfo = bankInfo;
          this.fetchIsShowMomoInfo();
          this.getQrCodeUrl();
          this.getQrCodeUrlMomo();
          // OnPush: các trường QR/hiển thị được gán trong subscribe (đã debounce).
          this.cdr.markForCheck();
        }
      });

    // isEditable() phụ thuộc phiên đăng nhập, vốn khôi phục bất đồng bộ lúc khởi động.
    this.authService.user$.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  }

  ngOnInit(): void {
    this.bankInfo = this.billSplitterService.getBankInfo();
  }

  getQrCodeUrl() {
    if (this.bankInfo.accountNumber && this.bankInfo.bin) {
      const acc = this.bankInfo.accountNumber;
      const bin = this.bankInfo.bin;
      this.qrCodeUrl = this.qrService.buildQRCodeUrl(acc, bin);
    } else {
      this.qrCodeUrl = '';
    }
  }

  onCopyAccountNumber(event: Event) {
    event.stopPropagation();
    navigator.clipboard
      .writeText(this.bankInfo.accountNumber)
      .then(() => {
        this.snackBar.open('Số tài khoản đã được sao chép!', 'Đóng', {
          duration: 3000,
        });
        this.isAccountNumberCopied = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.isAccountNumberCopied = false;
          this.cdr.markForCheck();
        }, 2000);
      })
      .catch((err) => {
        console.error('Lỗi khi copy:', err);
      });
  }

  onCopyMomoAccountNumber(event: Event) {
    event.stopPropagation();
    navigator.clipboard
      .writeText(this.bankInfo.phoneNumberMomo)
      .then(() => {
        this.snackBar.open('Số điện thoại MOMO đã được sao chép!', 'Đóng', {
          duration: 3000,
        });
        this.isMomoNumberCopied = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.isMomoNumberCopied = false;
          this.cdr.markForCheck();
        }, 2000);
      })
      .catch((err) => {
        console.error('Lỗi khi copy:', err);
      });
  }

  /**
   * Nút cài đặt trên thẻ ngân hàng: cuộn tới form nhập thông tin nhận tiền (`#payment-section`, có ở
   * cả create-bill và bill-details). Thanh toán không còn là tab nên không chuyển tab nữa — trước
   * đây `changeTab(2)` bị kẹp về tab cuối ("Thành viên") ở mobile chỉ có 2 tab.
   */
  onSettingClick() {
    const target = document.getElementById('payment-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isEditable() {
    return this.billSplitterService.isEditable();
  }

  fetchIsShowMomoInfo() {
    this.isShowMomoInfo = !!(
      this.bankInfo.accountNameMomo && this.bankInfo.phoneNumberMomo
    );
  }

  getQrCodeUrlMomo() {
    if (this.bankInfo.accountNumberMomo) {
      const acc = this.bankInfo.accountNumberMomo;
      this.qrCodeUrlMomo = this.qrService.buildMomoQRCodeUrl(acc);
    } else {
      this.qrCodeUrlMomo = '';
    }
  }
}
